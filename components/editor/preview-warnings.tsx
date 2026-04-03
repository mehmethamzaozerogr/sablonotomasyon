"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  XCircle,
} from "lucide-react";

import { runTemplateValidation } from "@/lib/validation/template-validation";
import { cn } from "@/lib/utils";
import type { TemplateRecord } from "@/types/template";

// ---------------------------------------------------------------------------
// Warning analysis
// ---------------------------------------------------------------------------

type WarningSeverity = "error" | "warning" | "info";

type CompatibilityWarning = {
  id: string;
  severity: WarningSeverity;
  title: string;
  detail: string;
};

export function analyzeTemplate(
  template: TemplateRecord,
  sourceData: unknown,
): CompatibilityWarning[] {
  return runTemplateValidation(template, sourceData, "live").issues.map(
    (issue) => ({
      id: issue.id,
      severity: issue.level,
      title: issue.title,
      detail: issue.message,
    }),
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  WarningSeverity,
  {
    icon: React.ElementType;
    bg: string;
    border: string;
    iconColor: string;
    label: string;
  }
> = {
  error: {
    icon: XCircle,
    bg: "bg-rose-500/8",
    border: "border-rose-500/20",
    iconColor: "text-rose-300",
    label: "Hata",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
    iconColor: "text-amber-300",
    label: "Uyari",
  },
  info: {
    icon: Info,
    bg: "bg-slate-500/8",
    border: "border-white/8",
    iconColor: "text-slate-400",
    label: "Bilgi",
  },
};

type PreviewWarningsProps = {
  template: TemplateRecord;
  sourceData: unknown;
};

export function PreviewWarnings({
  template,
  sourceData,
}: PreviewWarningsProps) {
  const [open, setOpen] = useState(false);
  const warnings = analyzeTemplate(template, sourceData);

  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-3 border-t border-white/8 px-5 py-3">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <p className="text-xs text-slate-500">
          Uyumluluk sorunu tespit edilmedi.
        </p>
      </div>
    );
  }

  const errorCount = warnings.filter((w) => w.severity === "error").length;
  const warnCount = warnings.filter((w) => w.severity === "warning").length;

  const summaryColor =
    errorCount > 0
      ? "text-rose-300"
      : warnCount > 0
        ? "text-amber-300"
        : "text-slate-400";

  return (
    <div className="border-t border-white/8">
      {/* Toggle header */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-white/[0.02]"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className={cn("h-3.5 w-3.5", summaryColor)} />
          <span className={cn("text-xs font-medium", summaryColor)}>
            {warnings.length} uyumluluk bildirimi
          </span>
          <div className="flex items-center gap-1.5">
            {errorCount > 0 && (
              <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">
                {errorCount} hata
              </span>
            )}
            {warnCount > 0 && (
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                {warnCount} uyari
              </span>
            )}
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        )}
      </button>

      {/* Warning list */}
      {open && (
        <div className="grid gap-2 px-5 pb-4">
          {warnings.map((w) => {
            const config = SEVERITY_CONFIG[w.severity];
            const Icon = config.icon;
            return (
              <div
                key={w.id}
                className={cn(
                  "flex gap-3 rounded-[18px] border p-3.5",
                  config.bg,
                  config.border,
                )}
              >
                <Icon
                  className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconColor)}
                />
                <div>
                  <p className="text-xs font-semibold text-white">{w.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {w.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
