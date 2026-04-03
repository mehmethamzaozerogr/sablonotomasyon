import {
  compileOriginalHtml,
  compileToHtml,
} from "@/lib/preview/compile-to-html";
import type { PreviewMode, TemplateRecord } from "@/types/template";

type PreviewCompileStrategy = "original" | "typed";

type CompilePreviewOptions = {
  mode: PreviewMode;
  strategy?: PreviewCompileStrategy;
  refreshToken?: number;
};

type DocumentParts = {
  headInner: string;
  bodyInner: string;
  bodyAttrText: string;
};

type ModeProfile = {
  canvasBackground: string;
  canvasPadding: string;
  shellMaxWidth: string;
  shellPadding: string;
  shellRadius: string;
  shellShadow: string;
  shellBorder: string;
  viewport: string;
  mobileOverrides?: string;
  printOverrides?: string;
};

const PREVIEW_CACHE_LIMIT = 18;
const previewCache = new Map<string, string>();

const MODE_PROFILE: Record<PreviewMode, ModeProfile> = {
  desktop: {
    canvasBackground: "#e2e8f0",
    canvasPadding: "24px 20px",
    shellMaxWidth: "720px",
    shellPadding: "0",
    shellRadius: "18px",
    shellShadow: "0 26px 80px -48px rgba(15,23,42,0.45)",
    shellBorder: "1px solid rgba(148,163,184,0.3)",
    viewport: "width=device-width, initial-scale=1.0",
  },
  tablet: {
    canvasBackground: "#dbe3ef",
    canvasPadding: "20px 16px",
    shellMaxWidth: "640px",
    shellPadding: "0",
    shellRadius: "18px",
    shellShadow: "0 22px 64px -42px rgba(15,23,42,0.42)",
    shellBorder: "1px solid rgba(148,163,184,0.28)",
    viewport: "width=device-width, initial-scale=1.0",
  },
  mobile: {
    canvasBackground: "#cfd8e6",
    canvasPadding: "18px 10px",
    shellMaxWidth: "390px",
    shellPadding: "0",
    shellRadius: "26px",
    shellShadow: "0 30px 90px -50px rgba(15,23,42,0.55)",
    shellBorder: "1px solid rgba(148,163,184,0.34)",
    viewport: "width=390, initial-scale=1.0",
    mobileOverrides: `
      #preview-email-root table {
        max-width: 100% !important;
      }
      #preview-email-root img {
        max-width: 100% !important;
        height: auto !important;
      }
      #preview-email-root td,
      #preview-email-root th,
      #preview-email-root p,
      #preview-email-root span,
      #preview-email-root a {
        word-break: break-word;
      }
    `,
  },
  print: {
    canvasBackground: "#d1d5db",
    canvasPadding: "24px",
    shellMaxWidth: "210mm",
    shellPadding: "12mm",
    shellRadius: "4px",
    shellShadow: "0 24px 48px -32px rgba(15,23,42,0.5)",
    shellBorder: "1px solid #cbd5e1",
    viewport: "width=device-width, initial-scale=1.0",
    printOverrides: `
      #preview-shell {
        max-width: 210mm;
        min-height: 297mm;
      }
      @media print {
        body {
          background: #ffffff !important;
          padding: 0 !important;
        }
        #preview-shell {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          max-width: 100% !important;
          min-height: auto !important;
          margin: 0 !important;
          padding: 10mm !important;
        }
      }
      @page {
        size: A4;
        margin: 10mm;
      }
    `,
  },
};

function safeSerialize(value: unknown) {
  try {
    const json = JSON.stringify(value);
    return json.length > 12000
      ? `${json.slice(0, 12000)}:${json.length}`
      : json;
  } catch {
    return String(value);
  }
}

function hashString(value: string) {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function buildTemplateContentFingerprint(template: TemplateRecord) {
  const snapshot = {
    name: template.name,
    subject: template.subject,
    category: template.category,
    blocks: template.blocks,
    htmlEnvelope: template.htmlEnvelope,
    designSystem: template.designSystem,
  };

  return hashString(JSON.stringify(snapshot));
}

function readDocumentParts(html: string): DocumentParts {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);

  return {
    headInner: headMatch?.[1] ?? "",
    bodyAttrText: bodyMatch?.[1] ?? "",
    bodyInner: bodyMatch?.[2] ?? html,
  };
}

function getBodyStyleFromAttrs(bodyAttrText: string) {
  const styleMatch = bodyAttrText.match(/style\s*=\s*(["'])([\s\S]*?)\1/i);
  return styleMatch?.[2] ?? "";
}

function buildPreviewWrapperDocument(
  baseHtml: string,
  mode: PreviewMode,
  title: string,
) {
  const profile = MODE_PROFILE[mode];
  const parts = readDocumentParts(baseHtml);
  const bodyStyleFromSource = getBodyStyleFromAttrs(parts.bodyAttrText);
  const rootStyle = bodyStyleFromSource ? `${bodyStyleFromSource};` : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="${profile.viewport}" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  ${parts.headInner}
  <style>
    html, body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      width: 100%;
    }
    body {
      background: ${profile.canvasBackground};
      padding: ${profile.canvasPadding};
      box-sizing: border-box;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    #preview-shell {
      max-width: ${profile.shellMaxWidth};
      margin: 0 auto;
      padding: ${profile.shellPadding};
      border-radius: ${profile.shellRadius};
      box-shadow: ${profile.shellShadow};
      border: ${profile.shellBorder};
      background: #ffffff;
      overflow: hidden;
    }
    #preview-email-root {
      width: 100%;
      margin: 0 auto;
      ${rootStyle}
    }
    #preview-email-root img {
      max-width: 100%;
      height: auto;
    }
    ${profile.mobileOverrides ?? ""}
    ${profile.printOverrides ?? ""}
  </style>
</head>
<body>
  <main id="preview-shell" data-preview-mode="${mode}">
    <div id="preview-email-root">
      ${parts.bodyInner}
    </div>
  </main>
</body>
</html>`;
}

function pushPreviewCache(key: string, html: string) {
  if (previewCache.has(key)) {
    previewCache.delete(key);
  }
  previewCache.set(key, html);
  if (previewCache.size <= PREVIEW_CACHE_LIMIT) {
    return;
  }

  const firstKey = previewCache.keys().next().value;
  if (firstKey) {
    previewCache.delete(firstKey);
  }
}

function buildCacheKey(
  template: TemplateRecord,
  sourceData: unknown,
  mode: PreviewMode,
  strategy: PreviewCompileStrategy,
  refreshToken: number,
) {
  const templateFingerprint = buildTemplateContentFingerprint(template);

  return [
    template.id,
    templateFingerprint,
    mode,
    strategy,
    refreshToken,
    safeSerialize(sourceData),
  ].join("|");
}

export function compilePreviewHtml(
  template: TemplateRecord,
  sourceData: unknown,
  options: CompilePreviewOptions,
) {
  const strategy = options.strategy ?? "original";
  const refreshToken = options.refreshToken ?? 0;
  const cacheKey = buildCacheKey(
    template,
    sourceData,
    options.mode,
    strategy,
    refreshToken,
  );
  const cached = previewCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const baseHtml =
    strategy === "typed"
      ? compileToHtml(template, sourceData, options.mode)
      : compileOriginalHtml(template, sourceData);

  const wrapped = buildPreviewWrapperDocument(
    baseHtml,
    options.mode,
    template.name,
  );
  pushPreviewCache(cacheKey, wrapped);
  return wrapped;
}
