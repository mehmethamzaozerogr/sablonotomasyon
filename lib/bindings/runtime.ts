import { getValueAtPath } from "@/lib/bindings/introspection";
import type {
  BlockFieldBinding,
  BindingFormat,
  BindingSegment,
  BindingSourceScope,
  RepeaterBinding,
  TextTransform,
} from "@/types/binding";
import type { EditorBlock } from "@/types/template";

type BindingContext = {
  source: unknown;
  item?: unknown;
};

function resolveScopeValue(scope: BindingSourceScope, path: string, context: BindingContext) {
  if (scope === "item") {
    return getValueAtPath(context.item, path);
  }

  return getValueAtPath(context.source, path);
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (part) => part[0].toUpperCase() + part.slice(1).toLowerCase());
}

function transformText(value: string, transform: TextTransform) {
  if (transform === "uppercase") {
    return value.toUpperCase();
  }

  if (transform === "lowercase") {
    return value.toLowerCase();
  }

  if (transform === "title") {
    return toTitleCase(value);
  }

  return value;
}

function isMoneyObject(value: unknown): value is { Amount: number; Currency?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "Amount" in value &&
    typeof (value as { Amount?: unknown }).Amount === "number"
  );
}

function isAddressObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    ("Line1" in value || "City" in value || "PostalCode" in value)
  );
}

function stringifyRawValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (isMoneyObject(value)) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: value.Currency ?? "TRY",
    }).format(value.Amount);
  }

  if (isAddressObject(value)) {
    return [
      value.Name,
      value.Line1,
      value.Line2,
      [value.City, value.State].filter(Boolean).join(", "),
      [value.PostalCode, value.Country].filter(Boolean).join(" "),
    ]
      .filter((part) => typeof part === "string" && part)
      .join("\n");
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  return JSON.stringify(value);
}

function formatValue(value: unknown, format: BindingFormat, context: BindingContext) {
  if (format.type === "currency") {
    if (isMoneyObject(value)) {
      return new Intl.NumberFormat(format.locale, {
        style: "currency",
        currency: format.currency ?? value.Currency ?? "TRY",
      }).format(value.Amount);
    }

    if (typeof value === "number") {
      const scopedCurrency = format.currencyPath
        ? resolveScopeValue("root", format.currencyPath, context)
        : undefined;

      return new Intl.NumberFormat(format.locale, {
        style: "currency",
        currency:
          format.currency ??
          (typeof scopedCurrency === "string" ? scopedCurrency : undefined) ??
          "TRY",
      }).format(value);
    }
  }

  const raw = stringifyRawValue(value);

  if (format.type === "text") {
    return transformText(raw, format.transform);
  }

  return raw;
}

function renderSegment(segment: BindingSegment, binding: BlockFieldBinding, context: BindingContext) {
  if (segment.kind === "static") {
    return segment.value;
  }

  const value = resolveScopeValue(segment.scope, segment.path, context);
  return formatValue(value, binding.format, context);
}

export function resolveBindingValue(binding: BlockFieldBinding | undefined, context: BindingContext) {
  if (!binding || binding.segments.length === 0) {
    return "";
  }

  const value = binding.segments
    .map((segment) => renderSegment(segment, binding, context))
    .join("")
    .trim();

  return value || binding.fallback || "";
}

export function resolveBlockPropValue(
  block: EditorBlock,
  key: string,
  source: unknown,
  item?: unknown,
) {
  const binding = block.bindings?.[key];

  if (binding) {
    return resolveBindingValue(binding, { source, item });
  }

  return block.props[key];
}

export function resolveRepeaterItems(
  block: EditorBlock,
  source: unknown,
): unknown[] {
  const repeater = block.repeater;

  if (!repeater?.sourcePath) {
    return [];
  }

  const value = getValueAtPath(source, repeater.sourcePath);

  if (!Array.isArray(value)) {
    return [];
  }

  if (typeof repeater.limit === "number" && repeater.limit > 0) {
    return value.slice(0, repeater.limit);
  }

  return value;
}

export function hasActiveBinding(block: EditorBlock, key: string) {
  return Boolean(block.bindings?.[key]?.segments.length);
}

export function createDefaultBinding(target: BlockFieldBinding["target"]): BlockFieldBinding {
  return {
    target,
    segments: [],
    fallback: "",
    format: {
      type: "none",
    },
  };
}

export function createDefaultRepeaterBinding(option?: {
  sourcePath: string;
  label: string;
}): RepeaterBinding {
  return {
    sourcePath: option?.sourcePath ?? "",
    label: option?.label ?? "",
    itemAlias: "item",
    emptyFallback: "Gosterilecek kayit bulunamadi.",
  };
}
