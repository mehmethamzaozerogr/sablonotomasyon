import type { TemplateCategory } from "@/types/template";

export type ParsedWorkbookRow = {
  templateId: string;
  templateType: string;
  title: string;
  description: string;
  messageSubject: string;
  messageDetail: string;
  contentType: string;
  templateEngine: string;
  parsedTemplateEngine: string;
  parsedTemplateType: string;
  isEnabled: boolean;
  createdDate: string;
  itemTemplate: string;
  pageBreak: string;
  sheetName: string;
  sourceFileName: string;
  rowIndex: number;
  importWarnings: string[];
  inferredCategory: TemplateCategory | null;
};

export type WorkbookParseResult = {
  success: true;
  rows: ParsedWorkbookRow[];
  sheetName: string;
  totalSheets: string[];
  skippedRows: number;
  warnings: string[];
};

export type WorkbookParseError = {
  success: false;
  error: string;
  detail?: string;
};
