import { detectTemplateSectionInfo } from "@/lib/editor/template-section-detection";
import type { EditorBlock, TemplateHtmlEnvelope } from "@/types/template";
import { buildBlock } from "./presets";

type HtmlNodeTag = "table" | "tbody" | "tr" | "td";

type HtmlNode = {
  tag: HtmlNodeTag;
  start: number;
  openEnd: number;
  closeStart: number;
  end: number;
  parent: HtmlNode | null;
  children: HtmlNode[];
};

type RowContainerCandidate = {
  table: HtmlNode;
  container: HtmlNode;
  rows: HtmlNode[];
  mode: "tbody" | "table";
};

export type ParsedHtmlBlocksResult = {
  blocks: EditorBlock[];
  htmlEnvelope: TemplateHtmlEnvelope | null;
};

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function detectSectionName(html: string): string {
  const lower = html.toLowerCase();

  if (lower.includes("<!-- brand footer") || lower.includes("<!-- footer / brand")) {
    return "Alt Bilgi";
  }
  if (lower.includes("<!-- footer / legal")) {
    return "Yasal Bilgiler";
  }
  if (lower.includes("<!-- invoice / support")) {
    return "Fatura / Destek";
  }
  if (lower.includes("<!-- cta")) {
    return "Aksiyon Bölümü";
  }
  if (lower.includes("<!-- shipping")) {
    return "Teslimat Bilgileri";
  }
  if (lower.includes("<!-- intro")) {
    return "Giriş";
  }
  if (lower.includes("<!-- title")) {
    return "Başlık";
  }
  if (
    (lower.includes("companyname") || lower.includes("frmcompanyname") || lower.includes("logo") || lower.includes("header")) &&
    (lower.includes("#000000") || lower.includes("background:#000000") || lower.includes("color:#ffffff"))
  ) {
    return "Üst Başlık";
  }
  if (
    lower.includes("siparişiniz hazırlanıyor") ||
    lower.includes("siparisiniz hazirlaniyor") ||
    lower.includes("depo sipariş") ||
    lower.includes("depo siparis")
  ) {
    return "Başlık";
  }
  if (
    lower.includes("teşekkür ederiz") ||
    lower.includes("tesekkur ederiz") ||
    lower.includes("hazırlık aşamasına") ||
    lower.includes("hazirlik asamasina") ||
    lower.includes("kargoya verildiğinde") ||
    lower.includes("kargoya verildiginde")
  ) {
    return "Giriş";
  }
  if (lower.includes("sipariş özeti") || lower.includes("siparis ozeti") || lower.includes("order summary")) {
    return "Sipariş Özeti";
  }
  if (lower.includes("teslimat") || lower.includes("delivery") || lower.includes("shipping address") || lower.includes("shipfull")) {
    return "Teslimat Bilgileri";
  }
  if (lower.includes("fatura") || lower.includes("invoice")) {
    return lower.includes("destek") || lower.includes("support") ? "Fatura / Destek" : "Fatura Bilgileri";
  }
  if (lower.includes("destek") || lower.includes("support") || lower.includes("müşteri hizmetleri") || lower.includes("musteri hizmetleri")) {
    return "Destek Bilgileri";
  }
  if (
    lower.includes("{{ for") ||
    lower.includes("orderitems") ||
    lower.includes("orderpackage") ||
    lower.includes("toplanacak ürünler") ||
    lower.includes("toplanacak urunler") ||
    lower.includes("ürünler") ||
    lower.includes("urunler")
  ) {
    return "Ürün Bölümü";
  }
  if (
    lower.includes("href=") ||
    lower.includes("v:roundrect") ||
    lower.includes("cta") ||
    lower.includes("button") ||
    lower.includes("görüntüle") ||
    lower.includes("goruntule")
  ) {
    return "Aksiyon Bölümü";
  }
  if (
    lower.includes("kvkk") ||
    lower.includes("yasal") ||
    lower.includes("legal") ||
    lower.includes("mesafeli satış") ||
    lower.includes("mesafeli satis")
  ) {
    return "Yasal Bilgiler";
  }
  if (
    lower.includes("footer") ||
    lower.includes("alt bilgi") ||
    lower.includes("unsubscribe") ||
    lower.includes("abonelik") ||
    lower.includes("companyphone") ||
    lower.includes("infomail")
  ) {
    return "Alt Bilgi";
  }
  if (lower.includes("totalprice") || lower.includes("grandtotal") || lower.includes("toplam") || lower.includes("total")) {
    return "Tutar Özeti";
  }
  if (lower.includes("statusdesc") || lower.includes("paymentstate") || lower.includes("durum")) {
    return "Durum Bilgisi";
  }

  return "HTML Bölümü";
}

function buildHtmlTree(html: string): HtmlNode[] {
  const roots: HtmlNode[] = [];
  const stack: HtmlNode[] = [];
  const tagRe = /<\/?(table|tbody|tr|td)\b[^>]*>/gi;

  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html)) !== null) {
    const source = match[0];
    const tag = match[1].toLowerCase() as HtmlNodeTag;
    const isClosing = source[1] === "/";

    if (!isClosing) {
      const parent = stack[stack.length - 1] ?? null;
      const node: HtmlNode = {
        tag,
        start: match.index,
        openEnd: match.index + source.length,
        closeStart: -1,
        end: -1,
        parent,
        children: [],
      };

      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }

      stack.push(node);
      continue;
    }

    for (let index = stack.length - 1; index >= 0; index -= 1) {
      if (stack[index].tag !== tag) continue;

      const node = stack[index];
      node.closeStart = match.index;
      node.end = match.index + source.length;
      stack.splice(index, stack.length - index);
      break;
    }
  }

  return roots;
}

function collectNodesByTag(nodes: HtmlNode[], tag: HtmlNodeTag): HtmlNode[] {
  const matches: HtmlNode[] = [];

  for (const node of nodes) {
    if (node.tag === tag && node.end > node.openEnd) {
      matches.push(node);
    }
    matches.push(...collectNodesByTag(node.children, tag));
  }

  return matches;
}

function slice(html: string, node: HtmlNode): string {
  return html.slice(node.start, node.end);
}

function getOpenTagHtml(html: string, node: HtmlNode): string {
  return html.slice(node.start, node.openEnd).toLowerCase();
}

function countRowsWithNestedTables(rows: HtmlNode[]): number {
  return rows.filter((row) => row.children.some((child) => child.tag === "td" && child.children.some((grandChild) => grandChild.tag === "table"))).length;
}

function countMeaningfulMatches(text: string, patterns: string[]): number {
  return patterns.reduce((count, pattern) => (text.includes(pattern) ? count + 1 : count), 0);
}

function getDirectRows(node: HtmlNode): HtmlNode[] {
  return node.children
    .filter((child) => child.tag === "tr" && child.end > child.openEnd)
    .sort((left, right) => left.start - right.start);
}

function getRowContainerCandidate(table: HtmlNode): RowContainerCandidate | null {
  const tbodyCandidates = table.children
    .filter((child) => child.tag === "tbody" && child.end > child.openEnd)
    .map((tbody) => ({ tbody, rows: getDirectRows(tbody) }))
    .filter((entry) => entry.rows.length > 0)
    .sort((left, right) => {
      if (right.rows.length !== left.rows.length) {
        return right.rows.length - left.rows.length;
      }
      return (right.tbody.closeStart - right.tbody.openEnd) - (left.tbody.closeStart - left.tbody.openEnd);
    });

  if (tbodyCandidates.length > 0) {
    return {
      table,
      container: tbodyCandidates[0].tbody,
      rows: tbodyCandidates[0].rows,
      mode: "tbody",
    };
  }

  const tableRows = getDirectRows(table);
  if (tableRows.length === 0) {
    return null;
  }

  return {
    table,
    container: table,
    rows: tableRows,
    mode: "table",
  };
}

function scoreTable(html: string, candidate: RowContainerCandidate): number {
  const { table, rows } = candidate;
  const tableOpen = getOpenTagHtml(html, table);
  const tableHtml = slice(html, table).toLowerCase();
  const parentOpen = table.parent ? getOpenTagHtml(html, table.parent) : "";
  const tableSpan = Math.max(0, table.closeStart - table.openEnd);
  const rowCount = rows.length;
  const rowsWithNestedTables = countRowsWithNestedTables(rows);
  const contentSignals = countMeaningfulMatches(tableHtml, [
    "sipariş",
    "siparis",
    "teşekkür",
    "tesekkur",
    "teslimat",
    "kargo",
    "fatura",
    "support",
    "destek",
    "payment",
    "{{ for",
    "order.",
    "global.",
    "orderitems",
  ]);

  let score = rowCount * 10_000;
  score += Math.min(tableSpan, 20_000);
  score += rowsWithNestedTables * 1_500;
  score += contentSignals * 900;

  if (/max-width\s*:\s*(5\d\d|6\d\d)px/.test(tableOpen)) score += 20_000;
  if (/width\s*=\s*["']?100%/.test(tableOpen) || /width\s*:\s*100%/.test(tableOpen)) score += 1_200;
  if (/bgcolor\s*=\s*["']#ffffff["']/.test(tableOpen) || /background(?:-color)?\s*:\s*#ffffff/.test(tableOpen)) score += 8_000;
  if (tableOpen.includes("border-radius")) score += 2_000;
  if (parentOpen.includes("align=\"center\"") || parentOpen.includes("align='center'") || parentOpen.includes("align=center")) score += 5_000;
  if (parentOpen.includes("padding:24px 12px") || parentOpen.includes("padding:24px")) score += 1_500;

  if (tableOpen.includes("#f5f7fa") || tableOpen.includes("#f8fafc")) score -= 12_000;
  if (/width\s*=\s*["']?(4\d|5\d|6\d|7\d|8\d|9\d)["']/.test(tableOpen)) score -= 6_000;
  if (rowCount <= 1) score -= 15_000;
  if (rowCount <= 2 && rowsWithNestedTables === 0) score -= 4_000;

  return score;
}

function findMainRowContainer(html: string): RowContainerCandidate | null {
  const roots = buildHtmlTree(html);
  const tables = collectNodesByTag(roots, "table");

  let best: RowContainerCandidate | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const table of tables) {
    const candidate = getRowContainerCandidate(table);
    if (!candidate) continue;

    const score = scoreTable(html, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return bestScore > 0 ? best : null;
}

function extractTopLevelRows(
  html: string,
  candidate: RowContainerCandidate,
): { sections: string[]; htmlEnvelope: TemplateHtmlEnvelope | null } {
  const { container, rows } = candidate;

  if (rows.length === 0) {
    return { sections: [], htmlEnvelope: null };
  }

  const contentStart = container.openEnd;
  const sections: string[] = [];
  let cursor = contentStart;

  for (const row of rows) {
    const section = html.slice(cursor, row.end);
    if (section.trim()) {
      sections.push(section);
    }
    cursor = row.end;
  }

  return {
    sections,
    htmlEnvelope: {
      kind: "row-sections",
      envelopeOpen: html.slice(0, contentStart),
      envelopeClose: html.slice(cursor),
    },
  };
}

function buildRowBlocks(sections: string[]): EditorBlock[] {
  return sections.map((section) => {
    const detected = detectTemplateSectionInfo(section);
    const block = buildBlock("customHtml", uid("row"), {
      html: section,
      htmlSectionKind: "tbody-row",
    });
    block.name = detected.label || detectSectionName(section);
    block.description = "Workbook'tan içe aktarılan satır bölümü";
    return block;
  });
}

function buildFallbackBlocks(html: string): EditorBlock[] {
  const block = buildBlock("customHtml", uid("html"), {
    html,
    htmlSectionKind: "full-document",
  });
  block.name = "HTML İçeriği";
  block.description = "Workbook'tan içe aktarılan HTML";
  return [block];
}

export function parseScribanHtmlToBlocks(html: string): ParsedHtmlBlocksResult {
  if (!html || !html.trim()) {
    return { blocks: [], htmlEnvelope: null };
  }

  const mainRowContainer = findMainRowContainer(html);
  if (!mainRowContainer) {
    return { blocks: buildFallbackBlocks(html), htmlEnvelope: null };
  }

  const { sections, htmlEnvelope } = extractTopLevelRows(html, mainRowContainer);
  if (!sections.length || !htmlEnvelope) {
    return { blocks: buildFallbackBlocks(html), htmlEnvelope: null };
  }

  return {
    blocks: buildRowBlocks(sections),
    htmlEnvelope,
  };
}
