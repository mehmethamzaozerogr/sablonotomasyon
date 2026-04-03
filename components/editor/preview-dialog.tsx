"use client";

import { MonitorSmartphone, Printer, Smartphone, Tablet } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PreviewIframe } from "@/components/editor/preview-iframe";
import { previewModeOptions } from "@/lib/constants";
import type { PreviewMode, TemplateRecord } from "@/types/template";
import { cn } from "@/lib/utils";

type PreviewDialogProps = {
  open: boolean;
  onClose: () => void;
  html: string;
  template: TemplateRecord;
  previewMode: PreviewMode;
  refreshKey: number;
};

const MODE_ICONS: Record<PreviewMode, React.ElementType> = {
  desktop: MonitorSmartphone,
  tablet: Tablet,
  mobile: Smartphone,
  print: Printer,
};

const MODE_WIDTHS: Record<PreviewMode, string> = {
  desktop: "max-w-[860px]",
  tablet: "max-w-[700px]",
  mobile: "max-w-[420px]",
  print: "max-w-[760px]",
};

export function PreviewDialog({
  open,
  onClose,
  html,
  template,
  previewMode,
  refreshKey,
}: PreviewDialogProps) {
  const ModeIcon = MODE_ICONS[previewMode];
  const modeLabel =
    previewModeOptions.find((o) => o.value === previewMode)?.label ??
    previewMode;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
          "w-[min(95vw,1100px)] max-w-none",
        )}
      >
        {/* Dialog header */}
        <DialogHeader className="flex-row items-center justify-between border-b border-white/8 px-6 py-4">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-sm font-semibold text-white">
              {template.name}
            </DialogTitle>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
              <ModeIcon className="h-3 w-3" />
              {modeLabel}
            </div>
          </div>
          <p className="text-xs text-slate-500">{template.subject}</p>
        </DialogHeader>

        {/* Scrollable preview area */}
        <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,rgba(209,168,109,0.06),transparent_40%),linear-gradient(180deg,rgba(9,12,18,1)_0%,rgba(7,9,15,1)_100%)] p-6">
          <div
            className={cn(
              "mx-auto rounded-[36px] border border-white/8 bg-[#111724] p-3 shadow-panel",
              MODE_WIDTHS[previewMode],
            )}
          >
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white">
              {/* Simulated email client chrome */}
              <div className="flex items-center justify-between bg-slate-950 px-5 py-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span>{template.subject}</span>
                <span>{template.source.sheetName}</span>
              </div>
              {/* Render at 100% zoom inside dialog — user scrolls the dialog */}
              <PreviewIframe
                html={html}
                zoom={100}
                refreshKey={refreshKey}
                mode={previewMode}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
