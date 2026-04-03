"use client";

import { useState } from "react";
import { List, RotateCcw } from "lucide-react";

import { BindingChip } from "@/components/editor/binding-chip";
import { PathExplorer } from "@/components/editor/path-explorer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryMeta } from "@/lib/constants";
import { getRepeaterSourceOptions } from "@/lib/bindings/introspection";
import { createDefaultRepeaterBinding } from "@/lib/bindings/runtime";
import type { BindingPathOption, RepeaterBinding } from "@/types/binding";
import type { TemplateCategory } from "@/types/template";

type RepeaterBindingControlProps = {
  category: TemplateCategory;
  sourceData: unknown;
  repeater?: RepeaterBinding | null;
  onChange: (repeater: RepeaterBinding) => void;
  onClear: () => void;
};

export function RepeaterBindingControl({
  category,
  sourceData,
  repeater,
  onChange,
  onClear,
}: RepeaterBindingControlProps) {
  const [query, setQuery] = useState("");
  const options = getRepeaterSourceOptions(sourceData);
  const categoryLabel = categoryMeta[category].label;

  const selectSource = (option: BindingPathOption) => {
    const nextRepeater = createDefaultRepeaterBinding({
      sourcePath: option.path,
      label: option.displayPath,
    });
    nextRepeater.itemAlias = repeater?.itemAlias ?? "item";
    nextRepeater.emptyFallback = repeater?.emptyFallback ?? "Gösterilecek kayıt bulunamadı.";
    nextRepeater.limit = repeater?.limit;
    onChange(nextRepeater);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-violet-200 bg-violet-50/50">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-violet-200 bg-violet-50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-violet-100 p-1 text-violet-600">
            <List className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Tekrar kaynağı</p>
            <p className="text-[11px] text-muted-foreground">
              Bu bloğu bir liste alanına bağlayın.
            </p>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-red-500">
          <RotateCcw className="h-3 w-3" />
          Sıfırla
        </Button>
      </div>

      <div className="space-y-3 p-3">
        {/* Current source */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Seçili kaynak
          </p>
          {repeater?.sourcePath ? (
            <BindingChip
              segment={{
                id: repeater.sourcePath,
                kind: "path",
                scope: "root",
                path: repeater.sourcePath,
                label: repeater.label,
              }}
            />
          ) : (
            <p className="text-xs text-muted-foreground">Henüz kaynak seçilmedi.</p>
          )}
        </div>

        {/* Path picker */}
        <PathExplorer
          title={`${categoryLabel} liste alanları`}
          description="Yalnızca dizi alanları gösterilir."
          options={options}
          query={query}
          onQueryChange={setQuery}
          onSelect={selectSource}
        />

        {/* Config fields */}
        <div className="grid grid-cols-3 gap-2">
          <label className="grid gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">Takma ad</span>
            <Input
              className="h-8 text-xs"
              value={repeater?.itemAlias ?? "item"}
              onChange={(e) =>
                onChange({
                  ...(repeater ?? createDefaultRepeaterBinding({ sourcePath: "", label: "" })),
                  itemAlias: e.target.value || "item",
                })
              }
              placeholder="item"
            />
          </label>
          <label className="col-span-2 grid gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">Boş durum metni</span>
            <Input
              className="h-8 text-xs"
              value={repeater?.emptyFallback ?? ""}
              onChange={(e) =>
                onChange({
                  ...(repeater ?? createDefaultRepeaterBinding({ sourcePath: "", label: "" })),
                  emptyFallback: e.target.value,
                })
              }
              placeholder="Kayıt bulunamadı."
            />
          </label>
        </div>
      </div>
    </div>
  );
}
