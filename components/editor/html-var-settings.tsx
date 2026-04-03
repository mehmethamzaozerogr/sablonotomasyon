"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { HtmlVarPicker } from "@/components/editor/html-var-picker";
import {
  extractHtmlVarOccurrences,
  getCompatibleHtmlVarOptions,
  type HtmlVarOccurrence,
  type HtmlVarKind,
} from "@/lib/bindings/html-vars";
import { cn } from "@/lib/utils";
import type { EditorBlock } from "@/types/template";

type HtmlVarSettingsProps = {
  block: EditorBlock;
  sourceData: unknown;
  activeOccurrenceId?: string | null;
  onSelectOccurrence?: (occurrence: HtmlVarOccurrence) => void;
  onReplace: (occurrenceId: string, newPath: string) => void;
};

type VarRowProps = {
  occurrence: HtmlVarOccurrence;
  sourceData: unknown;
  active: boolean;
  onSelectOccurrence?: (occurrence: HtmlVarOccurrence) => void;
  onReplace: (occurrenceId: string, newPath: string) => void;
};

const KIND_BADGE_STYLES: Record<HtmlVarKind, string> = {
  variable: "bg-sky-100 text-sky-700",
  if: "bg-amber-100 text-amber-700",
  elseif: "bg-amber-100 text-amber-700",
  else: "bg-gray-100 text-gray-600",
  end: "bg-gray-100 text-gray-600",
  for: "bg-violet-100 text-violet-700",
  expression: "bg-teal-100 text-teal-700",
};

const KIND_LABELS: Record<HtmlVarKind, string> = {
  variable: "değişken",
  if: "koşul",
  elseif: "koşul",
  else: "else",
  end: "end",
  for: "döngü",
  expression: "ifade",
};

function VarRow({
  occurrence,
  sourceData,
  active,
  onSelectOccurrence,
  onReplace,
}: VarRowProps) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const isReplaceable = occurrence.kind === "variable";

  const options = useMemo(
    () => getCompatibleHtmlVarOptions(sourceData, occurrence),
    [sourceData, occurrence],
  );

  useEffect(() => {
    if (active) {
      rowRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [active]);

  return (
    <div
      ref={rowRef}
      className={cn(
        "overflow-hidden rounded-lg border transition-colors",
        active ? "border-primary/30 bg-primary/[0.04]" : "border-border bg-white",
      )}
    >
      <div
        onClick={() => onSelectOccurrence?.(occurrence)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium",
              KIND_BADGE_STYLES[occurrence.kind],
            )}>
              {KIND_LABELS[occurrence.kind]}
            </span>
            {isReplaceable ? (
              <span className="truncate font-mono text-xs font-medium text-foreground">{occurrence.path}</span>
            ) : (
              <span className="truncate font-mono text-[10px] font-medium text-muted-foreground">
                {occurrence.kind === "for" && occurrence.loopAlias
                  ? `${occurrence.loopAlias} in ${occurrence.loopSource ?? "..."}`
                  : occurrence.embeddedVarPaths?.length
                    ? occurrence.embeddedVarPaths.join(", ")
                    : occurrence.kind}
              </span>
            )}
          </div>
          <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{occurrence.matchText}</p>
        </div>

        {isReplaceable ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelectOccurrence?.(occurrence);
              setOpen((value) => !value);
            }}
            title="Değiştir"
            className={cn(
              "flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-medium transition-colors",
              open
                ? "border-primary/20 bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-primary",
            )}
          >
            Değiştir
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>
        ) : null}
      </div>

      {open && isReplaceable ? (
        <div className="border-t border-border p-2">
          <HtmlVarPicker
            options={options}
            onSelect={(newPath) => onReplace(occurrence.id, newPath)}
            onClose={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}

export function HtmlVarSettings({
  block,
  sourceData,
  activeOccurrenceId,
  onSelectOccurrence,
  onReplace,
}: HtmlVarSettingsProps) {
  const html = String(block.props["html"] ?? "");
  const occurrences = useMemo(() => extractHtmlVarOccurrences(html), [html]);

  if (occurrences.length === 0) {
    return <p className="text-xs text-muted-foreground">Bu blokta düzenlenebilir görünür değişken yok.</p>;
  }

  return (
    <div className="grid gap-2">
      <p className="text-[10px] text-muted-foreground">
        Tuvaldeki değişkeni tıkla veya aşağıdan seçip yalnızca o tokenı değiştir.
      </p>
      {occurrences.map((occurrence) => (
        <VarRow
          key={occurrence.id}
          occurrence={occurrence}
          sourceData={sourceData}
          active={activeOccurrenceId === occurrence.id}
          onSelectOccurrence={onSelectOccurrence}
          onReplace={onReplace}
        />
      ))}
    </div>
  );
}
