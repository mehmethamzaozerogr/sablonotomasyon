import { getBlockLabel } from "@/lib/blocks/registry";
import { extractHtmlVarOccurrences } from "@/lib/bindings/html-vars";
import { ensureTemplateDesignSystem } from "@/lib/editor/template-design";
import { getCustomHtmlTextRegionsWithFallback } from "@/lib/editor/custom-html-text";
import {
  detectTemplateSectionInfo,
  type DetectedSectionRole,
} from "@/lib/editor/template-section-detection";
import { sanitizeCustomHtmlForApp } from "@/lib/security/sanitize-custom-html";
import type { EditorSelection } from "@/stores/editor-store";
import type { EditorBlock, TemplateDesignSystem, TemplateRecord } from "@/types/template";

export type TemplateStructureSelection =
  | { kind: "block"; blockId: string }
  | { kind: "region"; blockId: string; regionId: string };

export type TemplateStructureNode = {
  id: string;
  label: string;
  description: string;
  kind: "template" | "block" | "region";
  role: DetectedSectionRole | "content";
  blockId?: string;
  regionId?: string;
  badges: string[];
  searchableText: string;
  children: TemplateStructureNode[];
};

export type TemplateEditorAnalysis = {
  designSystem: TemplateDesignSystem;
  structure: TemplateStructureNode;
  blockIndex: Record<string, TemplateStructureNode>;
  summary: {
    blocks: number;
    editableRegions: number;
    variables: number;
    repeaters: number;
    conditionals: number;
  };
};

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function getBlockRole(block: EditorBlock): DetectedSectionRole | "content" {
  if (block.type === "customHtml") {
    const info = detectTemplateSectionInfo(String(block.props["html"] ?? ""));
    return info.role;
  }

  if (block.type === "hero") return "hero";
  if (block.type === "cta") return "cta";
  if (block.type === "footer") return "footer";
  if (block.type === "lineItems" || block.type === "productCard") return "products";
  if (block.type === "summary" || block.type === "totals" || block.type === "orderSummary") {
    return "summary";
  }
  if (block.type === "address") return "address";
  if (block.type === "supportSection") return "support";
  if (block.type === "shippingInfo" || block.type === "trackingTimeline") return "tracking";
  if (block.type === "paymentInfo" || block.type === "invoiceSummary") return "payment";
  if (block.type === "status") return "status";
  return "content";
}

function getBlockDescription(block: EditorBlock) {
  if (block.type === "customHtml") {
    return detectTemplateSectionInfo(String(block.props["html"] ?? "")).description;
  }

  return block.description ?? "Editable block in the template flow.";
}

function getBlockBadges(block: EditorBlock) {
  const badges: string[] = [];
  if (block.type === "customHtml") {
    const html = String(block.props["html"] ?? "");
    const occurrences = extractHtmlVarOccurrences(html);
    const variableCount = occurrences.filter((entry) => entry.kind === "variable").length;
    const logicCount = occurrences.length - variableCount;

    if (variableCount) badges.push(`${variableCount} vars`);
    if (logicCount) badges.push(`${logicCount} logic`);
  }

  if (block.repeater?.sourcePath) {
    badges.push("repeater");
  }

  if (block.bindings && Object.keys(block.bindings).length) {
    badges.push(`${Object.keys(block.bindings).length} bindings`);
  }

  return badges;
}

function buildRegionNodes(block: EditorBlock): TemplateStructureNode[] {
  if (block.type !== "customHtml") {
    return [];
  }

  const rawHtml = String(block.props["html"] ?? "");
  const rowMode = String(block.props["htmlSectionKind"] ?? "") === "tbody-row";
  const regions = getCustomHtmlTextRegionsWithFallback(
    sanitizeCustomHtmlForApp(rawHtml),
    rawHtml,
    rowMode,
  );

  return regions.map((region) => ({
    id: `${block.id}:${region.id}`,
    label: region.label,
    description: region.textPreview || "Editable region",
    kind: "region",
    role: "content",
    blockId: block.id,
    regionId: region.id,
    badges: unique([
      region.href !== null ? "link" : null,
      region.readonly ? "readonly" : null,
      region.supportsStructuredEditing ? "inline" : "nested",
      region.segments.some((segment) => segment.type === "variable") ? "variables" : null,
    ]),
    searchableText: `${region.label} ${region.textPreview} ${region.tagName}`.toLowerCase(),
    children: [],
  }));
}

function buildBlockNode(block: EditorBlock): TemplateStructureNode {
  const blockLabel =
    block.type === "customHtml"
      ? detectTemplateSectionInfo(String(block.props["html"] ?? "")).label
      : getBlockLabel(block.type, block.name);

  const children = buildRegionNodes(block);

  return {
    id: block.id,
    label: blockLabel,
    description: getBlockDescription(block),
    kind: "block",
    role: getBlockRole(block),
    blockId: block.id,
    badges: unique([
      ...getBlockBadges(block),
      children.length ? `${children.length} regions` : null,
    ]),
    searchableText: `${blockLabel} ${getBlockDescription(block)} ${block.type} ${children
      .map((child) => child.searchableText)
      .join(" ")}`.toLowerCase(),
    children,
  };
}

function indexNodes(
  node: TemplateStructureNode,
  index: Record<string, TemplateStructureNode>,
) {
  index[node.id] = node;
  for (const child of node.children) {
    indexNodes(child, index);
  }
}

export function analyzeTemplateStructure(template: TemplateRecord): TemplateEditorAnalysis {
  const children = template.blocks.map(buildBlockNode);
  const blockIndex: Record<string, TemplateStructureNode> = {};
  const root: TemplateStructureNode = {
    id: template.id,
    label: template.name,
    description: "Shared template source of truth with structure, settings, and dynamic content.",
    kind: "template",
    role: "content",
    badges: [
      `${template.blocks.length} blocks`,
      `${children.reduce((count, child) => count + child.children.length, 0)} regions`,
    ],
    searchableText: `${template.name} ${template.description}`.toLowerCase(),
    children,
  };

  indexNodes(root, blockIndex);

  const summary = template.blocks.reduce(
    (acc, block) => {
      acc.blocks += 1;
      if (block.type === "customHtml") {
        const html = String(block.props["html"] ?? "");
        const rowMode = String(block.props["htmlSectionKind"] ?? "") === "tbody-row";
        const regions = getCustomHtmlTextRegionsWithFallback(
          sanitizeCustomHtmlForApp(html),
          html,
          rowMode,
        );
        const occurrences = extractHtmlVarOccurrences(html);
        acc.editableRegions += regions.length;
        acc.variables += occurrences.filter((entry) => entry.kind === "variable").length;
        acc.conditionals += occurrences.filter((entry) =>
          entry.kind === "if" || entry.kind === "elseif" || entry.kind === "else" || entry.kind === "end",
        ).length;
        acc.repeaters += occurrences.filter((entry) => entry.kind === "for").length;
      }

      if (block.repeater?.sourcePath) {
        acc.repeaters += 1;
      }

      return acc;
    },
    {
      blocks: 0,
      editableRegions: 0,
      variables: 0,
      repeaters: 0,
      conditionals: 0,
    },
  );

  return {
    designSystem: ensureTemplateDesignSystem(template),
    structure: root,
    blockIndex,
    summary,
  };
}

export function getSelectionBreadcrumbs(
  analysis: TemplateEditorAnalysis,
  selection: EditorSelection,
) {
  const labels = [analysis.structure.label];

  if (selection.kind === "none") {
    return labels;
  }

  const blockNode = analysis.blockIndex[selection.blockId];
  if (blockNode) {
    labels.push(blockNode.label);
  }

  if (selection.kind === "region") {
    const regionNode = blockNode?.children.find((entry) => entry.regionId === selection.regionId);
    if (regionNode) {
      labels.push(regionNode.label);
    }
  }

  if (selection.kind === "token") {
    labels.push("Variable Token");
  }

  return labels;
}
