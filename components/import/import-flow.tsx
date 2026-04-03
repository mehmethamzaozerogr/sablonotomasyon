"use client";

import { useState } from "react";
import { Database, FileSpreadsheet, FolderOpen, Layers3, Upload } from "lucide-react";

import { ImportReviewTable } from "@/components/import/import-review-table";
import { ImportUploadZone } from "@/components/import/import-upload-zone";
import type { XlsxImportResult } from "@/app/actions/xlsx-import";
import { cn } from "@/lib/utils";

type ImportFlowProps = {
  summary: {
    workbookPath: string;
    sheetName: string;
    rowCount: number;
    dataFolder: string;
    categoryFiles: Array<{
      fileName: string;
      path: string;
      label: string;
    }>;
  };
  existingTemplateIds?: string[];
};

type Tab = "local" | "upload";

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: "local", label: "Yerel Workbook", icon: Database },
  { id: "upload", label: "Dosya Yükle", icon: Upload },
];

function Stat({ label, value, truncate = false }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 text-sm font-medium text-foreground", truncate && "truncate")}>{value}</p>
    </div>
  );
}

function LocalWorkbookPanel({ summary }: { summary: ImportFlowProps["summary"] }) {
  return (
    <div className="space-y-4">
      {/* Workbook details */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-start gap-4 border-b border-border bg-gray-50 px-5 py-4">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Yerel workbook bulundu</p>
            <p className="mt-0.5 break-all text-xs text-muted-foreground">{summary.workbookPath}</p>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-3">
          <Stat label="Sayfa adı" value={summary.sheetName} />
          <Stat label="Satır sayısı" value={String(summary.rowCount)} />
          <Stat label="Klasör" value={summary.dataFolder} truncate />
        </div>
      </div>

      {/* Category JSON files */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center gap-3 border-b border-border bg-gray-50 px-5 py-4">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
            <Layers3 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Kaynak dosyalar</p>
            <p className="text-xs text-muted-foreground">data/sources klasöründeki kategori JSON dosyaları</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {summary.categoryFiles.map((file) => (
            <div key={file.fileName} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">{file.label}</p>
              </div>
              <span className="ml-4 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {file.fileName}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Uygulama yalnızca{" "}
        <span className="font-medium text-foreground">data/sources</span>{" "}
        klasöründeki dosyaları okur. Dosyaları değiştirmek için doğrudan disk üzerinde güncelleyin ve sayfayı yenileyin.
      </p>
    </div>
  );
}

function UploadPanel({ existingIds }: { existingIds: Set<string> }) {
  const [parseResult, setParseResult] = useState<XlsxImportResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  function handleResult(result: XlsxImportResult, fileName: string) {
    setUploadedFileName(fileName);
    setParseResult(result);
  }

  return (
    <div className="space-y-5">
      <ImportUploadZone onResult={handleResult} />

      {parseResult && !parseResult.success && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">{parseResult.error}</p>
          {parseResult.detail && (
            <p className="mt-1.5 text-xs text-red-600">{parseResult.detail}</p>
          )}
        </div>
      )}

      {parseResult?.success && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            İçe aktarma önizlemesi
          </p>
          <ImportReviewTable
            rows={parseResult.rows}
            existingIds={existingIds}
            sheetName={parseResult.sheetName}
            fileName={uploadedFileName}
            skippedRows={parseResult.skippedRows}
            warnings={parseResult.warnings}
          />
        </div>
      )}
    </div>
  );
}

export function ImportFlow({ summary, existingTemplateIds = [] }: ImportFlowProps) {
  const [activeTab, setActiveTab] = useState<Tab>("local");
  const existingIds = new Set(existingTemplateIds);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Section header */}
      <div className="mb-6 flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Workbook okuma akışı</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Yerel workbook özetini görüntüleyin ya da harici bir XLSX dosyası yükleyerek
            MessageTemplate sayfasındaki satırları önizleyin.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1.5 rounded-xl border border-border bg-gray-50 p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
              activeTab === id
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "local" ? (
        <LocalWorkbookPanel summary={summary} />
      ) : (
        <UploadPanel existingIds={existingIds} />
      )}
    </div>
  );
}
