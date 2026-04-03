import { CreditCard } from "lucide-react";

import { defineBlock } from "@/lib/blocks/define-block";
import { resolveBlockPropValue } from "@/lib/bindings/runtime";
import { cn } from "@/lib/utils";

function asText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SHELL_CLASS =
  "rounded-2xl border border-slate-200/80 bg-white px-6 py-5 text-slate-950 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.06)]";

export const ctaBlockDefinition = defineBlock({
  type: "cta",
  label: "Takip Bilgisi",
  description: "Yonlendirme butonu veya takip baglantisi.",
  icon: CreditCard,
  categories: ["shared"],
  defaultProps: {
    label: "Detayi ac",
    href: "",
    fullWidth: true,
  },
  fields: [
    {
      key: "label",
      label: "Buton metni",
      type: "text",
      bindingTarget: "label",
      placeholder: "Buton metni",
    },
    {
      key: "href",
      label: "Yonlendirme baglantisi",
      type: "text",
      bindingTarget: "href",
      placeholder: "https://",
    },
    {
      key: "fullWidth",
      label: "Tam genislik",
      type: "toggle",
    },
  ],
  render: ({ block, sourceData }) => {
    const label = asText(resolveBlockPropValue(block, "label", sourceData));
    const href = asText(resolveBlockPropValue(block, "href", sourceData));
    const fullWidth = asBoolean(
      resolveBlockPropValue(block, "fullWidth", sourceData),
    );

    return (
      <div className={SHELL_CLASS}>
        <button
          className={cn(
            "rounded-2xl px-5 py-3 text-sm font-semibold transition",
            fullWidth ? "w-full" : "w-auto",
            "bg-slate-950 text-white shadow-lg",
          )}
          type="button"
        >
          {label || "Detayi ac"}
        </button>
        {href ? (
          <p className="mt-3 truncate text-xs text-slate-400">{href}</p>
        ) : null}
      </div>
    );
  },
  compile: ({ block, sourceData }) => {
    const label =
      asText(resolveBlockPropValue(block, "label", sourceData)) || "Detayi ac";
    const href = asText(resolveBlockPropValue(block, "href", sourceData));
    const fullWidth = asBoolean(
      resolveBlockPropValue(block, "fullWidth", sourceData),
    );
    const buttonStyle = fullWidth
      ? "display:block;width:100%;text-align:center;box-sizing:border-box;"
      : "display:inline-block;";

    return `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
  <div>
    <a href="${escapeHtml(href) || "#"}" style="${buttonStyle}background:#0f172a;color:#ffffff;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>
    ${href ? `<p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">${escapeHtml(href)}</p>` : ""}
  </div>
</div>`;
  },
  validate: ({ block }) => {
    const issues = [];
    const label = String(block.props.label ?? "").trim();
    const href = String(block.props.href ?? "").trim();
    const hasHrefBinding = Boolean(block.bindings?.href?.segments?.length);

    if (!label) {
      issues.push({
        level: "warning" as const,
        code: "cta.label.empty",
        message: "CTA blogu buton metni bos.",
      });
    }

    if (!href && !hasHrefBinding) {
      issues.push({
        level: "info" as const,
        code: "cta.href.empty",
        message: "CTA blogunda yonlendirme baglantisi tanimli degil.",
      });
    }

    return issues;
  },
  nesting: {
    acceptsChildren: false,
  },
});
