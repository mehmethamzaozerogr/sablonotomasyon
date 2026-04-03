"use client";

import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minus,
  MonitorSmartphone,
  Plus,
  Printer,
  RefreshCw,
  Smartphone,
  Tablet,
  X,
} from "lucide-react";

import { PreviewDialog } from "@/components/editor/preview-dialog";
import { PreviewIframe } from "@/components/editor/preview-iframe";
import { PreviewWarnings } from "@/components/editor/preview-warnings";
import { compilePreviewHtml } from "@/lib/preview/compile-preview";
import { previewModeOptions } from "@/lib/constants";
import type { PreviewMode, TemplateRecord } from "@/types/template";
import { cn } from "@/lib/utils";

type ModeConfig = {
  icon: React.ElementType;
  outerMaxWidth: string;
  shellClass: string;
  chromeClass: string;
  /** Wraps the iframe + subject bar. Defaults to desktop/tablet frame look. */
  innerClass: string;
};

const MODE_CONFIG: Record<PreviewMode, ModeConfig> = {
  desktop: {
    icon: MonitorSmartphone,
    // EMAIL_MAX_WIDTH=720px + 2*p-3 (24px) + border ≈ 760px outer
    outerMaxWidth: "max-w-[780px]",
    shellClass:
      "rounded-2xl border border-slate-200 bg-[#e2e8f0] p-3 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)]",
    chromeClass: "bg-[#e2e8f0]",
    innerClass:
      "overflow-hidden rounded-xl border border-slate-300/70 bg-white",
  },
  tablet: {
    icon: Tablet,
    // EMAIL_MAX_WIDTH=640px + 2*p-3 ≈ 668px outer
    outerMaxWidth: "max-w-[700px]",
    shellClass:
      "rounded-2xl border border-slate-200 bg-[#dbe3ef] p-3 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.1)]",
    chromeClass: "bg-[#dbe3ef]",
    innerClass:
      "overflow-hidden rounded-xl border border-slate-300/70 bg-white",
  },
  mobile: {
    icon: Smartphone,
    // EMAIL_MAX_WIDTH=390px + phone frame bezels ≈ 420px outer
    outerMaxWidth: "max-w-[420px]",
    shellClass:
      "rounded-[32px] border-[6px] border-slate-700 bg-slate-900 p-1.5 shadow-[0_34px_70px_-30px_rgba(15,23,42,0.8),0_0_0_1px_rgba(255,255,255,0.06)]",
    chromeClass: "bg-[#cfd8e6]",
    // Screen area — no border, tightly rounded to match phone inner radius
    innerClass: "overflow-hidden rounded-[22px] bg-white",
  },
  print: {
    icon: Printer,
    // A4 ≈ 210mm ≈ 794px + some chrome
    outerMaxWidth: "max-w-[860px]",
    shellClass:
      "rounded-xl border border-slate-300 bg-slate-200 p-5 shadow-inner",
    chromeClass: "bg-slate-200",
    innerClass:
      "overflow-hidden rounded-xl border border-slate-300/70 bg-white",
  },
};

const ZOOM_MIN = 50;
const ZOOM_MAX = 150;
const ZOOM_STEP = 25;
const COMPILE_DEBOUNCE = 280;

type LivePreviewProps = {
  template: TemplateRecord;
  previewMode: PreviewMode;
  sourceData: unknown;
  onClose?: () => void;
};

export function LivePreview({
  template,
  previewMode,
  sourceData,
  onClose,
}: LivePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [compiledHtml, setCompiledHtml] = useState(() =>
    compilePreviewHtml(template, sourceData, { mode: previewMode }),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevModeRef = useRef<string>(previewMode);

  useEffect(() => {
    const modeChanged = prevModeRef.current !== previewMode;
    prevModeRef.current = previewMode;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (modeChanged) {
      // Mode switches are cheap (cache-backed) — compile synchronously so the
      // iframe remounts immediately with the correct content.
      setCompiledHtml(
        compilePreviewHtml(template, sourceData, {
          mode: previewMode,
          refreshToken: refreshKey,
        }),
      );
      return;
    }

    debounceRef.current = setTimeout(() => {
      setCompiledHtml(
        compilePreviewHtml(template, sourceData, {
          mode: previewMode,
          refreshToken: refreshKey,
        }),
      );
    }, COMPILE_DEBOUNCE);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [template, sourceData, previewMode, refreshKey]);

  const modeConfig = MODE_CONFIG[previewMode];
  const ModeIcon = modeConfig.icon;
  const modeLabel =
    previewModeOptions.find((o) => o.value === previewMode)?.label ??
    previewMode;

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden bg-card">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">
              Önizleme
            </span>
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {template.blocks.length} blok
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border px-1.5 py-0.5">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN))
                }
                disabled={zoom <= ZOOM_MIN}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[32px] text-center text-[10px] font-medium tabular-nums text-foreground">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX))
                }
                disabled={zoom >= ZOOM_MAX}
                className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              title="Yenile"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-gray-100 hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              title="Ayrı pencere"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-gray-100 hover:text-foreground"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="Kapat"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-muted-foreground">
              <ModeIcon className="h-3 w-3" />
              {modeLabel}
            </div>
          </div>
        </div>

        {/* Preview body */}
        <div
          className={cn(
            "flex-1 overflow-auto p-4 scrollbar-thin",
            modeConfig.chromeClass,
          )}
        >
          <div className={cn("mx-auto", modeConfig.outerMaxWidth)}>
            <div className={modeConfig.shellClass}>
              <div className={modeConfig.innerClass}>
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2 text-[10px] text-muted-foreground">
                  <span className="truncate">{template.subject}</span>
                  <span className="ml-4 shrink-0">
                    {template.source.sheetName}
                  </span>
                </div>
                <PreviewIframe
                  html={compiledHtml}
                  zoom={zoom}
                  refreshKey={refreshKey}
                  mode={previewMode}
                />
              </div>
            </div>
          </div>
        </div>

        <PreviewWarnings template={template} sourceData={sourceData} />
      </div>

      <PreviewDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        html={compiledHtml}
        template={template}
        previewMode={previewMode}
        refreshKey={refreshKey}
      />
    </>
  );
}
