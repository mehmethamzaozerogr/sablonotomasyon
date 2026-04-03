"use server";

import type { ParsedWorkbookRow, WorkbookParseResult } from "@/lib/xlsx/types";

export type XlsxImportResult =
  | {
      success: true;
      rows: ParsedWorkbookRow[];
      sheetName: string;
      totalSheets: string[];
      skippedRows: number;
      warnings: string[];
      fileName: string;
    }
  | {
      success: false;
      error: string;
      detail?: string;
    };

/**
 * Server Action: accepts an XLSX file via FormData, parses the
 * MessageTemplate sheet, and returns structured row data.
 *
 * Designed to be called from a client component:
 *   const result = await parseXlsxUpload(formData);
 */
export async function parseXlsxUpload(formData: FormData): Promise<XlsxImportResult> {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "Dosya bulunamadi. Lutfen bir XLSX dosyasi secin." };
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return {
      success: false,
      error: "Desteklenmeyen dosya tipi",
      detail: "Yalnizca .xlsx ve .xls uzantili dosyalar kabul edilir.",
    };
  }

  if (file.size > 20 * 1024 * 1024) {
    return {
      success: false,
      error: "Dosya cok buyuk",
      detail: "Maksimum dosya boyutu 20 MB'dir.",
    };
  }

  let buffer: Buffer;
  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch (err) {
    return {
      success: false,
      error: "Dosya okunamadi",
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  const { parseWorkbookBuffer } = await import("@/lib/xlsx/workbook-reader");
  const result: WorkbookParseResult | { success: false; error: string; detail?: string } =
    parseWorkbookBuffer(buffer, file.name);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    rows: result.rows,
    sheetName: result.sheetName,
    totalSheets: result.totalSheets,
    skippedRows: result.skippedRows,
    warnings: result.warnings,
    fileName: file.name,
  };
}
