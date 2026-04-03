import {
  extractColorsFromHtml,
  extractFontsFromHtml,
  replaceColorInHtml,
  replaceFontInHtml,
} from "@/lib/design/color-utils";
import type {
  EditorBlock,
  TemplateColorTokens,
  TemplateDesignSystem,
  TemplateLayoutSystem,
  TemplateRecord,
  TemplateSavedTheme,
  TemplateTypographySystem,
} from "@/types/template";

type ThemePresetDefinition = {
  id: string;
  name: string;
  description: string;
  palette: TemplateColorTokens;
  typography: TemplateTypographySystem;
  layout: TemplateLayoutSystem;
};

const DEFAULT_PALETTE: TemplateColorTokens = {
  bodyBackground: "#eef2f7",
  canvasBackground: "#dde7f0",
  contentBackground: "#ffffff",
  mutedSurface: "#f8fafc",
  borderColor: "#d7dee8",
  textColor: "#0f172a",
  headingColor: "#020617",
  linkColor: "#2563eb",
  accentColor: "#0f172a",
  buttonBackground: "#0f172a",
  buttonTextColor: "#ffffff",
};

const DEFAULT_TYPOGRAPHY: TemplateTypographySystem = {
  fontFamily: "Inter",
  headingFontFamily: "Inter",
  baseFontSize: 14,
  headingScale: 1.18,
  lineHeight: 1.6,
};

const DEFAULT_LAYOUT: TemplateLayoutSystem = {
  pageWidth: 760,
  contentWidth: 640,
  sectionSpacing: 24,
  containerPaddingX: 24,
  containerPaddingY: 20,
  radius: 18,
  borderWidth: 1,
  shadowPreset: "soft",
  buttonRadius: 14,
  buttonPaddingX: 24,
  buttonPaddingY: 12,
  imageRadius: 18,
  dividerStyle: "subtle",
};

export const TEMPLATE_THEME_PRESETS: ThemePresetDefinition[] = [
  {
    id: "modern-light",
    name: "Modern Light",
    description: "Bright SaaS polish with crisp neutrals and sharp contrast.",
    palette: {
      bodyBackground: "#edf2f7",
      canvasBackground: "#d9e3ef",
      contentBackground: "#ffffff",
      mutedSurface: "#f8fafc",
      borderColor: "#dbe2ea",
      textColor: "#0f172a",
      headingColor: "#020617",
      linkColor: "#2563eb",
      accentColor: "#0f172a",
      buttonBackground: "#0f172a",
      buttonTextColor: "#ffffff",
    },
    typography: {
      fontFamily: "Inter",
      headingFontFamily: "Inter",
      baseFontSize: 14,
      headingScale: 1.18,
      lineHeight: 1.6,
    },
    layout: { ...DEFAULT_LAYOUT },
  },
  {
    id: "elegant-neutral",
    name: "Elegant Neutral",
    description: "Warm editorial tones with calm surfaces and softer emphasis.",
    palette: {
      bodyBackground: "#f5f1eb",
      canvasBackground: "#e7ddd2",
      contentBackground: "#fffdf9",
      mutedSurface: "#f6f2ed",
      borderColor: "#d9cfc3",
      textColor: "#292524",
      headingColor: "#1c1917",
      linkColor: "#8c4f2f",
      accentColor: "#4b342a",
      buttonBackground: "#4b342a",
      buttonTextColor: "#fffdf9",
    },
    typography: {
      fontFamily: "Lato",
      headingFontFamily: "Georgia",
      baseFontSize: 15,
      headingScale: 1.22,
      lineHeight: 1.65,
    },
    layout: { ...DEFAULT_LAYOUT, radius: 20, buttonRadius: 999 },
  },
  {
    id: "minimal-corporate",
    name: "Minimal Corporate",
    description: "Tight enterprise rhythm with restrained blue-gray surfaces.",
    palette: {
      bodyBackground: "#edf1f5",
      canvasBackground: "#d9e1eb",
      contentBackground: "#ffffff",
      mutedSurface: "#f4f7fa",
      borderColor: "#d3dae3",
      textColor: "#111827",
      headingColor: "#0f172a",
      linkColor: "#1d4ed8",
      accentColor: "#0f172a",
      buttonBackground: "#1e3a8a",
      buttonTextColor: "#ffffff",
    },
    typography: {
      fontFamily: "Helvetica",
      headingFontFamily: "Helvetica",
      baseFontSize: 14,
      headingScale: 1.14,
      lineHeight: 1.55,
    },
    layout: { ...DEFAULT_LAYOUT, radius: 12, sectionSpacing: 20 },
  },
  {
    id: "soft-commerce",
    name: "Soft Commerce",
    description: "Friendly conversion-focused palette with softer accents.",
    palette: {
      bodyBackground: "#f7f1ee",
      canvasBackground: "#eaded8",
      contentBackground: "#fffdfb",
      mutedSurface: "#fff3ee",
      borderColor: "#f0d9cf",
      textColor: "#37231f",
      headingColor: "#24120d",
      linkColor: "#b45309",
      accentColor: "#b45309",
      buttonBackground: "#ea580c",
      buttonTextColor: "#fff7ed",
    },
    typography: {
      fontFamily: "Open Sans",
      headingFontFamily: "Poppins",
      baseFontSize: 14,
      headingScale: 1.2,
      lineHeight: 1.62,
    },
    layout: { ...DEFAULT_LAYOUT, radius: 22, buttonRadius: 16 },
  },
  {
    id: "dark-premium",
    name: "Dark Premium",
    description: "High-contrast dark surfaces for templates that can support it.",
    palette: {
      bodyBackground: "#111827",
      canvasBackground: "#0b1220",
      contentBackground: "#111827",
      mutedSurface: "#1f2937",
      borderColor: "#334155",
      textColor: "#e5eefb",
      headingColor: "#ffffff",
      linkColor: "#93c5fd",
      accentColor: "#f8fafc",
      buttonBackground: "#f8fafc",
      buttonTextColor: "#0f172a",
    },
    typography: {
      fontFamily: "Inter",
      headingFontFamily: "Montserrat",
      baseFontSize: 14,
      headingScale: 1.2,
      lineHeight: 1.62,
    },
    layout: { ...DEFAULT_LAYOUT, radius: 20, shadowPreset: "medium" },
  },
  {
    id: "classic-clean",
    name: "Classic Clean",
    description: "Safe and timeless email styling for broad compatibility.",
    palette: {
      bodyBackground: "#f4f4f5",
      canvasBackground: "#e4e4e7",
      contentBackground: "#ffffff",
      mutedSurface: "#f9fafb",
      borderColor: "#e5e7eb",
      textColor: "#1f2937",
      headingColor: "#111827",
      linkColor: "#1d4ed8",
      accentColor: "#111827",
      buttonBackground: "#1f2937",
      buttonTextColor: "#ffffff",
    },
    typography: {
      fontFamily: "Arial",
      headingFontFamily: "Georgia",
      baseFontSize: 14,
      headingScale: 1.16,
      lineHeight: 1.58,
    },
    layout: { ...DEFAULT_LAYOUT, radius: 14, buttonRadius: 12, imageRadius: 14 },
  },
];

function cloneDesignSystem(design: TemplateDesignSystem): TemplateDesignSystem {
  return JSON.parse(JSON.stringify(design)) as TemplateDesignSystem;
}

function collectTemplateHtml(template: TemplateRecord) {
  const html = template.blocks
    .filter((block) => block.type === "customHtml")
    .map((block) => String(block.props["html"] ?? ""))
    .join("\n");

  return html || template.source.messageDetail || "";
}

function pickColor(
  colors: ReturnType<typeof extractColorsFromHtml>,
  role: "background" | "text" | "border",
  fallback: string,
) {
  return colors.find((entry) => entry.role === role)?.hex ?? fallback;
}

function detectContentWidth(html: string) {
  const match =
    html.match(/max-width\s*:\s*(\d{3,4})px/i) ??
    html.match(/width\s*=\s*["']?(\d{3,4})["']?/i);

  return match ? Number(match[1]) : DEFAULT_LAYOUT.contentWidth;
}

function detectPageWidth(contentWidth: number) {
  return Math.max(contentWidth + 120, DEFAULT_LAYOUT.pageWidth);
}

function createSyncedColorMap(colors: ReturnType<typeof extractColorsFromHtml>): Partial<Record<keyof TemplateColorTokens, string>> {
  return {
    bodyBackground: pickColor(colors, "background", DEFAULT_PALETTE.bodyBackground),
    canvasBackground: DEFAULT_PALETTE.canvasBackground,
    contentBackground: pickColor(colors, "background", DEFAULT_PALETTE.contentBackground),
    mutedSurface: colors.find((entry) => entry.role === "background" && entry.hex !== pickColor(colors, "background", DEFAULT_PALETTE.contentBackground))?.hex
      ?? DEFAULT_PALETTE.mutedSurface,
    borderColor: pickColor(colors, "border", DEFAULT_PALETTE.borderColor),
    textColor: pickColor(colors, "text", DEFAULT_PALETTE.textColor),
    headingColor: pickColor(colors, "text", DEFAULT_PALETTE.headingColor),
    linkColor:
      colors.find((entry) => entry.role === "text" && entry.hex !== pickColor(colors, "text", DEFAULT_PALETTE.textColor))?.hex
      ?? DEFAULT_PALETTE.linkColor,
    accentColor: DEFAULT_PALETTE.accentColor,
    buttonBackground: DEFAULT_PALETTE.buttonBackground,
    buttonTextColor: DEFAULT_PALETTE.buttonTextColor,
  };
}

export function createInitialTemplateDesignSystem(template: TemplateRecord): TemplateDesignSystem {
  const html = collectTemplateHtml(template);
  const fonts = extractFontsFromHtml(html);
  const colors = extractColorsFromHtml(html);
  const syncedColors = createSyncedColorMap(colors);
  const contentWidth = detectContentWidth(html);

  return {
    version: 1,
    activeThemeId: "modern-light",
    activeThemeName: "Modern Light",
    palette: {
      ...DEFAULT_PALETTE,
      bodyBackground: syncedColors.bodyBackground ?? DEFAULT_PALETTE.bodyBackground,
      contentBackground: syncedColors.contentBackground ?? DEFAULT_PALETTE.contentBackground,
      mutedSurface: syncedColors.mutedSurface ?? DEFAULT_PALETTE.mutedSurface,
      borderColor: syncedColors.borderColor ?? DEFAULT_PALETTE.borderColor,
      textColor: syncedColors.textColor ?? DEFAULT_PALETTE.textColor,
      headingColor: syncedColors.headingColor ?? DEFAULT_PALETTE.headingColor,
      linkColor: syncedColors.linkColor ?? DEFAULT_PALETTE.linkColor,
    },
    typography: {
      ...DEFAULT_TYPOGRAPHY,
      fontFamily: fonts[0] ?? DEFAULT_TYPOGRAPHY.fontFamily,
      headingFontFamily: fonts[1] ?? fonts[0] ?? DEFAULT_TYPOGRAPHY.headingFontFamily,
    },
    layout: {
      ...DEFAULT_LAYOUT,
      contentWidth,
      pageWidth: detectPageWidth(contentWidth),
    },
    syncedFromSource: {
      fonts,
      colors: syncedColors,
    },
    customThemes: [],
    lastAppliedAt: null,
  };
}

export function ensureTemplateDesignSystem(template: TemplateRecord): TemplateDesignSystem {
  return template.designSystem
    ? cloneDesignSystem(template.designSystem)
    : createInitialTemplateDesignSystem(template);
}

function mapCustomHtmlBlocks(
  blocks: EditorBlock[],
  mapper: (html: string) => string,
): EditorBlock[] {
  return blocks.map((block) => {
    if (block.type !== "customHtml") {
      return block;
    }

    const html = String(block.props["html"] ?? "");
    const nextHtml = mapper(html);

    if (nextHtml === html) {
      return block;
    }

    return {
      ...block,
      props: {
        ...block.props,
        html: nextHtml,
      },
    };
  });
}

function applyTokenReplacements(
  template: TemplateRecord,
  previousDesign: TemplateDesignSystem,
  nextDesign: TemplateDesignSystem,
) {
  const colorPairs = Object.entries(nextDesign.palette).reduce<Array<[string, string]>>(
    (pairs, [key, nextValue]) => {
      const oldValue = previousDesign.palette[key as keyof TemplateColorTokens];
      if (
        typeof oldValue === "string" &&
        typeof nextValue === "string" &&
        oldValue &&
        nextValue &&
        oldValue.toLowerCase() !== nextValue.toLowerCase()
      ) {
        pairs.push([oldValue, nextValue]);
      }
      return pairs;
    },
    [],
  );

  const fontPairs: Array<[string, string]> = [];
  if (
    previousDesign.typography.fontFamily &&
    previousDesign.typography.fontFamily !== nextDesign.typography.fontFamily
  ) {
    fontPairs.push([
      previousDesign.typography.fontFamily,
      nextDesign.typography.fontFamily,
    ]);
  }
  if (
    previousDesign.typography.headingFontFamily &&
    previousDesign.typography.headingFontFamily !== nextDesign.typography.headingFontFamily
  ) {
    fontPairs.push([
      previousDesign.typography.headingFontFamily,
      nextDesign.typography.headingFontFamily,
    ]);
  }

  let nextBlocks = [...template.blocks];

  for (const [oldHex, newHex] of colorPairs) {
    nextBlocks = mapCustomHtmlBlocks(nextBlocks, (html) =>
      replaceColorInHtml(html, oldHex, newHex),
    );
  }

  for (const [oldFont, newFont] of fontPairs) {
    nextBlocks = mapCustomHtmlBlocks(nextBlocks, (html) =>
      replaceFontInHtml(html, oldFont, newFont),
    );
  }

  return nextBlocks;
}

function nextSavedThemes(design: TemplateDesignSystem, theme: TemplateSavedTheme) {
  const existing = design.customThemes ?? [];
  const withoutSameId = existing.filter((entry) => entry.id !== theme.id);
  return [...withoutSameId, theme];
}

export function updateTemplateDesignSystem(
  template: TemplateRecord,
  updater: (design: TemplateDesignSystem) => TemplateDesignSystem,
) {
  const previousDesign = ensureTemplateDesignSystem(template);
  const nextDesign = updater(cloneDesignSystem(previousDesign));
  const nextBlocks = applyTokenReplacements(template, previousDesign, nextDesign);

  return {
    ...template,
    blocks: nextBlocks,
    designSystem: {
      ...nextDesign,
      lastAppliedAt: new Date().toISOString(),
    },
  };
}

export function applyThemePreset(template: TemplateRecord, themeId: string) {
  const current = ensureTemplateDesignSystem(template);
  const preset =
    TEMPLATE_THEME_PRESETS.find((entry) => entry.id === themeId) ??
    current.customThemes?.find((entry) => entry.id === themeId);

  if (!preset) {
    return template;
  }

  return updateTemplateDesignSystem(template, (design) => ({
    ...design,
    activeThemeId: preset.id,
    activeThemeName: preset.name,
    palette: { ...preset.palette },
    typography: { ...preset.typography },
    layout: { ...preset.layout },
  }));
}

export function saveCurrentThemeAsCustomTheme(
  template: TemplateRecord,
  name: string,
  originPresetId?: string | null,
) {
  const safeName = name.trim() || "Custom Theme";
  const themeId = `custom-${safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

  return updateTemplateDesignSystem(template, (design) => ({
    ...design,
    customThemes: nextSavedThemes(design, {
      id: themeId,
      name: safeName,
      originPresetId: originPresetId ?? design.activeThemeId,
      description: `Saved from ${design.activeThemeName}`,
      palette: { ...design.palette },
      typography: { ...design.typography },
      layout: { ...design.layout },
    }),
  }));
}

export function duplicateActiveTheme(template: TemplateRecord) {
  const current = ensureTemplateDesignSystem(template);
  return saveCurrentThemeAsCustomTheme(
    template,
    `${current.activeThemeName} Copy`,
    current.activeThemeId,
  );
}

function shadowCss(shadowPreset: TemplateLayoutSystem["shadowPreset"]) {
  if (shadowPreset === "none") return "none";
  if (shadowPreset === "medium") {
    return "0 26px 56px -32px rgba(15,23,42,0.45)";
  }
  if (shadowPreset === "strong") {
    return "0 32px 72px -34px rgba(15,23,42,0.55)";
  }
  return "0 22px 48px -34px rgba(15,23,42,0.28)";
}

function dividerBorderCss(style: TemplateLayoutSystem["dividerStyle"], color: string) {
  if (style === "dashed") {
    return `1px dashed ${color}`;
  }
  if (style === "subtle") {
    return `1px solid ${color}`;
  }
  return `1px solid ${color}`;
}

function ensureHead(html: string) {
  if (/<head[\s>]/i.test(html)) {
    return html;
  }

  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, "<html$1><head></head>");
  }

  return `<!DOCTYPE html><html><head></head><body>${html}</body></html>`;
}

function buildDesignStyleTag(design: TemplateDesignSystem) {
  return `<style data-template-design="true">
    body {
      background: ${design.palette.bodyBackground} !important;
      color: ${design.palette.textColor};
      font-family: ${design.typography.fontFamily}, sans-serif;
      font-size: ${design.typography.baseFontSize}px;
      line-height: ${design.typography.lineHeight};
    }
    #preview-shell {
      max-width: ${design.layout.pageWidth}px !important;
      box-shadow: ${shadowCss(design.layout.shadowPreset)} !important;
      border-radius: ${design.layout.radius}px !important;
      background: ${design.palette.contentBackground} !important;
    }
    #preview-email-root {
      max-width: ${design.layout.contentWidth}px;
      margin: 0 auto;
      color: ${design.palette.textColor};
      font-family: ${design.typography.fontFamily}, sans-serif;
      background: ${design.palette.contentBackground};
    }
    #preview-email-root table,
    #preview-email-root td,
    #preview-email-root th,
    #preview-email-root p,
    #preview-email-root span,
    #preview-email-root div,
    #preview-email-root li {
      color: ${design.palette.textColor};
      font-family: ${design.typography.fontFamily}, sans-serif;
      line-height: ${design.typography.lineHeight};
    }
    #preview-email-root h1,
    #preview-email-root h2,
    #preview-email-root h3,
    #preview-email-root h4,
    #preview-email-root h5,
    #preview-email-root h6,
    #preview-email-root strong {
      color: ${design.palette.headingColor};
      font-family: ${design.typography.headingFontFamily}, ${design.typography.fontFamily}, sans-serif;
    }
    #preview-email-root a {
      color: ${design.palette.linkColor} !important;
    }
    #preview-email-root img {
      border-radius: ${design.layout.imageRadius}px;
    }
    #preview-email-root hr {
      border: 0;
      border-top: ${dividerBorderCss(design.layout.dividerStyle, design.palette.borderColor)};
    }
  </style>`;
}

export function applyDesignSystemToDocument(html: string, designSystem?: TemplateDesignSystem | null) {
  if (!designSystem) {
    return html;
  }

  const withHead = ensureHead(html).replace(
    /<style data-template-design="true">[\s\S]*?<\/style>/i,
    "",
  );

  return withHead.replace(/<\/head>/i, `${buildDesignStyleTag(designSystem)}</head>`);
}
