import { ImageIcon } from "lucide-react";

import { defineBlock } from "@/lib/blocks/define-block";
import { resolveBlockPropValue } from "@/lib/bindings/runtime";

function asText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
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

export const imageBlockDefinition = defineBlock({
  type: "image",
  label: "Gorsel",
  description: "Urun veya bilgilendirme gorseli.",
  icon: ImageIcon,
  categories: ["shared"],
  defaultProps: {
    src: "",
    alt: "Gorsel",
    width: 600,
  },
  fields: [
    {
      key: "src",
      label: "Gorsel baglantisi",
      type: "text",
      bindingTarget: "image",
    },
    {
      key: "alt",
      label: "Alternatif metin",
      type: "text",
      bindingTarget: "label",
    },
    {
      key: "width",
      label: "Maksimum genislik",
      type: "number",
      min: 120,
      max: 1200,
    },
  ],
  render: ({ block, sourceData }) => {
    const src = asText(resolveBlockPropValue(block, "src", sourceData));
    const alt =
      asText(resolveBlockPropValue(block, "alt", sourceData)) || "Gorsel";
    const width = asNumber(
      resolveBlockPropValue(block, "width", sourceData),
      600,
    );

    return (
      <div className={SHELL_CLASS}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            style={{ maxWidth: width }}
            className="w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-2xl bg-slate-100">
            <div className="text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs text-slate-400">
                Gorsel baglantisi secilmedi
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
  compile: ({ block, sourceData }) => {
    const src = asText(resolveBlockPropValue(block, "src", sourceData));
    const alt =
      asText(resolveBlockPropValue(block, "alt", sourceData)) || "Gorsel";
    const width = asNumber(
      resolveBlockPropValue(block, "width", sourceData),
      600,
    );

    if (!src) {
      return `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
  <div style="height:80px;background:#f1f5f9;border-radius:12px;display:flex;align-items:center;justify-content:center;">
    <span style="color:#94a3b8;font-size:13px;">Gorsel baglantisi eklenmedi</span>
  </div>
</div>`;
    }

    return `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px 24px;margin-bottom:16px;">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${width}" style="max-width:${width}px;width:100%;border-radius:12px;display:block;" />
</div>`;
  },
  validate: ({ block }) => {
    const issues = [];
    const src = String(block.props.src ?? "").trim();
    const alt = String(block.props.alt ?? "").trim();
    const hasSrcBinding = Boolean(block.bindings?.src?.segments?.length);
    const hasAltBinding = Boolean(block.bindings?.alt?.segments?.length);

    if (!src && !hasSrcBinding) {
      issues.push({
        level: "info" as const,
        code: "image.src.empty",
        message: "Gorsel blogunda kaynak baglantisi tanimli degil.",
      });
    }

    if (!alt && !hasAltBinding) {
      issues.push({
        level: "warning" as const,
        code: "image.alt.empty",
        message: "Alt metin eksik. Gorsel engellendiginde icerik kaybolabilir.",
      });
    }

    return issues;
  },
  nesting: {
    acceptsChildren: false,
  },
});
