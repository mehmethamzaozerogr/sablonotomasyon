import type {
  BlockFieldDefinition,
  BlockPreset,
  BlockType,
  EditorBlock,
} from "@/types/template";
import type { TemplateCategory } from "@/types/template";
import type { AnyBlockDefinition } from "@/lib/blocks/types";
import { ctaBlockDefinition } from "@/lib/blocks/definitions/cta";
import { heroBlockDefinition } from "@/lib/blocks/definitions/hero";
import { imageBlockDefinition } from "@/lib/blocks/definitions/image";
import { richTextBlockDefinition } from "@/lib/blocks/definitions/rich-text";

const blockRegistry: Partial<Record<BlockType, AnyBlockDefinition>> = {
  cta: ctaBlockDefinition as unknown as AnyBlockDefinition,
  hero: heroBlockDefinition as unknown as AnyBlockDefinition,
  image: imageBlockDefinition as unknown as AnyBlockDefinition,
  richText: richTextBlockDefinition as unknown as AnyBlockDefinition,
};

export function getBlockDefinition(type: BlockType) {
  return blockRegistry[type];
}

export function getRegisteredBlockTypes() {
  return Object.keys(blockRegistry) as BlockType[];
}

export function getBlockLabel(type: BlockType, fallback?: string) {
  return getBlockDefinition(type)?.label ?? fallback ?? type;
}

export function getBlockDescription(type: BlockType, fallback?: string) {
  return getBlockDefinition(type)?.description ?? fallback ?? "";
}

export function getBlockFields(
  block: Pick<EditorBlock, "type" | "fields">,
): BlockFieldDefinition[] {
  return getBlockDefinition(block.type)?.fields ?? block.fields ?? [];
}

export function getBlockPresetFromDefinition(
  type: BlockType,
  accent = "from-slate-500/25 to-transparent",
): BlockPreset | null {
  const definition = getBlockDefinition(type);
  if (!definition) return null;

  return {
    type: definition.type,
    name: definition.label,
    description: definition.description,
    fields: definition.fields.map((field) => ({ ...field })),
    props: { ...definition.defaultProps },
    categories: [...definition.categories],
    accent,
    bindings: {},
    repeater: null,
  };
}

export function isCategoryAllowed(
  type: BlockType,
  category: TemplateCategory,
  fallbackCategories?: Array<TemplateCategory | "shared">,
) {
  const categories =
    getBlockDefinition(type)?.categories ?? fallbackCategories ?? [];
  return categories.includes("shared") || categories.includes(category);
}
