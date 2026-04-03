import type { BindingPathKind, BindingPathOption, BindingSourceScope } from "@/types/binding";
import { variableLabels } from "@/lib/bindings/variable-labels";

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

function detectKind(value: unknown): BindingPathKind {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (typeof value === "object") {
    return "object";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return typeof value === "string"
      ? "string"
      : typeof value === "number"
        ? "number"
        : "boolean";
  }

  return "string";
}

function formatSample(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value.length > 52 ? `${value.slice(0, 52)}...` : value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return keys.length ? keys.join(", ") : "Object";
  }

  return undefined;
}

function formatLabel(path: string) {
  const key = path.split(".").at(-1) ?? path;
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}

export function getValueAtPath(source: unknown, path: string): unknown {
  if (!path) {
    return source;
  }

  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(segment);
      return Number.isNaN(index) ? undefined : current[index];
    }

    if (typeof current === "object") {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

function buildOption(
  scope: BindingSourceScope,
  path: string,
  kind: BindingPathKind,
  depth: number,
  value: unknown,
): BindingPathOption {
  const displayPath = scope === "item" && path ? `item.${path}` : path;
  const sample = formatSample(value);

  // Look up Turkish label/description/group from the static map.
  // For item-scope paths the key in the map is just the bare field name (e.g. "ItemName").
  const meta = variableLabels[path] ?? variableLabels[path.split(".").at(-1) ?? ""];
  const label = meta?.label ?? formatLabel(path);
  const description = meta?.description;
  const group = meta?.group;

  return {
    path,
    displayPath,
    label,
    scope,
    kind,
    depth,
    sample,
    searchText: `${displayPath} ${label} ${description ?? ""} ${sample ?? ""}`.toLowerCase(),
    description,
    group,
  };
}

function walkRootPaths(value: JsonValue, path: string, depth: number, options: BindingPathOption[]) {
  const kind = detectKind(value);

  if (path) {
    options.push(buildOption("root", path, kind, depth, value));
  }

  if (kind !== "object" || value === null || Array.isArray(value)) {
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    const childPath = path ? `${path}.${key}` : key;
    walkRootPaths(child, childPath, depth + 1, options);
  });
}

function walkItemPaths(value: JsonValue, path: string, depth: number, options: BindingPathOption[]) {
  const kind = detectKind(value);

  if (path) {
    options.push(buildOption("item", path, kind, depth, value));
  }

  if (kind === "array") {
    return;
  }

  if (kind !== "object" || value === null) {
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    const childPath = path ? `${path}.${key}` : key;
    walkItemPaths(child, childPath, depth + 1, options);
  });
}

export function getBindingPathOptions(source: unknown) {
  const options: BindingPathOption[] = [];
  walkRootPaths(source as JsonValue, "", 0, options);
  return options;
}

export function getRepeaterSourceOptions(source: unknown) {
  return getBindingPathOptions(source).filter((option) => option.kind === "array");
}

export function getRepeaterItemOptions(source: unknown, repeaterPath: string) {
  const repeaterValue = getValueAtPath(source, repeaterPath);

  if (!Array.isArray(repeaterValue) || repeaterValue.length === 0) {
    return [];
  }

  const options: BindingPathOption[] = [];
  walkItemPaths(repeaterValue[0] as JsonValue, "", 0, options);
  return options;
}

export function searchBindingOptions(options: BindingPathOption[], query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return options;
  }

  return options.filter((option) => option.searchText.includes(normalized));
}
