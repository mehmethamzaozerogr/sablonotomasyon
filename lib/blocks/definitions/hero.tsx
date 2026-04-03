import { LayoutTemplate } from "lucide-react";

import { defineBlock } from "@/lib/blocks/define-block";
import { resolveBlockPropValue } from "@/lib/bindings/runtime";
import { cn } from "@/lib/utils";

function asText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const heroBlockDefinition = defineBlock({
  type: "hero",
  label: "Ust Baslik",
  description: "Sablonun ana mesajini tasiyan ust alan.",
  icon: LayoutTemplate,
  categories: ["shared"],
  defaultProps: {
    headline: "Bilgilendirme",
    body: "Sablon icerigi bu alanda ozetlenir.",
    align: "left",
    tone: "warm",
  },
  fields: [
    {
      key: "headline",
      label: "Baslik",
      type: "text",
      bindingTarget: "title",
      placeholder: "Baslik",
    },
    {
      key: "body",
      label: "Icerik",
      type: "textarea",
      bindingTarget: "text",
      placeholder: "Icerik",
    },
    {
      key: "align",
      label: "Hizalama",
      type: "select",
      options: [
        { label: "Sol", value: "left" },
        { label: "Orta", value: "center" },
      ],
    },
    {
      key: "tone",
      label: "Gorunum tonu",
      type: "select",
      options: [
        { label: "Sicak", value: "warm" },
        { label: "Soguk", value: "cool" },
      ],
    },
  ],
  render: ({ block, sourceData }) => {
    const headline = asText(
      resolveBlockPropValue(block, "headline", sourceData),
    );
    const body = asText(resolveBlockPropValue(block, "body", sourceData));
    const align =
      asText(resolveBlockPropValue(block, "align", sourceData)) || "left";
    const tone =
      asText(resolveBlockPropValue(block, "tone", sourceData)) || "warm";

    const shell =
      "rounded-2xl border border-slate-200/80 bg-white px-6 py-5 text-slate-950 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.06)]";

    return (
      <div
        className={cn(
          shell,
          align === "center" && "text-center",
          tone === "cool"
            ? "bg-slate-950 text-white"
            : "bg-gradient-to-br from-amber-50 via-white to-cyan-50",
        )}
      >
        <p
          className={cn(
            "text-2xl font-semibold tracking-tight",
            tone === "cool" ? "text-white" : "text-slate-950",
          )}
        >
          {headline}
        </p>
        <p
          className={cn(
            "mt-3 text-sm leading-7",
            tone === "cool" ? "text-slate-300" : "text-slate-600",
          )}
        >
          {body}
        </p>
      </div>
    );
  },
  compile: ({ block, sourceData }) => {
    const headline = asText(
      resolveBlockPropValue(block, "headline", sourceData),
    );
    const body = asText(resolveBlockPropValue(block, "body", sourceData));
    const tone =
      asText(resolveBlockPropValue(block, "tone", sourceData)) || "warm";
    const align =
      asText(resolveBlockPropValue(block, "align", sourceData)) || "left";
    const textAlign = align === "center" ? "center" : "left";

    if (tone === "cool") {
      return `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;text-align:${textAlign};">${escapeHtml(headline)}</h1>
  <p style="margin:0;font-size:14px;line-height:1.8;color:#94a3b8;text-align:${textAlign};">${escapeHtml(body)}</p>
</div>`;
    }

    return `<div style="background:#fffdf7;border:1px solid #fde68a;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
  <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#0f172a;text-align:${textAlign};">${escapeHtml(headline)}</h1>
  <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;text-align:${textAlign};">${escapeHtml(body)}</p>
</div>`;
  },
  validate: ({ block }) => {
    const issues = [];
    const headline = String(block.props.headline ?? "").trim();
    const body = String(block.props.body ?? "").trim();

    if (!headline) {
      issues.push({
        level: "warning" as const,
        code: "hero.headline.empty",
        message: "Hero blok basligi bos.",
      });
    }

    if (!body) {
      issues.push({
        level: "info" as const,
        code: "hero.body.empty",
        message: "Hero blok govde metni bos.",
      });
    }

    return issues;
  },
  nesting: {
    acceptsChildren: false,
  },
});
