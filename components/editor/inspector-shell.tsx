"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type InspectorTabId = "content" | "style" | "advanced";

type InspectorTab = {
  id: InspectorTabId;
  label: string;
};

type InspectorShellProps = {
  icon: ReactNode;
  title: string;
  selectionPath: string;
  modeLabel: string;
  modeTone?: "selected" | "editing" | "styling";
  meta?: ReactNode;
  helper?: ReactNode;
  actions?: ReactNode;
  activeTab?: InspectorTabId;
  tabs?: InspectorTab[];
  onTabChange?: (tab: InspectorTabId) => void;
  children: ReactNode;
};

export function InspectorFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </span>
  );
}

export function InspectorSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.25)]">
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function InspectorEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-[220px] text-center">
        <div className="mx-auto mb-3 inline-flex rounded-xl bg-gray-100 p-3 text-gray-400">
          {icon}
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function InspectorTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-3 py-2 text-xs font-semibold transition",
        active
          ? "bg-white text-foreground shadow-[0_10px_20px_-18px_rgba(15,23,42,0.45)]"
          : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function getModeBadgeClass(modeTone: NonNullable<InspectorShellProps["modeTone"]>) {
  if (modeTone === "editing") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }
  if (modeTone === "styling") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

export function InspectorShell({
  icon,
  title,
  selectionPath,
  modeLabel,
  modeTone = "selected",
  meta,
  helper,
  actions,
  activeTab,
  tabs,
  onTabChange,
  children,
}: InspectorShellProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="shrink-0 border-b border-border bg-white/95 px-4 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
                {selectionPath}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                    getModeBadgeClass(modeTone),
                  )}
                >
                  {modeLabel}
                </span>
                {meta}
              </div>
              {helper ? (
                <div className="mt-2 text-[11px] leading-5 text-muted-foreground">{helper}</div>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
        </div>
      </div>

      {tabs && activeTab && onTabChange ? (
        <div className="shrink-0 border-b border-border bg-white px-4 py-3">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1">
            {tabs.map((tab) => (
              <InspectorTabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </InspectorTabButton>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">{children}</div>
    </div>
  );
}
