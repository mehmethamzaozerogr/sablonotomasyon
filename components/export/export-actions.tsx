"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Braces,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  FileText,
  Layers3,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { categoryMeta } from "@/lib/constants";
import { compileOriginalHtml } from "@/lib/preview/compile-to-html";
import { exportTemplatesToXlsx } from "@/lib/xlsx/workbook-writer";
import type { TemplateCategory, TemplateRecord } from "@/types/template";
import { cn } from "@/lib/utils";

type ExportActionsProps = {
  templates: TemplateRecord[];
  categorySources: Record<TemplateCategory, unknown>;
};

function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Bulk XLSX export button
// ---------------------------------------------------------------------------

function XlsxExportButton({ templates, categorySources }: ExportActionsProps) {
  const [state, setState] = useState<"idle" | "building" | "done">("idle");

  async function handleExport() {
    setState("building");
    try {
      await exportTemplatesToXlsx(
        templates,
        `sablonlar-${new Date().toISOString().slice(0, 10)}.xlsx`,
        (template) => compileOriginalHtml(template, categorySources[template.category]),
      );
      setState("done");
      window.setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      console.error("XLSX dışa aktarma başarısız:", err);
      setState("idle");
    }
  }

  return (
    <Button onClick={() => void handleExport()} disabled={state === "building"}>
      {state === "building" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "done" ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" />
      )}
      {state === "building"
        ? "Hazırlanıyor…"
        : state === "done"
          ? "İndirildi"
          : "Tüm şablonları XLSX olarak indir"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Export mode info cards
// ---------------------------------------------------------------------------

const exportModes = [
  {
    title: "Derlenmiş HTML çıktısı",
    description: "Editörde yapılan değişiklikler ve veri bağları dahil, tam HTML belgesi olarak indirilir.",
    icon: FileText,
    iconBg: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
  },
  {
    title: "Workbook XLSX dışa aktarımı",
    description: "Tüm şablonlar MessageTemplate sayfası formatında tek bir XLSX dosyasına yazılır.",
    icon: FileSpreadsheet,
    iconBg: "bg-blue-100 text-blue-600",
    border: "border-blue-200",
  },
  {
    title: "Yapısal bağ özeti",
    description: "Blok yapısı ve alan bağları editörde görüntülenebilir; kaynak workbook sütunlarıyla eşleştirilir.",
    icon: Braces,
    iconBg: "bg-emerald-100 text-emerald-600",
    border: "border-emerald-200",
  },
] as const;

// ---------------------------------------------------------------------------
// Per-template row
// ---------------------------------------------------------------------------

function TemplateRow({ template, sourceData }: { template: TemplateRecord; sourceData: unknown }) {
  const [htmlState, setHtmlState] = useState<"idle" | "done">("idle");
  const catMeta = categoryMeta[template.category];

  function handleHtmlDownload() {
    const html = compileOriginalHtml(template, sourceData);
    downloadText(html, `${template.slug || template.id}.html`, "text/html");
    setHtmlState("done");
    window.setTimeout(() => setHtmlState("idle"), 3000);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-card-hover">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{template.name}</p>
            <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium", catMeta?.surface, catMeta?.accent)}>
              {catMeta?.label ?? template.category}
            </span>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                template.status === "active"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : template.status === "review"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-gray-200 bg-gray-100 text-gray-500",
              )}
            >
              {template.status === "active" ? "Aktif" : template.status === "review" ? "İncelemede" : "Taslak"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {template.source.templateType} / {template.source.templateId}
          </p>
          {template.subject && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{template.subject}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:ml-4">
          <Button size="sm" variant="outline" onClick={handleHtmlDownload}>
            {htmlState === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {htmlState === "done" ? "İndirildi" : "HTML indir"}
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/templates/${template.id}`}>
              Editörü aç
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Source metadata strip */}
      <div className="grid gap-4 border-t border-border bg-gray-50 px-5 py-3 sm:grid-cols-3">
        <MetaCell label="Şablon motoru" value={template.source.templateEngine || "—"} />
        <MetaCell label="İçerik tipi" value={template.source.contentType || "—"} />
        <MetaCell label="Blok sayısı" value={`${template.blocks.length} blok`} />
      </div>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ExportActions({ templates, categorySources }: ExportActionsProps) {
  return (
    <div className="space-y-6">
      {/* Mode overview cards */}
      <div className="grid gap-4 xl:grid-cols-3">
        {exportModes.map((mode) => {
          const Icon = mode.icon;
          return (
            <div key={mode.title} className={cn("rounded-xl border bg-white p-5", mode.border)}>
              <div className={cn("inline-flex rounded-lg p-2.5", mode.iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{mode.title}</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{mode.description}</p>
            </div>
          );
        })}
      </div>

      {/* Bulk XLSX export */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Toplu XLSX dışa aktarımı</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Tüm şablonlar derlenip MessageTemplate sayfası formatında tek bir XLSX dosyasına yazılır.
              </p>
            </div>
          </div>
          <XlsxExportButton templates={templates} categorySources={categorySources} />
        </div>
      </div>

      {/* Per-template list */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Tekil dışa aktarım</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Her şablon için derlenmiş HTML indirin veya editörde açın.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-muted-foreground">
            {templates.length} şablon
          </span>
        </div>

        <div className="grid gap-3">
          {templates.map((template) => (
            <TemplateRow
              key={template.id}
              template={template}
              sourceData={categorySources[template.category]}
            />
          ))}
          {templates.length === 0 && (
            <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-center">
              <Clock3 className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Henüz şablon bulunamadı. Workbook okuma işlemini kontrol edin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
