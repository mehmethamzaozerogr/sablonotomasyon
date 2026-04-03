"use client";

import { useId, useMemo, useState } from "react";
import { ChevronDown, GripVertical, Link2, RotateCcw, Search } from "lucide-react";

import { BindingChip } from "@/components/editor/binding-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { categoryMeta } from "@/lib/constants";
import {
  getBindingPathOptions,
  getRepeaterItemOptions,
  searchBindingOptions,
} from "@/lib/bindings/introspection";
import { createDefaultBinding } from "@/lib/bindings/runtime";
import { cn } from "@/lib/utils";
import type {
  BlockFieldBinding,
  BindingFieldTarget,
  BindingPathOption,
} from "@/types/binding";
import type { TemplateCategory } from "@/types/template";

type FieldBindingControlProps = {
  category: TemplateCategory;
  sourceData: unknown;
  fieldKey: string;
  fieldLabel: string;
  target: BindingFieldTarget;
  binding?: BlockFieldBinding;
  repeaterPath?: string;
  defaultOpen?: boolean;
  onChange: (binding: BlockFieldBinding) => void;
  onClear: () => void;
};

function createSegmentId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureBinding(
  binding: BlockFieldBinding | undefined,
  target: BindingFieldTarget,
) {
  return binding ? { ...binding, segments: [...binding.segments] } : createDefaultBinding(target);
}

export function inferBindingTarget(fieldKey: string): BindingFieldTarget {
  const key = fieldKey.toLowerCase();
  if (key.includes("src") || key.includes("image")) return "image";
  if (key.includes("href") || key.includes("url") || key.includes("link")) return "href";
  if (key.includes("price") || key.includes("subtotal") || key.includes("tax") || key.includes("total")) return "price";
  if (key.includes("badge") || key === "status") return "badge";
  if (key.includes("headline") || key.includes("title")) return "title";
  if (key.includes("label")) return "label";
  return "text";
}

// ─── VariableBrowser ────────────────────────────────────────────────────────

type VariableBrowserProps = {
  rootOptions: BindingPathOption[];
  itemOptions: BindingPathOption[];
  onSelect: (opt: BindingPathOption) => void;
};

type DragPayload = {
  path: string;
  scope: "root" | "item";
  label: string;
  description?: string;
  group?: string;
};

// Leaf scalar kinds only — skip objects/arrays from root display
function isLeafOption(opt: BindingPathOption): boolean {
  return opt.kind !== "object" && opt.kind !== "array";
}

function VariableBrowser({ rootOptions, itemOptions, onSelect }: VariableBrowserProps) {
  const [query, setQuery] = useState("");

  // Filter to scalar leaves only, then apply search
  const filteredRoot = searchBindingOptions(
    rootOptions.filter(isLeafOption),
    query,
  );
  const filteredItem = searchBindingOptions(
    itemOptions.filter(isLeafOption),
    query,
  );

  // Group options by their `group` field, preserving insertion order
  function groupBy(opts: BindingPathOption[]): Map<string, BindingPathOption[]> {
    const map = new Map<string, BindingPathOption[]>();
    for (const opt of opts) {
      const key = opt.group ?? "Diğer";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(opt);
    }
    return map;
  }

  const rootGroups = useMemo(() => groupBy(filteredRoot), [filteredRoot]);
  const itemGroups = useMemo(() => groupBy(filteredItem), [filteredItem]);

  const hasOptions = rootOptions.length > 0 || itemOptions.length > 0;
  if (!hasOptions) return null;

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, opt: BindingPathOption) => {
    const payload: DragPayload = {
      path: opt.path,
      scope: opt.scope,
      label: opt.label,
      description: opt.description,
      group: opt.group,
    };
    e.dataTransfer.setData("text/binding-option", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  const renderOption = (opt: BindingPathOption) => (
    <button
      key={`${opt.scope}:${opt.displayPath}`}
      type="button"
      draggable
      onDragStart={(e) => handleDragStart(e, opt)}
      onClick={() => onSelect(opt)}
      className="group flex w-full cursor-grab items-start gap-2 border-b border-border px-2.5 py-1.5 text-left last:border-0 hover:bg-white active:cursor-grabbing"
    >
      <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-foreground">{opt.label}</p>
        <p className="truncate font-mono text-[10px] text-muted-foreground">{opt.displayPath}</p>
        {opt.description ? (
          <p className="truncate text-[10px] text-slate-400">{opt.description}</p>
        ) : null}
      </div>
    </button>
  );

  const renderGroups = (groups: Map<string, BindingPathOption[]>) => (
    <>
      {Array.from(groups.entries()).map(([groupName, opts]) => (
        <div key={groupName}>
          <p className="sticky top-0 z-10 bg-gray-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
            {groupName}
          </p>
          {opts.map(renderOption)}
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Değişken ara..."
          className="h-7 w-full rounded-lg border border-border bg-white pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
        />
      </div>

      {/* Root options */}
      {filteredRoot.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Veri Alanları
          </p>
          <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border bg-gray-50 scrollbar-thin">
            {renderGroups(rootGroups)}
          </div>
        </div>
      )}

      {/* Item options */}
      {filteredItem.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Öğe Alanları
          </p>
          <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border bg-gray-50 scrollbar-thin">
            {renderGroups(itemGroups)}
          </div>
        </div>
      )}

      {filteredRoot.length === 0 && filteredItem.length === 0 && query && (
        <p className="py-3 text-center text-[11px] text-muted-foreground">
          Eşleşen değişken bulunamadı.
        </p>
      )}
    </div>
  );
}

// ─── FieldBindingControl ────────────────────────────────────────────────────

export function FieldBindingControl({
  category,
  sourceData,
  fieldKey,
  fieldLabel,
  target,
  binding,
  repeaterPath,
  defaultOpen = false,
  onChange,
  onClear,
}: FieldBindingControlProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [staticText, setStaticText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const bindingId = useId();
  const categoryLabel = categoryMeta[category].label;

  const rootOptions = getBindingPathOptions(sourceData);
  const itemOptions = repeaterPath ? getRepeaterItemOptions(sourceData, repeaterPath) : [];
  const activeSegments = binding?.segments ?? [];
  const isBound = activeSegments.length > 0;

  const appendPath = (option: BindingPathOption) => {
    const nextBinding = ensureBinding(binding, target);
    nextBinding.segments.push({
      id: createSegmentId("path"),
      kind: "path",
      scope: option.scope,
      path: option.path,
      label: option.displayPath,
    });
    onChange(nextBinding);
  };

  const appendStatic = () => {
    if (!staticText.trim()) return;
    const nextBinding = ensureBinding(binding, target);
    nextBinding.segments.push({
      id: createSegmentId("static"),
      kind: "static",
      value: staticText,
    });
    setStaticText("");
    onChange(nextBinding);
  };

  const removeSegment = (segmentId: string) => {
    if (!binding) return;
    onChange({ ...binding, segments: binding.segments.filter((s) => s.id !== segmentId) });
  };

  const updateFormat = (value: BlockFieldBinding["format"]["type"]) => {
    const nextBinding = ensureBinding(binding, target);
    if (value === "text") {
      nextBinding.format = {
        type: "text",
        transform: nextBinding.format.type === "text" ? nextBinding.format.transform : "none",
      };
    } else if (value === "currency") {
      nextBinding.format = {
        type: "currency",
        locale: nextBinding.format.type === "currency" ? nextBinding.format.locale : "tr-TR",
        currency: nextBinding.format.type === "currency" ? nextBinding.format.currency : "TRY",
      };
    } else {
      nextBinding.format = { type: "none" };
    }
    onChange(nextBinding);
  };

  const updateFallback = (value: string) => {
    const nextBinding = ensureBinding(binding, target);
    nextBinding.fallback = value;
    onChange(nextBinding);
  };

  const textFormat = binding?.format.type === "text" ? binding.format : null;
  const currencyFormat = binding?.format.type === "currency" ? binding.format : null;

  // Drop-target handler: accepts dragged variable options
  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData("text/binding-option");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        path: string;
        scope: "root" | "item";
        label: string;
        description?: string;
        group?: string;
      };
      const option: BindingPathOption = {
        path: data.path,
        displayPath: data.scope === "item" ? `item.${data.path}` : data.path,
        label: data.label,
        scope: data.scope,
        kind: "string",
        depth: 0,
        sample: undefined,
        searchText: "",
        description: data.description,
        group: data.group,
      };
      appendPath(option);
    } catch {
      // ignore malformed drag data
    }
  };

  const firstSegmentLabel = activeSegments[0]?.kind === "path"
    ? activeSegments[0].label
    : activeSegments[0]?.kind === "static"
      ? `"${activeSegments[0].value}"`
      : null;

  return (
    <div className={cn(
      "overflow-hidden rounded-lg border transition-colors",
      isBound ? "border-primary/30 bg-primary/[0.02]" : "border-border",
      isDragOver && "border-primary ring-1 ring-primary/30",
    )}>
      {/* Compact header row — also a drop target */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex w-full items-center justify-between gap-3 bg-white px-3 py-2 text-left transition-colors hover:bg-gray-50",
          isBound && "bg-primary/[0.02] hover:bg-primary/[0.04]",
          isDragOver && "bg-primary/5",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Link2 className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isBound ? "text-primary" : "text-slate-400")} />
          <div className="min-w-0">
            {isDragOver ? (
              <span className="truncate text-xs font-medium text-primary">Drop to bind</span>
            ) : (
              <>
                <p className="truncate text-[11px] font-semibold text-foreground">{fieldLabel}</p>
                {isBound && firstSegmentLabel && !isOpen ? (
                  <p className="truncate font-mono text-[10px] text-primary/70">{firstSegmentLabel}{activeSegments.length > 1 ? ` +${activeSegments.length - 1}` : ""}</p>
                ) : !isBound && !isOpen ? (
                  <p className="text-[10px] text-slate-400">Click to bind a variable</p>
                ) : null}
              </>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isBound ? (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
              bound
            </span>
          ) : null}
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="space-y-3 border-t border-border bg-gray-50/50 px-3 py-3">
          {/* Active segments */}
          {isBound && (
            <div className="flex flex-wrap gap-1.5">
              {activeSegments.map((segment) => (
                <BindingChip
                  key={segment.id}
                  segment={segment}
                  onRemove={() => removeSegment(segment.id)}
                />
              ))}
            </div>
          )}

          {/* Static text input */}
          <div className="flex gap-2">
            <input
              value={staticText}
              onChange={(e) => setStaticText(e.target.value)}
              placeholder="Sabit metin ekle..."
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); appendStatic(); } }}
              className="h-8 flex-1 rounded-lg border border-border bg-white px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
            />
            <Button type="button" variant="secondary" size="sm" className="h-8 px-3 text-xs" onClick={appendStatic}>
              Ekle
            </Button>
          </div>

          {/* Variable browser */}
          <VariableBrowser
            rootOptions={rootOptions}
            itemOptions={itemOptions}
            onSelect={appendPath}
          />

          {/* Fallback + Format */}
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-[10px] font-medium text-muted-foreground">Yedek değer</span>
              <Input
                className="h-8 text-xs"
                value={binding?.fallback ?? ""}
                onChange={(e) => updateFallback(e.target.value)}
                placeholder="Boş dönerse gösterilir"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] font-medium text-muted-foreground">Biçim</span>
              <Select
                className="h-8 text-xs"
                value={binding?.format.type ?? "none"}
                onChange={(e) => updateFormat(e.target.value as BlockFieldBinding["format"]["type"])}
              >
                <option value="none">Biçim yok</option>
                <option value="text">Metin</option>
                <option value="currency">Para birimi</option>
              </Select>
            </label>
          </div>

          {textFormat ? (
            <label className="grid gap-1">
              <span className="text-[10px] font-medium text-muted-foreground">Metin dönüşümü</span>
              <Select
                className="h-8 text-xs"
                value={textFormat.transform}
                onChange={(e) =>
                  binding
                    ? onChange({
                        ...binding,
                        format: {
                          type: "text",
                          transform: e.target.value as "none" | "uppercase" | "lowercase" | "title",
                        },
                      })
                    : undefined
                }
              >
                <option value="none">Yok</option>
                <option value="uppercase">Büyük harf</option>
                <option value="lowercase">Küçük harf</option>
                <option value="title">Başlık biçimi</option>
              </Select>
            </label>
          ) : null}

          {currencyFormat ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1">
                <span className="text-[10px] font-medium text-muted-foreground">Yerel ayar</span>
                <Input
                  className="h-8 text-xs"
                  value={currencyFormat.locale}
                  onChange={(e) =>
                    binding
                      ? onChange({
                          ...binding,
                          format: {
                            type: "currency",
                            locale: e.target.value || "tr-TR",
                            currency: currencyFormat.currency,
                            currencyPath: currencyFormat.currencyPath,
                          },
                        })
                      : undefined
                  }
                  placeholder="tr-TR"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-medium text-muted-foreground">Para birimi</span>
                <Input
                  className="h-8 text-xs"
                  value={currencyFormat.currency ?? ""}
                  onChange={(e) =>
                    binding
                      ? onChange({
                          ...binding,
                          format: {
                            type: "currency",
                            locale: currencyFormat.locale,
                            currency: e.target.value || undefined,
                            currencyPath: currencyFormat.currencyPath,
                          },
                        })
                      : undefined
                  }
                  placeholder="TRY"
                />
              </label>
            </div>
          ) : null}

          {/* Category label reference (hidden, kept for layout parity) */}
          <input
            type="hidden"
            value={categoryLabel}
            readOnly
            aria-hidden="true"
          />

          {/* Reset */}
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-red-500"
            >
              <RotateCcw className="h-3 w-3" />
              Sıfırla
            </Button>
          </div>
        </div>
      )}

      <input id={bindingId} className="hidden" value={fieldKey} readOnly aria-hidden="true" tabIndex={-1} />
    </div>
  );
}
