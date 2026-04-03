/**
 * workbook-reader.ts â€” server-side XLSX parser
 *
 * Reads an XLSX buffer and extracts rows from the MessageTemplate sheet (or
 * the first available sheet). Designed to be fault-tolerant: unknown columns
 * are preserved, missing required fields fall back to safe defaults, and any
 * parse failure produces a diagnostic message rather than a thrown exception.
 *
 * This file must only be imported from server contexts (Server Components,
 * Server Actions, Route Handlers).
 */
import "server-only";

import { createRequire } from "node:module";

import type { TemplateCategory } from "@/types/template";
import type {
  ParsedWorkbookRow,
  WorkbookParseError,
  WorkbookParseResult,
} from "@/lib/xlsx/types";

const _require = createRequire(import.meta.url);
type XLSXModule = typeof import("xlsx");
let xlsxCache: XLSXModule | null = null;

function getXLSX(): XLSXModule {
  if (!xlsxCache) {
    xlsxCache = _require("xlsx") as XLSXModule;
  }
  return xlsxCache;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Column name aliases
// Column names seen in real workbooks vary slightly â€” normalise all of them.
// ---------------------------------------------------------------------------

const COLUMN_ALIASES: Record<string, keyof ParsedWorkbookRow | "_skip"> = {
  templateid: "templateId",
  template_id: "templateId",
  id: "templateId",
  templatetype: "templateType",
  template_type: "templateType",
  type: "templateType",
  title: "title",
  name: "title",
  description: "description",
  desc: "description",
  messagesubject: "messageSubject",
  message_subject: "messageSubject",
  subject: "messageSubject",
  messagedetail: "messageDetail",
  message_detail: "messageDetail",
  htmlcontent: "messageDetail",
  html: "messageDetail",
  content: "messageDetail",
  contenttype: "contentType",
  content_type: "contentType",
  templateengine: "templateEngine",
  template_engine: "templateEngine",
  engine: "templateEngine",
  parsedtemplateengine: "parsedTemplateEngine",
  parsedtemplatetype: "parsedTemplateType",
  isenabled: "isEnabled",
  is_enabled: "isEnabled",
  enabled: "isEnabled",
  active: "isEnabled",
  createddate: "createdDate",
  created_date: "createdDate",
  createdat: "createdDate",
  itemtemplate: "itemTemplate",
  item_template: "itemTemplate",
  pagebreak: "pageBreak",
  page_break: "pageBreak",
};

// ---------------------------------------------------------------------------
// Category inference
// ---------------------------------------------------------------------------

function inferCategory(templateType: string): TemplateCategory | null {
  const t = templateType.toLowerCase().trim();
  if (t === "order" || t.startsWith("order")) return "order";
  if (t === "invoice" || t.startsWith("invoice")) return "invoice";
  if (t === "orderreturn" || t === "return" || t.startsWith("return")) return "return";
  if (t === "shipping" || t.startsWith("shipping")) return "shipping";
  return null;
}

// ---------------------------------------------------------------------------
// Primitive coercions
// ---------------------------------------------------------------------------

function asString(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function asBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase().trim();
  return s === "true" || s === "1" || s === "yes" || s === "evet";
}

// ---------------------------------------------------------------------------
// Row mapper
// ---------------------------------------------------------------------------

function normaliseColumnName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]/g, "");
}

function mapRow(
  raw: Record<string, unknown>,
  rowIndex: number,
  sheetName: string,
  sourceFileName: string,
): ParsedWorkbookRow | null {
  const warnings: string[] = [];
  const mapped: Partial<ParsedWorkbookRow> = {};

  for (const [col, value] of Object.entries(raw)) {
    const normalised = normaliseColumnName(col);
    const field = COLUMN_ALIASES[normalised];
    if (!field || field === "_skip") continue;

    switch (field) {
      case "isEnabled":
        mapped.isEnabled = asBoolean(value);
        break;
      default:
        (mapped as Record<string, unknown>)[field] = asString(value);
    }
  }

  // Require at minimum a TemplateID
  const templateId = mapped.templateId ?? "";
  if (!templateId) {
    // Try a few fallback column names that might hold an ID
    const rawKeys = Object.keys(raw);
    const idCandidate = rawKeys.find((k) =>
      /id|code|key/i.test(k) && raw[k],
    );
    if (idCandidate) {
      mapped.templateId = asString(raw[idCandidate]);
      warnings.push(`TemplateID alani bulunamadi; '${idCandidate}' sutunu kullanildi.`);
    } else {
      warnings.push(`Satir ${rowIndex}: TemplateID eksik, atlanacak.`);
      return null;
    }
  }

  const templateType = mapped.templateType ?? "";
  const inferredCategory = inferCategory(templateType);
  if (!inferredCategory && templateType) {
    warnings.push(`Bilinmeyen TemplateType: "${templateType}" â€” kategori Ã§Ä±karÄ±lamadÄ±.`);
  }

  return {
    templateId: mapped.templateId ?? "",
    templateType,
    title: mapped.title ?? mapped.templateId ?? "(isimsiz)",
    description: mapped.description ?? "",
    messageSubject: mapped.messageSubject ?? "",
    messageDetail: mapped.messageDetail ?? "",
    contentType: mapped.contentType ?? "",
    templateEngine: mapped.templateEngine ?? "",
    parsedTemplateEngine: mapped.parsedTemplateEngine ?? "",
    parsedTemplateType: mapped.parsedTemplateType ?? "",
    isEnabled: mapped.isEnabled ?? false,
    createdDate: mapped.createdDate ?? "",
    itemTemplate: mapped.itemTemplate ?? "",
    pageBreak: mapped.pageBreak ?? "",
    sheetName,
    sourceFileName,
    rowIndex,
    importWarnings: warnings,
    inferredCategory,
  };
}

// ---------------------------------------------------------------------------
// Sheet finder
// ---------------------------------------------------------------------------

const TARGET_SHEET_NAMES = ["MessageTemplate", "messagetemplate", "Template", "Sheet1"];

function findTargetSheet(sheetNames: string[]): string | null {
  for (const target of TARGET_SHEET_NAMES) {
    const found = sheetNames.find(
      (s) => s.toLowerCase() === target.toLowerCase(),
    );
    if (found) return found;
  }
  // Fall back to first non-empty sheet
  return sheetNames[0] ?? null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parseWorkbookBuffer(
  buffer: Buffer | Uint8Array,
  sourceFileName = "uploaded.xlsx",
): WorkbookParseResult | WorkbookParseError {
  const XLSX = getXLSX();

  let workbook: ReturnType<XLSXModule["read"]>;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false, raw: false });
  } catch (err) {
    return {
      success: false,
      error: "XLSX dosyasi okunamadi",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  const totalSheets = workbook.SheetNames;
  const targetSheet = findTargetSheet(totalSheets);
  if (!targetSheet) {
    return { success: false, error: "Workbook icinde hic sayfa bulunamadi." };
  }

  const sheet = workbook.Sheets[targetSheet];
  if (!sheet) {
    return { success: false, error: `"${targetSheet}" sayfasi acilamadi.` };
  }

  let rawRows: Record<string, unknown>[];
  try {
    rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
  } catch (err) {
    return {
      success: false,
      error: "Sayfa satırlara dönüştürülemedi",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  const globalWarnings: string[] = [];
  let skippedRows = 0;
  const rows: ParsedWorkbookRow[] = [];

  rawRows.forEach((raw, idx) => {
    const mapped = mapRow(raw, idx + 2, targetSheet, sourceFileName); // +2: 1-indexed + header
    if (!mapped) {
      skippedRows++;
      globalWarnings.push(`Satir ${idx + 2} atlandÄ± â€” TemplateID bulunamadi.`);
    } else {
      mapped.importWarnings.forEach((w) => globalWarnings.push(w));
      rows.push(mapped);
    }
  });

  return {
    success: true,
    rows,
    sheetName: targetSheet,
    totalSheets,
    skippedRows,
    warnings: globalWarnings,
  };
}

/**
 * Convert a ParsedWorkbookRow into the WorkbookTemplateRow shape expected
 * by the rest of the app (matching the structure from server-data.ts).
 */
export function toWorkbookTemplateRow(
  row: ParsedWorkbookRow,
  sourceFilePath = "",
) {
  return {
    parsedTemplateEngine: row.parsedTemplateEngine,
    parsedTemplateType: row.parsedTemplateType,
    templateId: row.templateId,
    templateType: row.templateType,
    title: row.title,
    description: row.description,
    messageSubject: row.messageSubject,
    messageDetail: row.messageDetail,
    createdDate: row.createdDate,
    isEnabled: row.isEnabled,
    contentType: row.contentType,
    itemTemplate: row.itemTemplate,
    pageBreak: row.pageBreak,
    templateEngine: row.templateEngine,
    sourceFile: sourceFilePath,
    sheetName: row.sheetName,
  };
}
