/**
 * Lightweight Scriban template evaluator for HTML preview.
 * Handles: {{ variable.path }}, {{ for x in arr }}...{{ end }},
 * {{ if expr }}...{{ else }}...{{ end }}, basic comparisons.
 */

type Ctx = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

function getAtPath(ctx: Ctx, path: string): unknown {
  const parts = path.trim().split(".");
  let current: unknown = ctx;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object" && !Array.isArray(current)) {
      current = (current as Ctx)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function isTruthy(v: unknown): boolean {
  if (v === null || v === undefined || v === "" || v === false) return false;
  if (typeof v === "number") return v !== 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

// ---------------------------------------------------------------------------
// Condition evaluator
// ---------------------------------------------------------------------------

function evalCondition(expr: string, ctx: Ctx): boolean {
  expr = expr.trim();

  // AND — split only on top-level &&
  if (expr.includes("&&")) {
    return expr.split("&&").every((p) => evalCondition(p.trim(), ctx));
  }

  // OR
  if (expr.includes("||")) {
    return expr.split("||").some((p) => evalCondition(p.trim(), ctx));
  }

  // != empty / == empty
  let m = /^(.+?)\s*!=\s*empty$/.exec(expr);
  if (m) return isTruthy(getAtPath(ctx, m[1].trim()));

  m = /^(.+?)\s*==\s*empty$/.exec(expr);
  if (m) return !isTruthy(getAtPath(ctx, m[1].trim()));

  // != null / != ""
  m = /^(.+?)\s*!=\s*(?:null|""|'')$/.exec(expr);
  if (m) return isTruthy(getAtPath(ctx, m[1].trim()));

  m = /^(.+?)\s*==\s*(?:null|""|'')$/.exec(expr);
  if (m) return !isTruthy(getAtPath(ctx, m[1].trim()));

  // == "string" / != "string"
  m = /^(.+?)\s*==\s*["'](.+?)["']$/.exec(expr);
  if (m) return formatValue(getAtPath(ctx, m[1].trim())) === m[2];

  m = /^(.+?)\s*!=\s*["'](.+?)["']$/.exec(expr);
  if (m) return formatValue(getAtPath(ctx, m[1].trim())) !== m[2];

  // > or < number
  m = /^(.+?)\s*>\s*(-?\d+(?:\.\d+)?)$/.exec(expr);
  if (m) return Number(getAtPath(ctx, m[1].trim())) > Number(m[2]);

  m = /^(.+?)\s*<\s*(-?\d+(?:\.\d+)?)$/.exec(expr);
  if (m) return Number(getAtPath(ctx, m[1].trim())) < Number(m[2]);

  // >= or <=
  m = /^(.+?)\s*>=\s*(-?\d+(?:\.\d+)?)$/.exec(expr);
  if (m) return Number(getAtPath(ctx, m[1].trim())) >= Number(m[2]);

  m = /^(.+?)\s*<=\s*(-?\d+(?:\.\d+)?)$/.exec(expr);
  if (m) return Number(getAtPath(ctx, m[1].trim())) <= Number(m[2]);

  // Plain variable truthiness
  return isTruthy(getAtPath(ctx, expr));
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TagToken =
  | { type: "text"; value: string }
  | { type: "var"; path: string }
  | { type: "if"; condition: string }
  | { type: "elseif"; condition: string }
  | { type: "else" }
  | { type: "end" }
  | { type: "for"; alias: string; arrayPath: string };

function tokenize(template: string): TagToken[] {
  const tokens: TagToken[] = [];
  // Match {{- ... -}} or {{ ... }} tags
  const tagRe = /\{\{-?\s*([\s\S]*?)\s*-?\}\}/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(template)) !== null) {
    if (m.index > lastIdx) {
      tokens.push({ type: "text", value: template.slice(lastIdx, m.index) });
    }

    const inner = m[1].trim();

    if (inner === "end") {
      tokens.push({ type: "end" });
    } else if (inner === "else") {
      tokens.push({ type: "else" });
    } else if (inner.startsWith("else if ")) {
      tokens.push({ type: "elseif", condition: inner.slice(8) });
    } else if (inner.startsWith("if ")) {
      tokens.push({ type: "if", condition: inner.slice(3) });
    } else if (inner.startsWith("for ")) {
      const fm = /^for\s+(\w+)\s+in\s+([\w.[\]"']+)$/.exec(inner);
      if (fm) {
        tokens.push({ type: "for", alias: fm[1], arrayPath: fm[2] });
      } else {
        tokens.push({ type: "text", value: m[0] });
      }
    } else {
      // Variable — strip pipe formatters, keep only the path
      const path = inner.split("|")[0].trim();
      tokens.push({ type: "var", path });
    }

    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < template.length) {
    tokens.push({ type: "text", value: template.slice(lastIdx) });
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// AST nodes
// ---------------------------------------------------------------------------

type AstNode =
  | { kind: "text"; value: string }
  | { kind: "var"; path: string }
  | { kind: "if"; branches: Array<{ condition: string | null; body: AstNode[] }> }
  | { kind: "for"; alias: string; arrayPath: string; body: AstNode[] };

function parse(tokens: TagToken[]): AstNode[] {
  let pos = 0;

  function parseBlock(): AstNode[] {
    const nodes: AstNode[] = [];

    while (pos < tokens.length) {
      const tok = tokens[pos];

      if (tok.type === "text") {
        nodes.push({ kind: "text", value: tok.value });
        pos++;
      } else if (tok.type === "var") {
        nodes.push({ kind: "var", path: tok.path });
        pos++;
      } else if (tok.type === "if") {
        pos++; // consume 'if'
        const branches: Array<{ condition: string | null; body: AstNode[] }> = [];
        branches.push({ condition: tok.condition, body: parseBlock() });

        while (pos < tokens.length) {
          const cur = tokens[pos];
          if (cur.type === "elseif") {
            pos++;
            branches.push({ condition: cur.condition, body: parseBlock() });
          } else if (cur.type === "else") {
            pos++;
            branches.push({ condition: null, body: parseBlock() });
          } else if (cur.type === "end") {
            pos++;
            break;
          } else {
            break;
          }
        }

        nodes.push({ kind: "if", branches });
      } else if (tok.type === "for") {
        pos++; // consume 'for'
        const body = parseBlock();
        if (pos < tokens.length && tokens[pos].type === "end") pos++;
        nodes.push({ kind: "for", alias: tok.alias, arrayPath: tok.arrayPath, body });
      } else if (tok.type === "else" || tok.type === "elseif" || tok.type === "end") {
        // Stop block — let parent handle
        break;
      } else {
        pos++;
      }
    }

    return nodes;
  }

  return parseBlock();
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

function renderNodes(nodes: AstNode[], ctx: Ctx): string {
  let out = "";

  for (const node of nodes) {
    if (node.kind === "text") {
      out += node.value;
    } else if (node.kind === "var") {
      out += formatValue(getAtPath(ctx, node.path));
    } else if (node.kind === "if") {
      for (const branch of node.branches) {
        if (branch.condition === null || evalCondition(branch.condition, ctx)) {
          out += renderNodes(branch.body, ctx);
          break;
        }
      }
    } else if (node.kind === "for") {
      const arr = getAtPath(ctx, node.arrayPath);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          const childCtx: Ctx = { ...ctx, [node.alias]: item as unknown };
          // Also spread item props into context for direct access (e.g. itm.ItemName)
          if (item !== null && typeof item === "object" && !Array.isArray(item)) {
            Object.assign(childCtx, item);
          }
          out += renderNodes(node.body, childCtx);
        }
      }
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function evaluateScriban(template: string, data: unknown): string {
  if (!template) return "";
  try {
    const ctx = (data ?? {}) as Ctx;
    const tokens = tokenize(template);
    const ast = parse(tokens);
    return renderNodes(ast, ctx);
  } catch {
    // On any parse error, return the raw template so at least structure is visible
    return template;
  }
}
