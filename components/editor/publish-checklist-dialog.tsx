"use client";

import { AlertTriangle, CheckCircle2, Info, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  TemplateValidationIssue,
  TemplateValidationResult,
} from "@/lib/validation/template-validation";
import { cn } from "@/lib/utils";

type PublishChecklistDialogProps = {
  open: boolean;
  result: TemplateValidationResult | null;
  publishing: boolean;
  onOpenChange: (open: boolean) => void;
  onRecheck: () => void;
  onConfirmPublish: () => void;
  onFocusBlock?: (blockId: string) => void;
};

function getLevelMeta(level: TemplateValidationIssue["level"]) {
  if (level === "error") {
    return {
      icon: AlertTriangle,
      label: "Hata",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  if (level === "warning") {
    return {
      icon: AlertTriangle,
      label: "Uyari",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  return {
    icon: Info,
    label: "Bilgi",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
  };
}

function IssueRow({
  issue,
  onFocusBlock,
}: {
  issue: TemplateValidationIssue;
  onFocusBlock?: (blockId: string) => void;
}) {
  const levelMeta = getLevelMeta(issue.level);
  const LevelIcon = levelMeta.icon;

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            levelMeta.badgeClass,
          )}
        >
          <LevelIcon className="h-3.5 w-3.5" />
          {levelMeta.label}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-800">
            {issue.title}
          </p>
          <p className="mt-1 text-xs text-slate-600">{issue.message}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">
              {issue.scope}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {issue.code}
            </span>
            {issue.blockLabel ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {issue.blockLabel}
              </span>
            ) : null}
          </div>
        </div>

        {issue.blockId && onFocusBlock ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onFocusBlock(issue.blockId!)}
          >
            Bloğa Git
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function PublishChecklistDialog({
  open,
  result,
  publishing,
  onOpenChange,
  onRecheck,
  onConfirmPublish,
  onFocusBlock,
}: PublishChecklistDialogProps) {
  const canPublish = result ? !result.hasBlockingErrors : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,960px)] bg-[#f5f7fb] text-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Publish Checklist
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Yayin oncesi blok ve dokuman kurallari dogrulandi.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <>
            <section className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-rose-700">
                  Hata
                </p>
                <p className="mt-1 text-2xl font-semibold text-rose-800">
                  {result.counts.error}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                  Uyari
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-800">
                  {result.counts.warning}
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-700">
                  Bilgi
                </p>
                <p className="mt-1 text-2xl font-semibold text-sky-800">
                  {result.counts.info}
                </p>
              </div>
            </section>

            <section className="max-h-[44vh] space-y-2 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/70 p-3">
              {result.issues.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Checklist temiz. Yayinlamaya hazir.
                </div>
              ) : (
                result.issues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    onFocusBlock={onFocusBlock}
                  />
                ))
              )}
            </section>

            {result.hasBlockingErrors ? (
              <p className="text-xs font-medium text-rose-600">
                Hata seviyesindeki maddeler duzeltilmeden yayinlama devam etmez.
              </p>
            ) : result.counts.warning > 0 ? (
              <p className="text-xs font-medium text-amber-700">
                Uyarilar yayinlamayi engellemez; yine de yayin kalitesi icin
                gozden gecirmeniz onerilir.
              </p>
            ) : null}
          </>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
            Checklist sonucu bekleniyor.
          </section>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Kapat
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onRecheck}
            disabled={publishing}
          >
            Yeniden Kontrol Et
          </Button>
          <Button
            type="button"
            onClick={onConfirmPublish}
            disabled={!canPublish || publishing}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {publishing ? "Yayinlaniyor..." : "Yayinla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
