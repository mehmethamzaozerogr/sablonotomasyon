import { variableLabels } from "@/lib/bindings/variable-labels";
import { getBindingPathOptions } from "@/lib/bindings/introspection";
import type { BindingPathKind } from "@/types/binding";

const SCRIBAN_KEYWORDS = new Set([
  "if", "else", "elseif", "end", "for", "in",
  "empty", "null", "true", "false", "not", "and", "or",
]);

type LoopFrame = {
  alias: string;
  sourceExpr: string;
  resolvedSourcePath: string | null;
};

type ControlFrame =
  | { kind: "if" }
  | { kind: "for"; loop: LoopFrame };

export type HtmlVarKind = "variable" | "if" | "elseif" | "else" | "end" | "for" | "expression";

export type HtmlVarOccurrence = {
  id: string;
  index: number;
  kind: HtmlVarKind;
  path: string;
  start: number;
  end: number;
  matchText: string;
  scope: "root" | "loop";
  rootPrefix: string;
  alias?: string;
  resolvedSourcePath?: string | null;
  /** Variable paths embedded inside control-flow expressions (if/elseif/for conditions) */
  embeddedVarPaths?: string[];
  /** For `for` tokens: the loop alias */
  loopAlias?: string;
  /** For `for` tokens: the source collection expression */
  loopSource?: string;
};

export type HtmlVarReplacementOption = {
  replacePath: string;
  displayPath: string;
  label: string;
  description?: string;
  group?: string;
  sample?: string;
  kind: BindingPathKind;
  searchText: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function computeHtmlTagRanges(html: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  let index = 0;

  while (index < html.length) {
    const tagStart = html.indexOf("<", index);
    if (tagStart === -1) break;

    const commentStart = html.startsWith("<!--", tagStart);
    const tagEnd = commentStart
      ? html.indexOf("-->", tagStart + 4)
      : html.indexOf(">", tagStart + 1);

    if (tagEnd === -1) break;

    ranges.push({
      start: tagStart,
      end: commentStart ? tagEnd + 3 : tagEnd + 1,
    });

    index = commentStart ? tagEnd + 3 : tagEnd + 1;
  }

  return ranges;
}

function isInsideHtmlTag(index: number, ranges: Array<{ start: number; end: number }>) {
  for (const range of ranges) {
    if (index < range.start) return false;
    if (index >= range.start && index < range.end) return true;
  }
  return false;
}

function resolveLoopSourcePath(sourceExpr: string, loopStack: LoopFrame[]): string | null {
  const [head, ...rest] = sourceExpr.split(".");
  const loop = [...loopStack].reverse().find((entry) => entry.alias === head);

  if (!loop) {
    return sourceExpr;
  }

  if (!loop.resolvedSourcePath) {
    return null;
  }

  return rest.length ? `${loop.resolvedSourcePath}.${rest.join(".")}` : loop.resolvedSourcePath;
}

function formatSample(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.length > 52 ? `${value.slice(0, 52)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return keys.length ? keys.join(", ") : "Object";
  }
  return undefined;
}

function detectKind(value: unknown): BindingPathKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

function formatLabel(path: string) {
  const key = path.split(".").at(-1) ?? path;
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}

function getMeta(path: string, resolvedRootPath?: string | null) {
  return variableLabels[resolvedRootPath ?? ""] ??
    variableLabels[path] ??
    variableLabels[path.split(".").at(-1) ?? ""];
}

function getValueAtLoosePath(source: unknown, path: string): unknown {
  if (!path) return source;

  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      if (!current.length) return undefined;
      const index = Number(segment);
      if (!Number.isNaN(index)) {
        return current[index];
      }
      const first = current[0];
      if (first && typeof first === "object") {
        return (first as Record<string, unknown>)[segment];
      }
      return undefined;
    }

    if (typeof current === "object") {
      return (current as Record<string, unknown>)[segment];
    }

    return undefined;
  }, source);
}

function buildLoopOptions(
  value: unknown,
  alias: string,
  resolvedRootPath: string | null,
  path = "",
  options: HtmlVarReplacementOption[] = [],
): HtmlVarReplacementOption[] {
  const kind = detectKind(value);

  if (kind === "array") {
    if (Array.isArray(value) && value.length > 0) {
      buildLoopOptions(value[0], alias, resolvedRootPath, path, options);
    }
    return options;
  }

  if (kind === "object" && value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      const childPath = path ? `${path}.${key}` : key;
      buildLoopOptions(child, alias, resolvedRootPath ? `${resolvedRootPath}.${key}` : key, childPath, options);
    });
    return options;
  }

  if (!path) {
    return options;
  }

  const replacePath = `${alias}.${path}`;
  const meta = getMeta(path, resolvedRootPath);
  const sample = formatSample(value);

  options.push({
    replacePath,
    displayPath: replacePath,
    label: meta?.label ?? formatLabel(path),
    description: meta?.description,
    group: meta?.group ?? alias,
    sample,
    kind,
    searchText: `${replacePath} ${meta?.label ?? ""} ${meta?.description ?? ""} ${sample ?? ""}`.toLowerCase(),
  });

  return options;
}

/**
 * Extract dotted identifier paths from an arbitrary expression string.
 * Returns paths like "Order.PaymentState", "itm.Name", etc.
 * Single-segment identifiers that aren't scriban keywords are also included.
 */
function extractEmbeddedVarPaths(expr: string, loopStack: LoopFrame[]): string[] {
  // Remove string literals so we don't pick up identifiers inside quotes
  const cleaned = expr.replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "");
  const re = /\b([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)\b/g;
  const paths: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = re.exec(cleaned)) !== null) {
    const path = m[1];
    const root = path.split(".")[0];
    // Skip scriban keywords and standalone operators
    if (SCRIBAN_KEYWORDS.has(root.toLowerCase())) continue;
    // Skip purely numeric-looking or single-char throwaway
    if (/^\d/.test(root)) continue;
    // Accept dotted paths always; single-segment only if it's a known loop alias or has dots
    const isLoopAlias = loopStack.some((l) => l.alias === root);
    if (path.includes(".") || isLoopAlias) {
      paths.push(path);
    }
  }

  return [...new Set(paths)];
}

export function extractHtmlVarOccurrences(html: string): HtmlVarOccurrence[] {
  if (!html) return [];

  const occurrences: HtmlVarOccurrence[] = [];
  const tagRanges = computeHtmlTagRanges(html);
  const scribanRe = /\{\{[\s\S]*?\}\}/g;
  const controlStack: ControlFrame[] = [];
  const loopStack: LoopFrame[] = [];

  function pushOccurrence(
    kind: HtmlVarKind,
    matchText: string,
    matchIndex: number,
    path: string,
    extra?: Partial<Pick<HtmlVarOccurrence, "embeddedVarPaths" | "loopAlias" | "loopSource" | "alias" | "resolvedSourcePath" | "scope">>,
  ) {
    const rootPrefix = path.split(".")[0];
    const loop = kind === "variable"
      ? [...loopStack].reverse().find((entry) => entry.alias === rootPrefix)
      : undefined;

    occurrences.push({
      id: `var-${occurrences.length}-${matchIndex}`,
      index: occurrences.length,
      kind,
      path,
      start: matchIndex,
      end: matchIndex + matchText.length,
      matchText,
      scope: extra?.scope ?? (loop ? "loop" : "root"),
      rootPrefix,
      alias: extra?.alias ?? loop?.alias,
      resolvedSourcePath: extra?.resolvedSourcePath ?? loop?.resolvedSourcePath ?? null,
      ...(extra?.embeddedVarPaths?.length ? { embeddedVarPaths: extra.embeddedVarPaths } : {}),
      ...(extra?.loopAlias ? { loopAlias: extra.loopAlias } : {}),
      ...(extra?.loopSource ? { loopSource: extra.loopSource } : {}),
    });
  }

  let match: RegExpExecArray | null;
  while ((match = scribanRe.exec(html)) !== null) {
    if (isInsideHtmlTag(match.index, tagRanges)) continue;

    const matchText = match[0];
    const expr = matchText.replace(/^\{\{-?\s*/, "").replace(/\s*-?\}\}$/, "").trim();

    // ── for ───────────────────────────────────────────────────────────────
    const forMatch = /^for\s+([A-Za-z_][\w]*)\s+in\s+([A-Za-z_][\w.]*)$/i.exec(expr);
    if (forMatch) {
      const loop: LoopFrame = {
        alias: forMatch[1],
        sourceExpr: forMatch[2],
        resolvedSourcePath: resolveLoopSourcePath(forMatch[2], loopStack),
      };
      controlStack.push({ kind: "for", loop });
      loopStack.push(loop);

      pushOccurrence("for", matchText, match.index, expr, {
        scope: "root",
        loopAlias: forMatch[1],
        loopSource: forMatch[2],
        embeddedVarPaths: [forMatch[2]],
      });
      continue;
    }

    // ── if ─────────────────────────────────────────────────────────────────
    if (/^if\b/i.test(expr)) {
      controlStack.push({ kind: "if" });
      const conditionBody = expr.replace(/^if\s+/i, "");
      pushOccurrence("if", matchText, match.index, expr, {
        scope: "root",
        embeddedVarPaths: extractEmbeddedVarPaths(conditionBody, loopStack),
      });
      continue;
    }

    // ── elseif ────────────────────────────────────────────────────────────
    if (/^else\s*if\b/i.test(expr)) {
      const conditionBody = expr.replace(/^else\s*if\s+/i, "");
      pushOccurrence("elseif", matchText, match.index, expr, {
        scope: "root",
        embeddedVarPaths: extractEmbeddedVarPaths(conditionBody, loopStack),
      });
      continue;
    }

    // ── end ────────────────────────────────────────────────────────────────
    if (/^end\b/i.test(expr)) {
      const frame = controlStack.pop();
      if (frame?.kind === "for") {
        loopStack.pop();
      }
      pushOccurrence("end", matchText, match.index, expr, { scope: "root" });
      continue;
    }

    // ── else ──────────────────────────────────────────────────────────────
    if (/^else\b/i.test(expr)) {
      pushOccurrence("else", matchText, match.index, expr, { scope: "root" });
      continue;
    }

    // ── simple variable ───────────────────────────────────────────────────
    if (/^[A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*$/.test(expr)) {
      const rootPrefix = expr.split(".")[0];
      if (!SCRIBAN_KEYWORDS.has(rootPrefix.toLowerCase())) {
        pushOccurrence("variable", matchText, match.index, expr);
        continue;
      }
    }

    // ── complex expression (pipes, filters, function calls, etc.) ────────
    pushOccurrence("expression", matchText, match.index, expr, {
      embeddedVarPaths: extractEmbeddedVarPaths(expr, loopStack),
    });
  }

  return occurrences;
}

export function extractHtmlVarPaths(html: string): string[] {
  return [...new Set(
    extractHtmlVarOccurrences(html)
      .filter((o) => o.kind === "variable")
      .map((o) => o.path),
  )].sort();
}

function replaceMatchPath(matchText: string, newPath: string) {
  const fullMatch = /^(\{\{-?\s*)([A-Za-z_][\w]*(?:\.[A-Za-z_][\w]*)*)(\s*-?\}\})$/.exec(matchText);
  if (!fullMatch) {
    return `{{ ${newPath} }}`;
  }
  return `${fullMatch[1]}${newPath}${fullMatch[3]}`;
}

export function replaceHtmlVarOccurrence(html: string, occurrenceId: string, newPath: string): string {
  const occurrence = extractHtmlVarOccurrences(html).find((entry) => entry.id === occurrenceId);
  if (!occurrence) return html;

  return `${html.slice(0, occurrence.start)}${replaceMatchPath(occurrence.matchText, newPath)}${html.slice(occurrence.end)}`;
}

export function replaceHtmlVarPath(html: string, oldPath: string, newPath: string): string {
  const escaped = escapeRegExp(oldPath);
  return html.replace(
    new RegExp(`\\{\\{-?\\s*${escaped}\\s*-?\\}\\}`, "g"),
    (match) => replaceMatchPath(match, newPath),
  );
}

export function getCompatibleHtmlVarOptions(
  sourceData: unknown,
  occurrence: HtmlVarOccurrence,
): HtmlVarReplacementOption[] {
  // Control-flow tokens (if/else/end/for/expression) don't have replacement options
  if (occurrence.kind !== "variable") {
    return [];
  }

  if (occurrence.scope === "root") {
    return getBindingPathOptions(sourceData)
      .filter((option) => option.kind !== "object" && option.kind !== "array")
      .filter((option) => option.path === occurrence.rootPrefix || option.path.startsWith(`${occurrence.rootPrefix}.`))
      .map((option) => ({
        replacePath: option.path,
        displayPath: option.displayPath,
        label: option.label,
        description: option.description,
        group: option.group,
        sample: option.sample,
        kind: option.kind,
        searchText: option.searchText,
      }));
  }

  if (!occurrence.alias || !occurrence.resolvedSourcePath) {
    return [];
  }

  const scopedValue = getValueAtLoosePath(sourceData, occurrence.resolvedSourcePath);
  if (scopedValue === undefined) {
    return [];
  }

  return buildLoopOptions(scopedValue, occurrence.alias, occurrence.resolvedSourcePath);
}
