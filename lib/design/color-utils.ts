/**
 * Utilities for extracting and replacing colors / fonts in raw HTML strings.
 * Used by the design panel to give users a visual palette editor.
 */

export type ExtractedColor = {
  hex: string;
  usages: number;
  role: "background" | "text" | "border" | "other";
};

function normalizeHex(raw: string): string | null {
  const h = raw.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(h)) return h;
  if (/^#[0-9a-f]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return null;
}

function rgbToHex(r: string, g: string, b: string): string {
  const toH = (n: string) => parseInt(n).toString(16).padStart(2, "0");
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

function parseColor(raw: string): string | null {
  const t = raw.trim();
  const hex = normalizeHex(t);
  if (hex) return hex;
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(t);
  if (rgb) return rgbToHex(rgb[1], rgb[2], rgb[3]);
  return null;
}

function recordColor(
  map: Map<string, { count: number; role: ExtractedColor["role"] }>,
  raw: string,
  role: ExtractedColor["role"],
) {
  const hex = parseColor(raw);
  if (!hex) return;
  const entry = map.get(hex);
  if (entry) {
    entry.count++;
  } else {
    map.set(hex, { count: 1, role });
  }
}

const COLOR_VALUE = `(#[0-9a-fA-F]{3,6}|rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\))`;

/**
 * Extracts unique colors from HTML (inline styles, bgcolor attrs, <style> tags).
 * Returns sorted by usage count descending.
 */
export function extractColorsFromHtml(html: string): ExtractedColor[] {
  if (!html) return [];
  const map = new Map<string, { count: number; role: ExtractedColor["role"] }>();

  // Inline style attributes
  const styleAttrRe = /style="([^"]*)"/gi;
  let m: RegExpExecArray | null;
  while ((m = styleAttrRe.exec(html)) !== null) {
    const s = m[1];
    const bgRe = new RegExp(`background(?:-color)?\\s*:\\s*${COLOR_VALUE}`, "gi");
    let sm: RegExpExecArray | null;
    while ((sm = bgRe.exec(s)) !== null) recordColor(map, sm[1], "background");
    const colorRe = new RegExp(`(?:^|;)\\s*color\\s*:\\s*${COLOR_VALUE}`, "gi");
    while ((sm = colorRe.exec(s)) !== null) recordColor(map, sm[1], "text");
    const borderRe = new RegExp(`border(?:-color)?\\s*:\\s*${COLOR_VALUE}`, "gi");
    while ((sm = borderRe.exec(s)) !== null) recordColor(map, sm[1], "border");
  }

  // bgcolor="..." attributes
  const bgcolorRe = /bgcolor="(#[0-9a-fA-F]{3,6})"/gi;
  while ((m = bgcolorRe.exec(html)) !== null) recordColor(map, m[1], "background");

  // <style> tags
  const styleTagRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = styleTagRe.exec(html)) !== null) {
    const css = m[1];
    const propRe = new RegExp(
      `(background(?:-color)?|(?:^|[;{\\s])color|border(?:-color)?)\\s*:\\s*${COLOR_VALUE}`,
      "gi",
    );
    let cm: RegExpExecArray | null;
    while ((cm = propRe.exec(css)) !== null) {
      const prop = cm[1].trim().toLowerCase();
      const role: ExtractedColor["role"] = prop.includes("background")
        ? "background"
        : prop.endsWith("color")
          ? "text"
          : "border";
      recordColor(map, cm[2], role);
    }
  }

  return Array.from(map.entries())
    .map(([hex, { count, role }]) => ({ hex, usages: count, role }))
    .sort((a, b) => b.usages - a.usages);
}

/**
 * Replaces every occurrence of oldHex with newHex in an HTML string (case-insensitive).
 */
export function replaceColorInHtml(html: string, oldHex: string, newHex: string): string {
  const escaped = oldHex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(escaped, "gi"), newHex);
}

/**
 * Extracts distinct font-family names from HTML (inline styles + <style> tags).
 * Returns only non-generic families.
 */
const GENERIC_FONTS = new Set([
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
  "ui-serif", "ui-sans-serif", "ui-monospace", "inherit", "initial",
]);

export function extractFontsFromHtml(html: string): string[] {
  const fonts = new Set<string>();
  const re = /font-family\s*:\s*([^;}"'<]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const parts = m[1].split(",").map((f) => f.trim().replace(/['"]/g, "").trim());
    for (const part of parts) {
      if (part && !GENERIC_FONTS.has(part.toLowerCase())) fonts.add(part);
    }
  }
  return [...fonts];
}

/**
 * Replaces every occurrence of oldFont with newFont in an HTML string.
 */
export function replaceFontInHtml(html: string, oldFont: string, newFont: string): string {
  const escaped = oldFont.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(new RegExp(escaped, "gi"), newFont);
}
