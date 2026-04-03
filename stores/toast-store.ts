import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastStore = {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismissToast: (id: string) => void;
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, variant = "info", duration = 3200) => {
    const id = createId();
    set((state) => ({
      // Cap at 5 visible toasts
      toasts: [...state.toasts.slice(-4), { id, message, variant }],
    }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Imperative helper — usable outside React components
export function toast(
  message: string,
  variant: ToastVariant = "info",
  duration?: number,
): void {
  useToastStore.getState().addToast(message, variant, duration);
}
