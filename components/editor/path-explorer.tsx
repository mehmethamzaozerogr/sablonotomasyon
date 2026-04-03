"use client";

import { Search, GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";
import { searchBindingOptions } from "@/lib/bindings/introspection";
import type { BindingPathOption } from "@/types/binding";

type PathExplorerProps = {
  title: string;
  description: string;
  options: BindingPathOption[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (option: BindingPathOption) => void;
};

type DragPayload = {
  path: string;
  scope: "root" | "item";
  label: string;
  description?: string;
  group?: string;
};

export function PathExplorer({
  title,
  description,
  options,
  query,
  onQueryChange,
  onSelect,
}: PathExplorerProps) {
  const filteredOptions = searchBindingOptions(options, query);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, option: BindingPathOption) => {
    const payload: DragPayload = {
      path: option.path,
      scope: option.scope,
      label: option.label,
      description: option.description,
      group: option.group,
    };
    e.dataTransfer.setData("text/binding-option", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="border-b border-border bg-gray-50 px-3 py-2.5">
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{description}</p>
      </div>

      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Alan ara..."
            className="h-7 w-full rounded-lg border border-border bg-white pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
        {filteredOptions.length ? (
          <div className="grid gap-0.5 p-1.5">
            {filteredOptions.map((option) => (
              <button
                key={`${option.scope}:${option.displayPath}`}
                type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, option)}
                onClick={() => onSelect(option)}
                className="group flex cursor-grab items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-gray-50 active:cursor-grabbing"
              >
                <GripVertical className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      {option.label && option.label !== option.displayPath ? (
                        <p className="truncate text-xs font-semibold text-foreground">
                          {option.label}
                        </p>
                      ) : null}
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {option.displayPath}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide",
                        option.scope === "item"
                          ? "bg-violet-100 text-violet-600"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {option.kind}
                    </span>
                  </div>
                  {option.description ? (
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {option.description}
                    </p>
                  ) : option.sample ? (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {option.sample}
                    </p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            Eşleşen alan bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
