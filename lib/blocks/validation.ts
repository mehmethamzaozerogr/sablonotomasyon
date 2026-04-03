import { getBlockDefinition, getBlockLabel } from "@/lib/blocks/registry";
import type { BlockValidationIssue } from "@/lib/blocks/types";
import type { EditorBlock } from "@/types/template";

export type BlockValidationResult = BlockValidationIssue & {
  blockId: string;
  blockType: EditorBlock["type"];
  blockLabel: string;
};

export function validateBlockWithDefinition(
  block: EditorBlock,
  sourceData?: unknown,
): BlockValidationResult[] {
  const definition = getBlockDefinition(block.type);
  if (!definition?.validate) {
    return [];
  }

  return definition.validate({
    block,
    sourceData,
  }).map((issue) => ({
    ...issue,
    blockId: block.id,
    blockType: block.type,
    blockLabel: getBlockLabel(block.type, block.name),
  }));
}

export function validateBlocksWithDefinitions(
  blocks: EditorBlock[],
  sourceData?: unknown,
) {
  return blocks.flatMap((block) => validateBlockWithDefinition(block, sourceData));
}
