import { extractHtmlVarOccurrences } from "@/lib/bindings/html-vars";
import {
  getBindingPathOptions,
  getRepeaterItemOptions,
  getValueAtPath,
} from "@/lib/bindings/introspection";
import { getBlockFields, getBlockLabel } from "@/lib/blocks/registry";
import { validateBlockWithDefinition } from "@/lib/blocks/validation";
import { sanitizeCustomHtmlForApp } from "@/lib/security/sanitize-custom-html";
import type { EditorBlock, TemplateRecord } from "@/types/template";

export type ValidationLevel = "error" | "warning" | "info";
export type ValidationScope = "block" | "document";
export type ValidationRunMode = "live" | "publish";

export type TemplateValidationIssue = {
  id: string;
  level: ValidationLevel;
  scope: ValidationScope;
  code: string;
  title: string;
  message: string;
  blockId?: string;
  blockType?: EditorBlock["type"];
  blockLabel?: string;
};

export type TemplateValidationResult = {
  mode: ValidationRunMode;
  issues: TemplateValidationIssue[];
  blockIssues: TemplateValidationIssue[];
  documentIssues: TemplateValidationIssue[];
  counts: {
    error: number;
    warning: number;
    info: number;
  };
  hasBlockingErrors: boolean;
};

function makeIssueId(issue: Omit<TemplateValidationIssue, "id">) {
  return [issue.scope, issue.blockId ?? "doc", issue.code, issue.level].join(
    ":",
  );
}

function pushIssue(
  target: TemplateValidationIssue[],
  issue: Omit<TemplateValidationIssue, "id">,
) {
  target.push({
    ...issue,
    id: makeIssueId(issue),
  });
}

function severityRank(level: ValidationLevel) {
  if (level === "error") return 0;
  if (level === "warning") return 1;
  return 2;
}

function dedupeIssues(issues: TemplateValidationIssue[]) {
  const map = new Map<string, TemplateValidationIssue>();
  for (const issue of issues) {
    if (!map.has(issue.id)) {
      map.set(issue.id, issue);
    }
  }
  return Array.from(map.values());
}

function hasPathInSet(path: string, rootPathSet: Set<string>) {
  if (!path) return false;
  if (rootPathSet.has(path)) return true;

  // Loose compatibility for prefixes when source object shape is partially sparse.
  const parts = path.split(".");
  for (let i = parts.length - 1; i > 0; i -= 1) {
    const candidate = parts.slice(0, i).join(".");
    if (rootPathSet.has(candidate)) {
      return true;
    }
  }
  return false;
}

function countMeaningfulBlocks(blocks: EditorBlock[]) {
  return blocks.filter((block) => {
    const values = Object.values(block.props ?? {});
    return values.some((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return value !== 0;
      if (typeof value === "boolean") return value === true;
      return false;
    });
  }).length;
}

function runBlockLevelValidation(
  template: TemplateRecord,
  sourceData: unknown,
  mode: ValidationRunMode,
  rootPathSet: Set<string>,
) {
  const issues: TemplateValidationIssue[] = [];

  for (const block of template.blocks) {
    const label = getBlockLabel(block.type, block.name);

    // Registry-first block validation.
    const registryIssues = validateBlockWithDefinition(block, sourceData);
    for (const issue of registryIssues) {
      pushIssue(issues, {
        level: issue.level,
        scope: "block",
        code: issue.code,
        title: issue.blockLabel,
        message: issue.message,
        blockId: issue.blockId,
        blockType: issue.blockType,
        blockLabel: issue.blockLabel,
      });
    }

    const fields = getBlockFields(block);
    const fieldMap = new Map(fields.map((field) => [field.key, field]));

    // Unsupported/invalid prop values using field schema hints.
    for (const field of fields) {
      const value = block.props[field.key];

      if (
        field.type === "select" &&
        typeof value === "string" &&
        field.options?.length
      ) {
        if (!field.options.some((option) => option.value === value)) {
          pushIssue(issues, {
            level: "warning",
            scope: "block",
            code: "field.select.invalid",
            title: label,
            message: `${field.label} alanindaki deger desteklenmiyor (${value}).`,
            blockId: block.id,
            blockType: block.type,
            blockLabel: label,
          });
        }
      }

      if (field.type === "number") {
        if (value !== undefined && typeof value !== "number") {
          pushIssue(issues, {
            level: "warning",
            scope: "block",
            code: "field.number.invalid-type",
            title: label,
            message: `${field.label} alaninin sayi olmasi gerekiyor.`,
            blockId: block.id,
            blockType: block.type,
            blockLabel: label,
          });
        }

        if (typeof value === "number") {
          if (field.min !== undefined && value < field.min) {
            pushIssue(issues, {
              level: "warning",
              scope: "block",
              code: "field.number.lt-min",
              title: label,
              message: `${field.label} degeri minimum sinirin altinda (${field.min}).`,
              blockId: block.id,
              blockType: block.type,
              blockLabel: label,
            });
          }
          if (field.max !== undefined && value > field.max) {
            pushIssue(issues, {
              level: "warning",
              scope: "block",
              code: "field.number.gt-max",
              title: label,
              message: `${field.label} degeri maksimum siniri asiyor (${field.max}).`,
              blockId: block.id,
              blockType: block.type,
              blockLabel: label,
            });
          }
        }
      }
    }

    // Binding schema checks.
    const hasRepeater = Boolean(block.repeater?.sourcePath);
    const itemPathSet = new Set(
      hasRepeater
        ? getRepeaterItemOptions(
            sourceData,
            String(block.repeater?.sourcePath),
          ).map((option) => option.path)
        : [],
    );

    for (const [fieldKey, binding] of Object.entries(block.bindings ?? {})) {
      const field = fieldMap.get(fieldKey);
      if (!field) {
        pushIssue(issues, {
          level: "warning",
          scope: "block",
          code: "binding.field.missing",
          title: label,
          message: `${fieldKey} baglantisi blok alanlarinda tanimli degil.`,
          blockId: block.id,
          blockType: block.type,
          blockLabel: label,
        });
        continue;
      }

      if (field.bindingTarget && binding.target !== field.bindingTarget) {
        pushIssue(issues, {
          level: "warning",
          scope: "block",
          code: "binding.target.mismatch",
          title: label,
          message: `${field.label} baglantisinin hedef tipi uyumsuz.`,
          blockId: block.id,
          blockType: block.type,
          blockLabel: label,
        });
      }

      for (const segment of binding.segments) {
        if (segment.kind !== "path") continue;
        const path = segment.path;

        if (segment.scope === "root") {
          if (!hasPathInSet(path, rootPathSet)) {
            pushIssue(issues, {
              level: mode === "publish" ? "error" : "warning",
              scope: "block",
              code: "binding.path.unresolved",
              title: label,
              message: `${field.label} alaninda cozumlenemeyen baglanti yolu: ${path}`,
              blockId: block.id,
              blockType: block.type,
              blockLabel: label,
            });
          }
          continue;
        }

        if (!hasRepeater) {
          pushIssue(issues, {
            level: "error",
            scope: "block",
            code: "binding.item.without-repeater",
            title: label,
            message: `${field.label} alaninda item baglantisi var ancak repeater kaynagi tanimli degil.`,
            blockId: block.id,
            blockType: block.type,
            blockLabel: label,
          });
          continue;
        }

        if (!itemPathSet.has(path)) {
          pushIssue(issues, {
            level: mode === "publish" ? "error" : "warning",
            scope: "block",
            code: "binding.item-path.unresolved",
            title: label,
            message: `${field.label} alaninda item baglanti yolu gecersiz: ${path}`,
            blockId: block.id,
            blockType: block.type,
            blockLabel: label,
          });
        }
      }
    }

    if (block.repeater) {
      const sourcePath = String(block.repeater.sourcePath ?? "").trim();
      if (!sourcePath) {
        pushIssue(issues, {
          level: "error",
          scope: "block",
          code: "repeater.source.empty",
          title: label,
          message: "Repeater kaynak yolu bos.",
          blockId: block.id,
          blockType: block.type,
          blockLabel: label,
        });
      } else {
        const sourceValue = getValueAtPath(sourceData, sourcePath);
        if (!Array.isArray(sourceValue)) {
          pushIssue(issues, {
            level: "error",
            scope: "block",
            code: "repeater.source.not-array",
            title: label,
            message: `Repeater kaynagi dizi degil: ${sourcePath}`,
            blockId: block.id,
            blockType: block.type,
            blockLabel: label,
          });
        } else if (sourceValue.length === 0) {
          pushIssue(issues, {
            level: "info",
            scope: "block",
            code: "repeater.source.empty-array",
            title: label,
            message: `Repeater kaynaginda veri yok: ${sourcePath}`,
            blockId: block.id,
            blockType: block.type,
            blockLabel: label,
          });
        }
      }
    }

    // Content-quality focused lightweight checks.
    if (block.type === "cta") {
      const labelValue = String(block.props.label ?? "").trim();
      if (labelValue && labelValue.length < 3) {
        pushIssue(issues, {
          level: "warning",
          scope: "block",
          code: "cta.label.too-short",
          title: label,
          message: "CTA metni cok kisa, daha acik bir eylem metni onerilir.",
          blockId: block.id,
          blockType: block.type,
          blockLabel: label,
        });
      }
    }

    if (block.type === "image") {
      const width =
        typeof block.props.width === "number" ? block.props.width : 0;
      if (width > 1200) {
        pushIssue(issues, {
          level: "warning",
          scope: "block",
          code: "image.width.too-large",
          title: label,
          message:
            "Gorsel genisligi cok yuksek, e-posta istemcilerinde tasma yapabilir.",
          blockId: block.id,
          blockType: block.type,
          blockLabel: label,
        });
      }
    }

    if (block.type === "customHtml") {
      const html = String(block.props.html ?? "");
      if (/<script[\s>]/i.test(html)) {
        pushIssue(issues, {
          level: "error",
          scope: "block",
          code: "customHtml.script",
          title: label,
          message: "Custom HTML icinde script etiketi var.",
          blockId: block.id,
          blockType: block.type,
          blockLabel: label,
        });
      }

      if (/<iframe[\s>]/i.test(html)) {
        pushIssue(issues, {
          level: "warning",
          scope: "block",
          code: "customHtml.iframe",
          title: label,
          message: "Custom HTML icinde iframe etiketi var.",
          blockId: block.id,
          blockType: block.type,
          blockLabel: label,
        });
      }

      const sanitized = sanitizeCustomHtmlForApp(html);
      if (sanitized !== html) {
        pushIssue(issues, {
          level: "warning",
          scope: "block",
          code: "customHtml.sanitized",
          title: label,
          message: "Custom HTML guvenlik filtreleri tarafindan degistirildi.",
          blockId: block.id,
          blockType: block.type,
          blockLabel: label,
        });
      }
    }
  }

  return issues;
}

function runDocumentLevelValidation(
  template: TemplateRecord,
  sourceData: unknown,
  mode: ValidationRunMode,
  rootPathSet: Set<string>,
) {
  const issues: TemplateValidationIssue[] = [];

  if (template.blocks.length === 0) {
    pushIssue(issues, {
      level: "error",
      scope: "document",
      code: "document.blocks.empty",
      title: "Bos template",
      message: "Template en az bir blok icermelidir.",
    });
    return issues;
  }

  const subject = template.subject.trim();
  if (!subject) {
    pushIssue(issues, {
      level: "error",
      scope: "document",
      code: "document.subject.empty",
      title: "Subject eksik",
      message: "Yayinlamak icin konu satiri zorunludur.",
    });
  } else if (subject.length < 6) {
    pushIssue(issues, {
      level: "warning",
      scope: "document",
      code: "document.subject.short",
      title: "Subject kisa",
      message: "Konu satiri cok kisa, acik bir subject kullanin.",
    });
  }

  if (countMeaningfulBlocks(template.blocks) === 0) {
    pushIssue(issues, {
      level: "error",
      scope: "document",
      code: "document.meaningful.empty",
      title: "Icerik eksik",
      message: "Template anlamli bir icerik icermiyor.",
    });
  }

  const hasFooter = template.blocks.some((block) => block.type === "footer");
  if (!hasFooter) {
    pushIssue(issues, {
      level: "info",
      scope: "document",
      code: "document.footer.missing",
      title: "Footer onerisi",
      message: "Spam uyumlulugu icin footer blogu eklenmesi onerilir.",
    });
  }

  for (const block of template.blocks) {
    if (block.type === "customHtml") {
      const html = String(block.props.html ?? "");
      if (!html.trim()) {
        pushIssue(issues, {
          level: "warning",
          scope: "document",
          code: "document.customHtml.empty",
          title: "Custom HTML bos",
          message: `${getBlockLabel(block.type, block.name)} bos icerige sahip.`,
          blockId: block.id,
          blockType: block.type,
          blockLabel: getBlockLabel(block.type, block.name),
        });
      }

      if (mode === "publish") {
        const occurrences = extractHtmlVarOccurrences(html);
        for (const occurrence of occurrences) {
          if (occurrence.kind !== "variable") continue;

          const path =
            occurrence.scope === "loop"
              ? occurrence.resolvedSourcePath
              : occurrence.path;

          if (!path || !hasPathInSet(path, rootPathSet)) {
            pushIssue(issues, {
              level: "error",
              scope: "document",
              code: "document.customHtml.variable.unresolved",
              title: "Cozumlenemeyen token",
              message: `Custom HTML icinde cozumlenemeyen token var: ${occurrence.path}`,
              blockId: block.id,
              blockType: block.type,
              blockLabel: getBlockLabel(block.type, block.name),
            });
          }
        }
      }

      if (/<a\b[^>]*>\s*<\/a>/i.test(html)) {
        pushIssue(issues, {
          level: "warning",
          scope: "document",
          code: "document.link.empty-text",
          title: "Bos link metni",
          message: "Custom HTML icinde bos link metni tespit edildi.",
          blockId: block.id,
          blockType: block.type,
          blockLabel: getBlockLabel(block.type, block.name),
        });
      }
    }

    // Very long raw text values can hurt readability and email clipping.
    const longestText = Object.values(block.props).reduce<number>(
      (max, value) => {
        if (typeof value !== "string") return max;
        return Math.max(max, value.trim().length);
      },
      0,
    );

    if (longestText > 1800) {
      pushIssue(issues, {
        level: "info",
        scope: "document",
        code: "document.text.too-long",
        title: "Uzun icerik",
        message: `${getBlockLabel(block.type, block.name)} blogunda cok uzun metin var.`,
        blockId: block.id,
        blockType: block.type,
        blockLabel: getBlockLabel(block.type, block.name),
      });
    }
  }

  // Light responsive/print hints.
  if (
    template.blocks.some(
      (block) => block.type === "image" && Number(block.props.width ?? 0) > 900,
    )
  ) {
    pushIssue(issues, {
      level: "warning",
      scope: "document",
      code: "document.mobile.image-width",
      title: "Mobil uyumluluk",
      message: "Genis gorseller mobil modda tasma riski olusturabilir.",
    });
  }

  if (
    template.blocks.some(
      (block) =>
        block.type === "customHtml" &&
        /position\s*:\s*fixed/i.test(String(block.props.html ?? "")),
    )
  ) {
    pushIssue(issues, {
      level: "info",
      scope: "document",
      code: "document.print.fixed-position",
      title: "Print uyumluluk",
      message:
        "position:fixed kullanan custom HTML print modunda farkli davranabilir.",
    });
  }

  if (sourceData == null) {
    pushIssue(issues, {
      level: "warning",
      scope: "document",
      code: "document.source.missing",
      title: "Kaynak veri eksik",
      message: "Veri kaynagi olmadan baglantilarin dogrulanmasi kisitli kalir.",
    });
  }

  const tallSpacerCount = template.blocks.filter(
    (block) =>
      block.type === "spacer" &&
      typeof block.props.height === "number" &&
      block.props.height > 100,
  ).length;
  if (tallSpacerCount > 0) {
    pushIssue(issues, {
      level: "info",
      scope: "document",
      code: "document.spacer.tall",
      title: "Buyuk spacer kullanimi",
      message: `${tallSpacerCount} spacer blogu 100px ustunde. Bazi istemcilerde kirpilabilir.`,
    });
  }

  if (template.blocks.length > 20) {
    pushIssue(issues, {
      level: "info",
      scope: "document",
      code: "document.block-count.high",
      title: "Yuksek blok sayisi",
      message: `${template.blocks.length} blok tespit edildi. E-posta boyutu artabilir.`,
    });
  }

  return issues;
}

export function runTemplateValidation(
  template: TemplateRecord,
  sourceData: unknown,
  mode: ValidationRunMode = "live",
): TemplateValidationResult {
  const rootPathSet = new Set(
    getBindingPathOptions(sourceData).map((option) => option.path),
  );

  const blockIssues = runBlockLevelValidation(
    template,
    sourceData,
    mode,
    rootPathSet,
  );
  const documentIssues = runDocumentLevelValidation(
    template,
    sourceData,
    mode,
    rootPathSet,
  );

  const issues = dedupeIssues([...blockIssues, ...documentIssues]).sort(
    (a, b) => {
      const levelDelta = severityRank(a.level) - severityRank(b.level);
      if (levelDelta !== 0) return levelDelta;
      if ((a.scope === "document") !== (b.scope === "document")) {
        return a.scope === "document" ? -1 : 1;
      }
      return a.title.localeCompare(b.title, "tr-TR");
    },
  );

  const counts = {
    error: issues.filter((issue) => issue.level === "error").length,
    warning: issues.filter((issue) => issue.level === "warning").length,
    info: issues.filter((issue) => issue.level === "info").length,
  };

  return {
    mode,
    issues,
    blockIssues: issues.filter((issue) => issue.scope === "block"),
    documentIssues: issues.filter((issue) => issue.scope === "document"),
    counts,
    hasBlockingErrors: counts.error > 0,
  };
}
