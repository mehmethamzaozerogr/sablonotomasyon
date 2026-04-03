"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { HtmlVarReplacementOption } from "@/lib/bindings/html-vars";
import { cn } from "@/lib/utils";

type HtmlVarPickerProps = {
  options: HtmlVarReplacementOption[];
  onSelect: (path: string) => void;
  onClose?: () => void;
  className?: string;
};

export function HtmlVarPicker({
  options,
  onSelect,
  onClose,
  className,
}: HtmlVarPickerProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options.slice(0, 80);
    return options.filter((option) => option.searchText.includes(normalized)).slice(0, 80);
  }, [options, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, HtmlVarReplacementOption[]>();
    for (const option of filtered) {
      const key = option.group ?? "Diğer";
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(option);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-white shadow-xl", className)}>
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Değişken ara..."
            className="h-8 w-full rounded-md border border-border bg-gray-50 pl-7 pr-2 text-xs focus:border-primary/40 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-[260px] overflow-y-auto scrollbar-thin">
        {grouped.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">Uygun değişken bulunamadı.</p>
        ) : (
          grouped.map(([group, groupOptions]) => (
            <div key={group}>
              <p className="sticky top-0 z-10 bg-gray-50 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {group}
              </p>
              {groupOptions.map((option) => (
                <button
                  key={option.displayPath}
                  type="button"
                  onClick={() => {
                    onSelect(option.replacePath);
                    onClose?.();
                  }}
                  className="flex w-full items-start gap-2 border-b border-border/60 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-primary/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{option.label}</p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">{option.displayPath}</p>
                    {option.sample ? (
                      <p className="truncate text-[10px] text-muted-foreground/80">{option.sample}</p>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>

      {onClose ? (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md py-1 text-xs text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground"
          >
            Kapat
          </button>
        </div>
      ) : null}
    </div>
  );
}
