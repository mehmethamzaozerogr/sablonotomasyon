"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { categoryMeta, templateStatuses } from "@/lib/constants";
import type { TemplateCategory, TemplateRecord, TemplateStatus } from "@/types/template";
import { TemplateCard } from "@/components/templates/template-card";
import { cn } from "@/lib/utils";

type TemplateFilterProps = {
  templates: TemplateRecord[];
  categoryCounts: Record<string, number>;
};

type CategoryFilter = TemplateCategory | "all";
type StatusFilter = TemplateStatus | "all";

function FilterTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all",
        active
          ? "border-primary/30 bg-primary/8 text-primary"
          : "border-border bg-white text-muted-foreground hover:border-gray-300 hover:text-foreground",
      )}
    >
      {label}
      <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] tabular-nums", active ? "bg-primary/12 text-primary" : "bg-gray-100 text-muted-foreground")}>
        {count}
      </span>
    </button>
  );
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="rounded-xl bg-gray-100 p-4 text-gray-400">
        <Search className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-foreground">Sonuç bulunamadı</p>
      <p className="text-xs text-muted-foreground">
        {query ? `"${query}" için eşleşen şablon yok.` : "Bu filtreyle eşleşen şablon yok."}
      </p>
      <button type="button" onClick={onClear} className="text-xs text-primary hover:underline">
        Filtreleri temizle
      </button>
    </div>
  );
}

export function TemplateFilter({ templates, categoryCounts }: TemplateFilterProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.source.templateId.toLowerCase().includes(q) || (t.subject?.toLowerCase().includes(q) ?? false);
    });
  }, [templates, query, categoryFilter, statusFilter]);

  const hasActive = query !== "" || categoryFilter !== "all" || statusFilter !== "all";

  function clearAll() { setQuery(""); setCategoryFilter("all"); setStatusFilter("all"); }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ad, ID veya konu ara..."
            className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20" />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button type="button" onClick={() => setShowStatusFilter((v) => !v)}
          className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium", showStatusFilter ? "border-primary/30 bg-primary/8 text-primary" : "border-border bg-white text-muted-foreground hover:text-foreground")}>
          <SlidersHorizontal className="h-3.5 w-3.5" /> Durum
        </button>
        <div className="ml-auto text-xs text-muted-foreground">
          {hasActive ? (<><span className="font-semibold text-foreground">{filtered.length}</span> / {templates.length} şablon{" "}
            <button type="button" onClick={clearAll} className="ml-1 text-primary hover:underline">Temizle</button></>) :
            (<><span className="font-semibold text-foreground">{templates.length}</span> şablon</>)}
        </div>
      </div>

      {showStatusFilter && (
        <div className="flex flex-wrap gap-2">
          <FilterTab active={statusFilter === "all"} label="Tümü" count={templates.length} onClick={() => setStatusFilter("all")} />
          {(Object.keys(templateStatuses) as TemplateStatus[]).map((s) => (
            <FilterTab key={s} active={statusFilter === s} label={templateStatuses[s].label} count={templates.filter((t) => t.status === s).length} onClick={() => setStatusFilter(s)} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <FilterTab active={categoryFilter === "all"} label="Tümü" count={templates.length} onClick={() => setCategoryFilter("all")} />
        {(Object.keys(categoryMeta) as TemplateCategory[]).map((cat) => (
          <FilterTab key={cat} active={categoryFilter === cat} label={categoryMeta[cat].label} count={categoryCounts[cat] ?? 0} onClick={() => setCategoryFilter(cat)} />
        ))}
      </div>

      {filtered.length === 0 ? (<EmptyState query={query} onClear={clearAll} />) : (
        <div className="grid gap-4 xl:grid-cols-2">{filtered.map((t) => <TemplateCard key={t.id} template={t} />)}</div>
      )}
    </div>
  );
}
