import type { PreviewMode, TemplateCategory, TemplateStatus } from "@/types/template";

export const appNavigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Template library",
  },
  {
    href: "/import",
    label: "Import",
    description: "XLSX source data",
  },
  {
    href: "/export",
    label: "Export",
    description: "HTML and row outputs",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Local workspace preferences",
  },
] as const;

export const categoryMeta: Record<
  TemplateCategory,
  {
    label: string;
    hint: string;
    accent: string;
    surface: string;
  }
> = {
  order: {
    label: "Order",
    hint: "Templates for order, payment, and delivery journeys.",
    accent: "text-violet-700",
    surface: "bg-violet-50 border-violet-200",
  },
  invoice: {
    label: "Invoice",
    hint: "Templates for invoices, line items, and financial summaries.",
    accent: "text-blue-700",
    surface: "bg-blue-50 border-blue-200",
  },
  return: {
    label: "Return",
    hint: "Templates for return workflows, statuses, and returned products.",
    accent: "text-rose-700",
    surface: "bg-rose-50 border-rose-200",
  },
  shipping: {
    label: "Shipping",
    hint: "Templates for shipment, tracking, and package movement details.",
    accent: "text-emerald-700",
    surface: "bg-emerald-50 border-emerald-200",
  },
};

export const templateStatuses: Record<
  TemplateStatus,
  {
    label: string;
    tone: string;
  }
> = {
  draft: {
    label: "Draft",
    tone: "border-gray-200 bg-gray-100 text-gray-600",
  },
  review: {
    label: "In Review",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  active: {
    label: "Active",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

export const previewModeOptions: Array<{
  value: PreviewMode;
  label: string;
}> = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
  { value: "print", label: "Print" },
];
