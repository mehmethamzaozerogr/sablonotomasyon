"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { categoryMeta } from "@/lib/constants";
import type { ParsedWorkbookRow } from "@/lib/xlsx/types";
import { cn } from "@/lib/utils";

type SortKey = "rowIndex" | "templateId" | "title" | "templateType" | "isEnabled";
type SortDir = "asc" | "desc";

type ImportReviewTableProps = {
  rows: ParsedWorkbookRow[];
  existingIds: Set<string>;
  sheetName: string;
  fileName: string;
  skippedRows: number;
  warnings: string[];
};

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        enabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-gray-200 bg-gray-100 text-gray-500",
      )}
    >
      {enabled ? "Aktif" : "Taslak"}
    </span>
  );
}

function CategoryPill({ category }: { category: string | null }) {
  if (!category) {
    return (
      <span className="inline-block rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-600">
        Bilinmiyor
      </span>
    );
  }
  const meta = categoryMeta[category as keyof typeof categoryMeta];
  return (
    <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium", meta?.surface ?? "border-gray-200 bg-gray-100", meta?.accent ?? "text-gray-600")}>
      {meta?.label ?? category}
    </span>
  );
}

function ExistenceBadge({ exists }: { exists: boolean }) {
  if (exists) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600">
        <CheckCircle2 className="h-3 w-3" />
        Mevcut
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
      <Info className="h-3 w-3" />
      Yeni
    </span>
  );
}

function sortRows(rows: ParsedWorkbookRow[], key: SortKey, dir: SortDir): ParsedWorkbookRow[] {
  return [...rows].sort((a, b) => {
    let aVal: string | number | boolean = a[key];
    let bVal: string | number | boolean = b[key];
    if (typeof aVal === "boolean") aVal = aVal ? 1 : 0;
    if (typeof bVal === "boolean") bVal = bVal ? 1 : 0;
    const cmp =
      typeof aVal === "number" && typeof bVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), "tr");
    return dir === "asc" ? cmp : -cmp;
  });
}

export function ImportReviewTable({
  rows,
  existingIds,
  sheetName,
  fileName,
  skippedRows,
  warnings,
}: ImportReviewTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [sortKey, setSortKey] = useState<SortKey>("rowIndex");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showWarnings, setShowWarnings] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const sorted = useMemo(() => sortRows(rows, sortKey, sortDir), [rows, sortKey, sortDir]);
  const allSelected = selectedIds.size === rows.length && rows.length > 0;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(rows.map((r) => r.templateId)));
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const firstSelectedId = selectedIds.size === 1 ? [...selectedIds][0] : null;
  const firstSelectedRow = firstSelectedId ? rows.find((r) => r.templateId === firstSelectedId) : null;
  const hasWarnings = warnings.length > 0;

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />;
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{rows.length}</span> satır okundu
          </span>
          {skippedRows > 0 && (
            <span className="text-amber-600">{skippedRows} satır atlandı</span>
          )}
          <span className="text-muted-foreground/60">{fileName} → {sheetName}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasWarnings && (
            <button
              type="button"
              onClick={() => setShowWarnings((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 transition hover:bg-amber-100"
            >
              <AlertTriangle className="h-3 w-3" />
              {warnings.length} uyarı
            </button>
          )}
          {selectedIds.size > 0 && firstSelectedRow?.inferredCategory && (
            <Button asChild size="sm">
              <Link href={`/templates/${firstSelectedRow.templateId}`}>
                Editörde aç
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Warnings panel */}
      {showWarnings && hasWarnings && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">
            İçe aktarma uyarıları
          </p>
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs leading-5 text-amber-800">
                · {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 cursor-pointer accent-violet-600"
                  aria-label="Tümünü seç"
                />
              </th>
              {(
                [
                  { key: "rowIndex" as SortKey, label: "#" },
                  { key: "templateId" as SortKey, label: "TemplateID" },
                  { key: "title" as SortKey, label: "Başlık" },
                  { key: "templateType" as SortKey, label: "Tip" },
                  { key: "isEnabled" as SortKey, label: "Durum" },
                ] as const
              ).map(({ key, label }) => (
                <th key={key} className="px-4 py-3 text-left">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground transition hover:text-foreground"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} />
                  </button>
                </th>
              ))}
              {(["Kategori", "Kayıt", "Detay"] as const).map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const selected = selectedIds.has(row.templateId);
              const exists = existingIds.has(row.templateId);
              const expanded = expandedIds.has(row.templateId);
              const hasRowWarnings = row.importWarnings.length > 0;

              return (
                <>
                  <tr
                    key={row.templateId}
                    className={cn(
                      "border-b border-border transition-colors last:border-0",
                      selected ? "bg-primary/[0.04]" : "hover:bg-gray-50",
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRow(row.templateId)}
                        className="h-3.5 w-3.5 cursor-pointer accent-violet-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.rowIndex}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-foreground">{row.templateId}</span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                      {row.messageSubject ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.messageSubject}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{row.templateType || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge enabled={row.isEnabled} /></td>
                    <td className="px-4 py-3"><CategoryPill category={row.inferredCategory} /></td>
                    <td className="px-4 py-3"><ExistenceBadge exists={exists} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {hasRowWarnings && (
                          <span title="Bu satırda uyarılar var">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleExpand(row.templateId)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-gray-100 hover:text-foreground"
                          title={expanded ? "Daralt" : "Genişlet"}
                        >
                          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expanded && (
                    <tr key={`${row.templateId}-expanded`} className="border-b border-border bg-gray-50/70">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <Field label="Konu" value={row.messageSubject} />
                          <Field label="Şablon motoru" value={row.templateEngine} />
                          <Field label="İçerik tipi" value={row.contentType} />
                          <Field label="Oluşturma tarihi" value={row.createdDate} />
                          <Field label="Kaynak dosya" value={row.sourceFileName} />
                          <Field
                            label="MessageDetail (ilk 80 karakter)"
                            value={
                              row.messageDetail
                                ? row.messageDetail.slice(0, 80) + (row.messageDetail.length > 80 ? "…" : "")
                                : "(boş)"
                            }
                          />
                        </div>
                        {row.importWarnings.length > 0 && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                              Satır uyarıları
                            </p>
                            <ul className="space-y-1">
                              {row.importWarnings.map((w, i) => (
                                <li key={i} className="text-xs text-amber-800">· {w}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="flex min-h-[120px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Gösterilecek satır yok.</p>
          </div>
        )}
      </div>

      {/* Selection footer */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{selectedIds.size}</span> satır seçildi
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              Seçimi kaldır
            </Button>
            {firstSelectedRow?.inferredCategory && (
              <Button asChild size="sm">
                <Link href={`/templates/${firstSelectedRow.templateId}`}>
                  Editörde aç
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-all text-xs text-foreground">{value || "—"}</p>
    </div>
  );
}
