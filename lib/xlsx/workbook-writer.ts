/**
 * workbook-writer.ts — generates a MessageTemplate-compatible XLSX workbook
 * from an array of TemplateRecord objects.
 *
 * Designed for browser use via dynamic import (avoids bundling xlsx at startup).
 * Can also be used in Node.js/server contexts.
 *
 * Usage (client-side):
 *   const { buildWorkbookBytes } = await import("@/lib/xlsx/workbook-writer");
 *   const bytes = buildWorkbookBytes(templates, compileFn);
 *   const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
 */

import type { TemplateRecord } from "@/types/template";
import type { PreviewMode } from "@/types/template";

// Column header order — matches the exact columns the reader expects
const COLUMN_ORDER = [
  "ParsedTemplateEngine",
  "ParsedTemplateType",
  "TemplateID",
  "TemplateType",
  "Title",
  "Description",
  "MessageSubject",
  "MessageDetail",
  "CreatedDate",
  "IsEnabled",
  "ContentType",
  "ItemTemplate",
  "PageBreak",
  "TemplateEngine",
] as const;

type WorkbookRow = Record<(typeof COLUMN_ORDER)[number], string | boolean>;

// ---------------------------------------------------------------------------
// Row serialiser
// ---------------------------------------------------------------------------

function templateToRow(
  template: TemplateRecord,
  compiledHtml: string,
): WorkbookRow {
  return {
    ParsedTemplateEngine: template.source.parsedTemplateEngine,
    ParsedTemplateType: template.source.parsedTemplateType,
    TemplateID: template.source.templateId,
    TemplateType: template.source.templateType,
    Title: template.name,
    Description: template.description,
    MessageSubject: template.subject,
    // Use compiled HTML when available, fall back to original source
    MessageDetail: compiledHtml || template.source.messageDetail,
    CreatedDate: template.source.createdDate || template.updatedAt,
    IsEnabled: template.status === "active" || template.source.isEnabled,
    ContentType: template.source.contentType,
    ItemTemplate: template.source.itemTemplate,
    PageBreak: template.source.pageBreak,
    TemplateEngine: template.source.templateEngine,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type CompileHtmlFn = (template: TemplateRecord, mode: PreviewMode) => string;

/**
 * Build a raw XLSX workbook buffer from a list of TemplateRecords.
 *
 * @param templates  The template records to serialise.
 * @param compileFn  Optional function to compile each template to HTML.
 *                   When omitted, `template.source.messageDetail` is used.
 * @returns          A Uint8Array containing the XLSX file bytes.
 */
export async function buildWorkbookBytes(
  templates: TemplateRecord[],
  compileFn?: CompileHtmlFn,
): Promise<Uint8Array> {
  // Dynamic import so the xlsx bundle is not included at startup
  const XLSX = await import("xlsx");

  const rows: WorkbookRow[] = templates.map((t) => {
    const compiledHtml = compileFn ? compileFn(t, "desktop") : "";
    return templateToRow(t, compiledHtml);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...COLUMN_ORDER] });

  // Style the header row (column widths for readability)
  worksheet["!cols"] = COLUMN_ORDER.map((col) => {
    if (col === "MessageDetail") return { wch: 80 };
    if (col === "Title" || col === "Description" || col === "MessageSubject") return { wch: 40 };
    if (col === "TemplateID") return { wch: 24 };
    return { wch: 20 };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MessageTemplate");

  // Add a metadata sheet for auditability
  const metaRows = [
    { Field: "ExportedAt", Value: new Date().toISOString() },
    { Field: "TemplateCount", Value: String(templates.length) },
    { Field: "Generator", Value: "Template Studio — lib/xlsx/workbook-writer" },
    { Field: "SheetName", Value: "MessageTemplate" },
  ];
  const metaSheet = XLSX.utils.json_to_sheet(metaRows, { header: ["Field", "Value"] });
  metaSheet["!cols"] = [{ wch: 24 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, metaSheet, "_Meta");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as unknown;
  return new Uint8Array(buffer as ArrayBuffer);
}

/**
 * Trigger a browser download of an XLSX file.
 * Safe no-op on server (only runs when window is available).
 */
export function downloadXlsxBytes(bytes: Uint8Array, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Build and immediately trigger a browser download.
 */
export async function exportTemplatesToXlsx(
  templates: TemplateRecord[],
  filename = "templates-export.xlsx",
  compileFn?: CompileHtmlFn,
): Promise<void> {
  const bytes = await buildWorkbookBytes(templates, compileFn);
  downloadXlsxBytes(bytes, filename);
}
