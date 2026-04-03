"use client";

import { Link2, Type, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BindingSegment } from "@/types/binding";

type BindingChipProps = {
  segment: BindingSegment;
  onRemove?: () => void;
};

export function BindingChip({ segment, onRemove }: BindingChipProps) {
  const isStatic = segment.kind === "static";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        isStatic
          ? "border-gray-200 bg-gray-100 text-gray-700"
          : "border-primary/20 bg-primary/8 text-primary",
      )}
    >
      {isStatic ? <Type className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
      <span className="max-w-[140px] truncate">
        {isStatic ? (segment.value || "Sabit metin") : segment.label}
      </span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Kaldır"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      ) : null}
    </div>
  );
}
