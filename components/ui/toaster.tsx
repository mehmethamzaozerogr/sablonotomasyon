"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";

import { type Toast, type ToastVariant, useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Per-toast visual config
// ---------------------------------------------------------------------------

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ElementType; containerClass: string; iconClass: string; barClass: string }
> = {
  success: {
    icon: CheckCircle2,
    containerClass:
      "border-emerald-200 bg-emerald-50 text-gray-800",
    iconClass: "text-emerald-500",
    barClass: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    containerClass: "border-red-200 bg-red-50 text-gray-800",
    iconClass: "text-red-500",
    barClass: "bg-red-500",
  },
  warning: {
    icon: TriangleAlert,
    containerClass:
      "border-amber-200 bg-amber-50 text-gray-800",
    iconClass: "text-amber-500",
    barClass: "bg-amber-500",
  },
  info: {
    icon: Info,
    containerClass:
      "border-sky-200 bg-sky-50 text-gray-800",
    iconClass: "text-sky-500",
    barClass: "bg-sky-500",
  },
};

// ---------------------------------------------------------------------------
// Single toast item with enter animation
// ---------------------------------------------------------------------------

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const config = VARIANT_CONFIG[toast.variant];
  const Icon = config.icon;

  useEffect(() => {
    // Double rAF ensures the initial `translate-y-3 opacity-0` is painted before transition
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true)),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "relative flex w-[340px] max-w-[calc(100vw-32px)] items-start gap-3 overflow-hidden",
        "rounded-[18px] border px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl",
        "transition-all duration-300 ease-out",
        config.containerClass,
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      {/* Left progress bar */}
      <div className={cn("absolute inset-y-0 left-0 w-0.5 rounded-l-[18px]", config.barClass)} />

      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconClass)} />

      <p className="flex-1 text-sm leading-6">{toast.message}</p>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-0.5 text-current opacity-40 transition hover:opacity-80"
        aria-label="Bildirimi kapat"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function Toaster() {
  const { toasts, dismissToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
