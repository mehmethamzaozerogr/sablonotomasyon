"use client";

import { extractHtmlVarOccurrences } from "@/lib/bindings/html-vars";

export type InlineLogicSubtype =
  | "if"
  | "elseif"
  | "else"
  | "end"
  | "for"
  | "expression";

export type InlineSegment =
  | { type: "text"; value: string }
  | { type: "variable"; path: string; raw: string }
  | { type: "logic"; raw: string; subtype: InlineLogicSubtype };

export type HtmlTextRegionStyle = {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  textAlign: string;
  backgroundColor: string;
  borderRadius: string;
  border: string;
  width: string;
  maxWidth: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginBottom: string;
};

export type HtmlTextRegion = {
  id: string;
  path: number[];
  tagName: string;
  label: string;
  textPreview: string;
  segments: InlineSegment[];
  styles: HtmlTextRegionStyle;
  href: string | null;
  supportsStructuredEditing: boolean;
  readonly?: boolean;
};

type MutationContext = {
  root: HTMLElement;
  toHtml: () => string;
};

type RegionStylePatch = Partial<HtmlTextRegionStyle>;

const REGION_TAGS = new Set([
  "a",
  "button",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "label",
  "li",
  "p",
  "span",
  "strong",
  "em",
  "small",
  "td",
  "th",
]);

const BLOCKED_TAGS = new Set(["script", "style", "textarea"]);

function createMutationContext(
  html: string,
  rowMode: boolean,
): MutationContext | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (rowMode) {
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
    tbody.innerHTML = html;
    return {
      root: tbody,
      toHtml: () => tbody.innerHTML,
    };
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  return {
    root: wrapper,
    toHtml: () => wrapper.innerHTML,
  };
}

function getElementByPath(root: HTMLElement, path: number[]) {
  let current: Element | null = root;
  for (const index of path) {
    current = current?.children.item(index) ?? null;
    if (!current) {
      return null;
    }
  }
  return current instanceof HTMLElement ? current : null;
}

function getRegionId(path: number[]) {
  return path.join(".");
}

function normalizeTextPreview(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getRegionLabel(element: HTMLElement) {
  const tag = element.tagName.toLowerCase();
  if (tag === "a") return "Bağlantı metni";
  if (tag.startsWith("h")) return `Başlık (${tag.toUpperCase()})`;
  if (tag === "p") return "Paragraf";
  if (tag === "td" || tag === "th") return "Tablo hücresi";
  if (tag === "li") return "Liste öğesi";
  if (tag === "button") return "Buton etiketi";
  return `Metin alanı (${tag.toUpperCase()})`;
}

function buildEmptyRegionStyle(): HtmlTextRegionStyle {
  return {
    fontSize: "",
    fontWeight: "",
    lineHeight: "",
    letterSpacing: "",
    color: "",
    textAlign: "",
    backgroundColor: "",
    borderRadius: "",
    border: "",
    width: "",
    maxWidth: "",
    paddingTop: "",
    paddingRight: "",
    paddingBottom: "",
    paddingLeft: "",
    marginTop: "",
    marginBottom: "",
  };
}

function extractRegionStyle(element: HTMLElement): HtmlTextRegionStyle {
  const style = element.style;
  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    textAlign: style.textAlign || element.getAttribute("align") || "",
    backgroundColor:
      style.backgroundColor || element.getAttribute("bgcolor") || "",
    borderRadius: style.borderRadius,
    border: style.border,
    width: style.width || element.getAttribute("width") || "",
    maxWidth: style.maxWidth,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
  };
}

function isMeaningfulTextNode(node: Node) {
  return node.nodeType === Node.TEXT_NODE && Boolean(node.textContent?.trim());
}

function supportsStructuredEditing(element: HTMLElement) {
  return Array.from(element.childNodes).every((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return true;
    }
    return node instanceof HTMLElement && node.tagName.toLowerCase() === "br";
  });
}

function hasEditableContent(element: HTMLElement) {
  const directMeaningfulText = Array.from(element.childNodes).some(
    (node) =>
      isMeaningfulTextNode(node) ||
      (node instanceof HTMLElement && node.tagName.toLowerCase() === "br"),
  );

  if (directMeaningfulText) {
    return true;
  }

  return Boolean(normalizeTextPreview(element.textContent ?? ""));
}

function tokenizeTemplateText(value: string): InlineSegment[] {
  const occurrences = extractHtmlVarOccurrences(value);
  if (occurrences.length === 0) {
    return [{ type: "text", value }];
  }

  const segments: InlineSegment[] = [];
  let cursor = 0;

  for (const occurrence of occurrences) {
    if (occurrence.start > cursor) {
      segments.push({
        type: "text",
        value: value.slice(cursor, occurrence.start),
      });
    }

    if (occurrence.kind === "variable") {
      segments.push({
        type: "variable",
        path: occurrence.path,
        raw: occurrence.matchText,
      });
    } else {
      segments.push({
        type: "logic",
        raw: occurrence.matchText,
        subtype: occurrence.kind,
      });
    }

    cursor = occurrence.end;
  }

  if (cursor < value.length) {
    segments.push({
      type: "text",
      value: value.slice(cursor),
    });
  }

  return ensureBoundaryTextSegments(segments);
}

function ensureBoundaryTextSegments(segments: InlineSegment[]) {
  const next = [...segments];

  if (next.length === 0) {
    return [{ type: "text", value: "" }] satisfies InlineSegment[];
  }

  if (next[0]?.type !== "text") {
    next.unshift({ type: "text", value: "" });
  }

  if (next[next.length - 1]?.type !== "text") {
    next.push({ type: "text", value: "" });
  }

  return next.reduce<InlineSegment[]>((acc, segment) => {
    const previous = acc[acc.length - 1];
    if (segment.type === "text" && previous?.type === "text") {
      previous.value += segment.value;
      return acc;
    }
    acc.push(segment);
    return acc;
  }, []);
}

function extractSegmentsFromStructuredElement(element: HTMLElement) {
  const text = Array.from(element.childNodes)
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent ?? "";
      }
      if (node instanceof HTMLElement && node.tagName.toLowerCase() === "br") {
        return "\n";
      }
      return "";
    })
    .join("");

  return tokenizeTemplateText(text);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function restoreScribanEntities(html: string) {
  return html.replace(/\{\{[\s\S]*?\}\}/g, (match) =>
    decodeHtmlEntities(match),
  );
}

export function createVariableSegment(path: string): InlineSegment {
  return {
    type: "variable",
    path,
    raw: `{{ ${path} }}`,
  };
}

export function normalizeInlineSegments(segments: InlineSegment[]) {
  return ensureBoundaryTextSegments(
    segments.filter((segment) => {
      if (segment.type !== "text") {
        return true;
      }
      return segment.value.length > 0 || segments.length === 1;
    }),
  );
}

export function inlineSegmentsToTemplateText(segments: InlineSegment[]) {
  return segments
    .map((segment) => {
      if (segment.type === "text") {
        return segment.value;
      }
      return segment.raw;
    })
    .join("");
}

function inlineSegmentsToHtml(segments: InlineSegment[]) {
  return segments
    .map((segment) => {
      if (segment.type === "text") {
        return escapeHtml(segment.value).replace(/\n/g, "<br>");
      }
      return escapeHtml(segment.raw);
    })
    .join("");
}

export function getCustomHtmlTextRegions(
  html: string,
  rowMode = false,
): HtmlTextRegion[] {
  const context = createMutationContext(html, rowMode);
  if (!context) {
    return [];
  }

  const regions: HtmlTextRegion[] = [];

  function walk(element: HTMLElement, path: number[]) {
    Array.from(element.children).forEach((child, index) => {
      if (!(child instanceof HTMLElement)) {
        return;
      }

      const childPath = [...path, index];
      const tag = child.tagName.toLowerCase();
      if (BLOCKED_TAGS.has(tag)) {
        return;
      }

      const candidate = REGION_TAGS.has(tag) && hasEditableContent(child);
      if (candidate) {
        const structured = supportsStructuredEditing(child);
        const textPreview = normalizeTextPreview(child.textContent ?? "");
        regions.push({
          id: getRegionId(childPath),
          path: childPath,
          tagName: tag,
          label: getRegionLabel(child),
          textPreview,
          segments: structured
            ? extractSegmentsFromStructuredElement(child)
            : [{ type: "text", value: child.textContent ?? "" }],
          styles: extractRegionStyle(child),
          href:
            child.tagName.toLowerCase() === "a"
              ? child.getAttribute("href")
              : null,
          supportsStructuredEditing: structured,
          readonly: false,
        });
      }

      walk(child, childPath);
    });
  }

  walk(context.root, []);
  return regions.filter(
    (region) =>
      region.textPreview ||
      region.segments.some((segment) => segment.type !== "text"),
  );
}

function stripHtmlToText(html: string) {
  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  return normalizeTextPreview(wrapper.textContent ?? "");
}

function asReadonlyFallbackRegion(
  id: string,
  textPreview: string,
): HtmlTextRegion {
  return {
    id,
    path: [],
    tagName: "div",
    label: "Text region (fallback)",
    textPreview,
    segments: [{ type: "text", value: textPreview }],
    styles: buildEmptyRegionStyle(),
    href: null,
    supportsStructuredEditing: false,
    readonly: true,
  };
}

export function getCustomHtmlTextRegionsWithFallback(
  safeHtml: string,
  rawHtml: string,
  rowMode = false,
) {
  const safeRegions = getCustomHtmlTextRegions(safeHtml, rowMode);
  if (safeRegions.length > 0) {
    return safeRegions;
  }

  const rawRegions = getCustomHtmlTextRegions(rawHtml, rowMode);
  if (rawRegions.length > 0) {
    return rawRegions.map((region) => ({
      ...region,
      id: `fallback.${region.id}`,
      supportsStructuredEditing: false,
      readonly: true,
    }));
  }

  const textPreview = stripHtmlToText(safeHtml || rawHtml);
  if (!textPreview) {
    return [] as HtmlTextRegion[];
  }

  return [asReadonlyFallbackRegion("fallback.root", textPreview)];
}

function updateRegionElement(
  html: string,
  regionId: string,
  rowMode: boolean,
  updater: (element: HTMLElement) => void,
) {
  const context = createMutationContext(html, rowMode);
  if (!context) {
    return html;
  }

  const path = regionId
    .split(".")
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part));
  const element = getElementByPath(context.root, path);
  if (!element) {
    return html;
  }

  updater(element);
  return restoreScribanEntities(context.toHtml());
}

export function updateCustomHtmlRegionContent(
  html: string,
  regionId: string,
  segments: InlineSegment[],
  rowMode = false,
) {
  return updateRegionElement(html, regionId, rowMode, (element) => {
    if (!supportsStructuredEditing(element)) {
      return;
    }

    element.innerHTML = inlineSegmentsToHtml(normalizeInlineSegments(segments));
  });
}

export function updateCustomHtmlRegionStyle(
  html: string,
  regionId: string,
  patch: RegionStylePatch,
  rowMode = false,
) {
  return updateRegionElement(html, regionId, rowMode, (element) => {
    const nextStyle = {
      ...buildEmptyRegionStyle(),
      ...extractRegionStyle(element),
      ...patch,
    };

    element.style.fontSize = nextStyle.fontSize;
    element.style.fontWeight = nextStyle.fontWeight;
    element.style.lineHeight = nextStyle.lineHeight;
    element.style.letterSpacing = nextStyle.letterSpacing;
    element.style.color = nextStyle.color;
    element.style.textAlign = nextStyle.textAlign;
    element.style.backgroundColor = nextStyle.backgroundColor;
    element.style.borderRadius = nextStyle.borderRadius;
    element.style.border = nextStyle.border;
    element.style.width = nextStyle.width;
    element.style.maxWidth = nextStyle.maxWidth;
    element.style.paddingTop = nextStyle.paddingTop;
    element.style.paddingRight = nextStyle.paddingRight;
    element.style.paddingBottom = nextStyle.paddingBottom;
    element.style.paddingLeft = nextStyle.paddingLeft;
    element.style.marginTop = nextStyle.marginTop;
    element.style.marginBottom = nextStyle.marginBottom;

    if (nextStyle.textAlign) {
      element.setAttribute("align", nextStyle.textAlign);
    } else {
      element.removeAttribute("align");
    }

    if (nextStyle.backgroundColor) {
      element.setAttribute("bgcolor", nextStyle.backgroundColor);
    } else {
      element.removeAttribute("bgcolor");
    }

    if (nextStyle.width) {
      element.setAttribute("width", nextStyle.width);
    } else {
      element.removeAttribute("width");
    }
  });
}

export function updateCustomHtmlRegionHref(
  html: string,
  regionId: string,
  href: string,
  rowMode = false,
) {
  return updateRegionElement(html, regionId, rowMode, (element) => {
    if (element.tagName.toLowerCase() !== "a") {
      return;
    }

    if (href.trim()) {
      element.setAttribute("href", href.trim());
    } else {
      element.removeAttribute("href");
    }
  });
}
