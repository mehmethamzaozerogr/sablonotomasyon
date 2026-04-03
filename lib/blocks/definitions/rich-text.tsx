import { Type } from "lucide-react";

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

const SHELL_CLASS =
  "rounded-2xl border border-slate-200/80 bg-white px-6 py-5 text-slate-950 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.06)]";

export const richTextBlockDefinition = defineBlock({
  type: "richText",
  label: "Metin Alani",
  description: "Uzun metin, aciklama ve yardim icerigi icin kullanilir.",
  icon: Type,
  categories: ["shared"],
  defaultProps: {
    headline: "Aciklama",
    body: "Detayli metin alani",
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
  ],
  render: ({ block, sourceData }) => {
    const headline = asText(
      resolveBlockPropValue(block, "headline", sourceData),
    );
    const body = asText(resolveBlockPropValue(block, "body", sourceData));

    return (
      <div className={SHELL_CLASS}>
        {headline ? (
          <p className="text-lg font-semibold text-slate-950">{headline}</p>
        ) : null}
        <p
          className={cn(
            "text-sm leading-7 text-slate-600",
            headline ? "mt-2" : "mt-0",
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

    return `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
  ${headline ? `<h2 style="margin:0 0 10px;font-size:18px;font-weight:600;color:#0f172a;">${escapeHtml(headline)}</h2>` : ""}
  <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">${escapeHtml(body)}</p>
</div>`;
  },
  validate: ({ block }) => {
    const issues = [];
    const body = String(block.props.body ?? "").trim();

    if (!body) {
      issues.push({
        level: "warning" as const,
        code: "richText.body.empty",
        message: "Metin blogu icerigi bos.",
      });
    }

    return issues;
  },
  nesting: {
    acceptsChildren: false,
  },
});
