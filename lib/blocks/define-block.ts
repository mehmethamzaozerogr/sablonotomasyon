import type { BlockDefinition, BlockInstance } from "@/lib/blocks/types";
import type { BlockType, EditorBlock } from "@/types/template";

export function defineBlock<TType extends BlockType>(definition: BlockDefinition<TType>) {
  return definition;
}

export function createBlockInstanceFromDefinition<TType extends BlockType>(
  definition: BlockDefinition<TType>,
  id: string,
  overrides: Partial<EditorBlock["props"]> = {},
): BlockInstance<TType> {
  const props = { ...definition.defaultProps };

  Object.entries(overrides).forEach(([key, value]) => {
    if (value !== undefined) {
      props[key] = value;
    }
  });

  return {
    id,
    type: definition.type,
    props,
    bindings: {},
    repeater: null,
    children: [],
  };
}
