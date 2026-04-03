"use client";

import { memo, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

import { BlockIcon } from "@/components/editor/block-icon";
import type { BlockPreset } from "@/types/template";
import { cn } from "@/lib/utils";

type BlockLibraryProps = {
  presets: BlockPreset[];
  onInsert?: (preset: BlockPreset) => void;
};

// ---------------------------------------------------------------------------
// Draggable card
// ---------------------------------------------------------------------------

const DraggableLibraryItem = memo(function DraggableLibraryItem({
  preset,
  onInsert,
}: {
  preset: BlockPreset;
  onInsert?: (preset: BlockPreset) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${preset.type}`,
    data: { origin: "library", preset },
  });

  return (
    <button
      ref={setNodeRef}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-3 text-center",
        "transition-all duration-100 hover:border-primary/30 hover:shadow-card-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        isDragging && "opacity-40 shadow-lg",
      )}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      type="button"
      onClick={() => onInsert?.(preset)}
      {...listeners}
      {...attributes}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 text-primary transition-colors group-hover:bg-primary/12">
        <BlockIcon type={preset.type} className="h-5 w-5" />
      </div>
      <span className="text-[11px] font-medium leading-tight text-foreground">
        {preset.name}
      </span>
    </button>
  );
});

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

const TEMEL_TYPES = new Set(["hero", "richText", "cta", "divider", "spacer", "image", "footer", "customHtml", "note", "dataTable"]);
const MUSTERI_TYPES = new Set(["address", "customerInfo"]);
const TICARET_TYPES = new Set(["lineItems", "totals", "summary", "status", "promotionBanner", "productCard", "loyaltyPoints", "ratingRequest"]);
const KATEGORI_TYPES = new Set([
  "shippingInfo", "returnInfo",
  "orderSummary", "paymentInfo", "supportSection",
  "invoiceSummary", "invoiceNotice",
  "shipmentSummary", "trackingTimeline",
  "returnReason", "returnInstructions",
]);

type Group = { label: string; presets: BlockPreset[] };

function groupPresets(presets: BlockPreset[]): Group[] {
  const temel: BlockPreset[] = [];
  const musteri: BlockPreset[] = [];
  const ticaret: BlockPreset[] = [];
  const kategori: BlockPreset[] = [];

  for (const p of presets) {
    if (TEMEL_TYPES.has(p.type)) temel.push(p);
    else if (MUSTERI_TYPES.has(p.type)) musteri.push(p);
    else if (TICARET_TYPES.has(p.type)) ticaret.push(p);
    else if (KATEGORI_TYPES.has(p.type)) kategori.push(p);
    else temel.push(p);
  }

  const groups: Group[] = [];
  if (temel.length) groups.push({ label: "Temel", presets: temel });
  if (musteri.length) groups.push({ label: "Müşteri ve Adres", presets: musteri });
  if (ticaret.length) groups.push({ label: "Ticaret ve Pazarlama", presets: ticaret });
  if (kategori.length) groups.push({ label: "Kategori", presets: kategori });
  return groups;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BlockLibrary({ presets, onInsert }: BlockLibraryProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return presets;
    const q = query.toLowerCase();
    return presets.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    );
  }, [presets, query]);

  const groups = useMemo(() => groupPresets(filtered), [filtered]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-4">
        <h2 className="text-sm font-semibold text-foreground">Bileşen Kütüphanesi</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {presets.length} bileşen · sürükle veya tıkla
        </p>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bileşen ara..."
            className="h-8 w-full rounded-lg border border-border bg-muted/50 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Search className="h-5 w-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Eşleşen bileşen bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-5 p-4">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.presets.map((preset) => (
                    <DraggableLibraryItem key={preset.type} preset={preset} onInsert={onInsert} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
