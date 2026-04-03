import "server-only";

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { createInitialTemplateDesignSystem } from "@/lib/editor/template-design";
import { createCategoryStarterBlocks } from "@/lib/studio/presets";
import type {
  TemplateCategory,
  TemplateRecord,
  TemplateStatus,
  WorkbookTemplateRow,
} from "@/types/template";

const require = createRequire(import.meta.url);
type XLSXModule = typeof import("xlsx");
let xlsxModuleCache: XLSXModule | null = null;

const VERI_KLASORU = path.join(process.cwd(), "data", "sources");
const CALISMA_SAYFASI = "MessageTemplate";

export class StudioDataError extends Error {
  code:
    | "FILE_MISSING"
    | "WORKBOOK_MISSING"
    | "SHEET_MISSING"
    | "FILE_READ_FAILED"
    | "JSON_PARSE_FAILED";

  detail?: string;

  constructor(code: StudioDataError["code"], message: string, detail?: string) {
    super(message);
    this.name = "StudioDataError";
    this.code = code;
    this.detail = detail;
  }
}

const kategoriDosyalari: Record<
  TemplateCategory,
  { fileName: string; expectedRoot: string; uiLabel: string }
> = {
  order: { fileName: "Order.json", expectedRoot: "Order", uiLabel: "Sipariş" },
  invoice: { fileName: "Invoice.json", expectedRoot: "Invoice", uiLabel: "Fatura" },
  return: { fileName: "Return.json", expectedRoot: "Return", uiLabel: "İade" },
  shipping: { fileName: "Shipping.json", expectedRoot: "Shipping", uiLabel: "Gönderi" },
};

const GEREKLI_DOSYALAR = [
  "Order.json",
  "Invoice.json",
  "Return.json",
  "Shipping.json",
  "SCB-6 Guncel.xlsx",
] as const;

function getXLSX() {
  if (!xlsxModuleCache) {
    xlsxModuleCache = require("xlsx") as XLSXModule;
  }

  return xlsxModuleCache;
}

function veriDosyaYolu(fileName: string) {
  return path.join(VERI_KLASORU, fileName);
}

function dosyaVarMi(filePath: string) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function dosyaYolunuDogrula(fileName: string) {
  const filePath = veriDosyaYolu(fileName);

  if (!dosyaVarMi(filePath)) {
    throw new StudioDataError(
      "FILE_MISSING",
      `Gerekli veri dosyası bulunamadı: ${fileName}`,
      filePath,
    );
  }

  return filePath;
}

function dosyaOku(fileName: string) {
  const filePath = dosyaYolunuDogrula(fileName);

  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    const detail = error instanceof Error ? error.message : undefined;
    throw new StudioDataError("FILE_READ_FAILED", "Veri dosyası okunamadı", detail);
  }
}

function gevsakJsonTemizle(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^[\{\}\[\]],?$/.test(trimmed)) return true;
      return trimmed.startsWith('"');
    })
    .join("\n");
}

function gevsakJsonParse(text: string, fileName: string) {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    try {
      return JSON.parse(gevsakJsonTemizle(text)) as Record<string, unknown>;
    } catch (error) {
      const detail = error instanceof Error ? error.message : undefined;
      throw new StudioDataError(
        "JSON_PARSE_FAILED",
        `Veri dosyası okunamadı: ${fileName}`,
        detail,
      );
    }
  }
}

function kategoriRootUyarla(category: TemplateCategory, parsed: Record<string, unknown>) {
  const expectedRoot = kategoriDosyalari[category].expectedRoot;
  if (expectedRoot in parsed) {
    return parsed;
  }

  const adayRootlar = Object.keys(parsed).filter(
    (key) => !["Global", "OResult"].includes(key),
  );

  if (adayRootlar.length === 1) {
    return {
      ...parsed,
      [expectedRoot]: parsed[adayRootlar[0]],
    };
  }

  return parsed;
}

/**
 * Adds convenience aliases so preview data matches common Scriban variable names.
 * e.g. Order.OrderItems → Order.OrderPackageDetails (both names appear in templates)
 */
function addPreviewAliases(category: TemplateCategory, data: Record<string, unknown>): Record<string, unknown> {
  if (category === "order") {
    const order = data["Order"] as Record<string, unknown> | undefined;
    if (order) {
      const aliased: Record<string, unknown> = { ...order };
      if (!aliased["OrderItems"] && aliased["OrderPackageDetails"]) {
        aliased["OrderItems"] = aliased["OrderPackageDetails"];
      }
      return { ...data, Order: aliased };
    }
  }
  return data;
}

export function getCategoryDataMap() {
  return {
    order: addPreviewAliases("order", kategoriRootUyarla("order", gevsakJsonParse(dosyaOku("Order.json"), "Order.json"))),
    invoice: kategoriRootUyarla(
      "invoice",
      gevsakJsonParse(dosyaOku("Invoice.json"), "Invoice.json"),
    ),
    return: kategoriRootUyarla(
      "return",
      gevsakJsonParse(dosyaOku("Return.json"), "Return.json"),
    ),
    shipping: kategoriRootUyarla(
      "shipping",
      gevsakJsonParse(dosyaOku("Shipping.json"), "Shipping.json"),
    ),
  } as const;
}

function kategoriyeDonustur(templateType: string): TemplateCategory | null {
  if (templateType === "Order") return "order";
  if (templateType === "Invoice") return "invoice";
  if (templateType === "OrderReturn") return "return";
  if (templateType === "Shipping") return "shipping";
  return null;
}

function durumDonustur(isEnabled: unknown): TemplateStatus {
  if (isEnabled === true || isEnabled === "True" || isEnabled === "1" || isEnabled === 1) {
    return "active";
  }
  return "draft";
}

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function workbookOku() {
  const workbookPath = dosyaYolunuDogrula("SCB-6 Guncel.xlsx");
  const XLSX = getXLSX();
  let workbook: XLSXModule["utils"] extends unknown ? ReturnType<XLSXModule["read"]> : never;

  try {
    const workbookBuffer = fs.readFileSync(workbookPath);
    workbook = XLSX.read(workbookBuffer, { type: "buffer" });
  } catch (error) {
    const detail = error instanceof Error ? error.message : undefined;
    throw new StudioDataError("FILE_READ_FAILED", "Veri dosyası okunamadı", detail);
  }

  const sheet = workbook.Sheets[CALISMA_SAYFASI];

  if (!sheet) {
    throw new StudioDataError(
      "SHEET_MISSING",
      "MessageTemplate sayfası bulunamadı",
      workbookPath,
    );
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  return {
    workbookPath,
    rows,
    sheetName: CALISMA_SAYFASI,
  };
}

function workbookSatirinaDonustur(row: Record<string, unknown>): WorkbookTemplateRow {
  return {
    parsedTemplateEngine: String(row.ParsedTemplateEngine ?? ""),
    parsedTemplateType: String(row.ParsedTemplateType ?? ""),
    templateId: String(row.TemplateID ?? ""),
    templateType: String(row.TemplateType ?? ""),
    title: String(row.Title ?? ""),
    description: String(row.Description ?? ""),
    messageSubject: String(row.MessageSubject ?? ""),
    messageDetail: String(row.MessageDetail ?? ""),
    createdDate: String(row.CreatedDate ?? ""),
    isEnabled:
      row.IsEnabled === true ||
      row.IsEnabled === "True" ||
      row.IsEnabled === "1" ||
      row.IsEnabled === 1,
    contentType: String(row.ContentType ?? ""),
    itemTemplate: String(row.ItemTemplate ?? ""),
    pageBreak: String(row.PageBreak ?? ""),
    templateEngine: String(row.TemplateEngine ?? ""),
    sourceFile: veriDosyaYolu("SCB-6 Guncel.xlsx"),
    sheetName: CALISMA_SAYFASI,
  };
}

function templateKaydiOlustur(row: WorkbookTemplateRow): TemplateRecord | null {
  const category = kategoriyeDonustur(row.templateType);
  if (!category) {
    return null;
  }

  const { blocks, htmlEnvelope } = createCategoryStarterBlocks(category, row.messageDetail);

  return {
    id: row.templateId,
    slug: slugify(`${row.templateId}-${row.title}`),
    name: row.title,
    description: row.description,
    category,
    status: durumDonustur(row.isEnabled),
    subject: row.messageSubject,
    updatedAt: row.createdDate || new Date().toISOString(),
    tags: [row.templateEngine, row.contentType].filter(Boolean),
    blocks,
    htmlEnvelope,
    designSystem: createInitialTemplateDesignSystem({
      id: row.templateId,
      slug: slugify(`${row.templateId}-${row.title}`),
      name: row.title,
      description: row.description,
      category,
      status: durumDonustur(row.isEnabled),
      subject: row.messageSubject,
      updatedAt: row.createdDate || new Date().toISOString(),
      tags: [row.templateEngine, row.contentType].filter(Boolean),
      blocks,
      htmlEnvelope,
      source: row,
    }),
    source: row,
  };
}

export function getWorkbookTemplates() {
  const { rows } = workbookOku();
  return rows
    .map(workbookSatirinaDonustur)
    .map(templateKaydiOlustur)
    .filter((template): template is TemplateRecord => Boolean(template));
}

export function getTemplateById(templateId: string) {
  return getWorkbookTemplates().find((template) => template.id === templateId);
}

export function getCategoryCounts() {
  const templates = getWorkbookTemplates();
  return {
    order: templates.filter((template) => template.category === "order").length,
    invoice: templates.filter((template) => template.category === "invoice").length,
    return: templates.filter((template) => template.category === "return").length,
    shipping: templates.filter((template) => template.category === "shipping").length,
  } as const;
}

export function getStudioStats() {
  const templates = getWorkbookTemplates();
  const aktif = templates.filter((template) => template.status === "active").length;
  const kategoriler = new Set(templates.map((template) => template.category)).size;

  return [
    {
      label: "Toplam şablon",
      value: templates.length,
      detail: `${CALISMA_SAYFASI} sayfasından okunan kayıt sayısı`,
    },
    {
      label: "Aktif kayıt",
      value: aktif,
      detail: "IsEnabled alanına göre etkin şablonlar",
    },
    {
      label: "Kategori",
      value: kategoriler,
      detail: "data/sources klasöründeki kategori çeşidi",
    },
  ];
}

export function getWorkbookSummary() {
  const { workbookPath, rows, sheetName } = workbookOku();

  return {
    workbookPath,
    sheetName,
    rowCount: rows.length,
    dataFolder: VERI_KLASORU,
    categoryFiles: Object.values(kategoriDosyalari).map((item) => ({
      fileName: item.fileName,
      path: veriDosyaYolu(item.fileName),
      label: item.uiLabel,
    })),
  };
}

export function getRequiredDataFiles() {
  return GEREKLI_DOSYALAR.map((fileName) => ({
    fileName,
    path: veriDosyaYolu(fileName),
  }));
}

export function serializeTemplateToWorkbookRow(template: TemplateRecord) {
  return {
    ParsedTemplateEngine: template.source.parsedTemplateEngine,
    ParsedTemplateType: template.source.parsedTemplateType,
    TemplateID: template.source.templateId,
    TemplateType: template.source.templateType,
    Title: template.name,
    Description: template.description,
    MessageSubject: template.subject,
    MessageDetail: template.source.messageDetail,
    CreatedDate: template.source.createdDate,
    IsEnabled: template.source.isEnabled,
    ContentType: template.source.contentType,
    ItemTemplate: template.source.itemTemplate,
    PageBreak: template.source.pageBreak,
    TemplateEngine: template.source.templateEngine,
  };
}

export function formatStudioError(error: unknown) {
  if (error instanceof StudioDataError) {
    return {
      title: error.message,
      detail: error.detail,
    };
  }

  return {
    title: "Veri dosyası okunamadı",
    detail: "Uygulama yalnızca data/sources klasöründeki dosyaları kullanır.",
  };
}
