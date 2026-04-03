import type { ReactNode } from "react";

import type {
  BlockFieldDefinition,
  BlockType,
  BlockValue,
  EditorBlock,
  TemplateCategory,
} from "@/types/template";
import type { BlockFieldBinding, RepeaterBinding } from "@/types/binding";
import type { HtmlVarOccurrence } from "@/lib/bindings/html-vars";
import type {
  CanvasOccurrencePickerOverlay,
  CanvasToolbarOverlay,
} from "@/lib/editor/canvas-overlay";
import type { HtmlTextRegion } from "@/lib/editor/custom-html-text";

export type BlockInstance<TType extends BlockType = BlockType> = {
  id: string;
  type: TType;
  props: Record<string, BlockValue>;
  bindings?: Record<string, BlockFieldBinding>;
  repeater?: RepeaterBinding | null;
  children?: EditorBlock[];
};

export type BlockValidationIssue = {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
};

export type BlockNestingRule = {
  acceptsChildren: boolean;
  allowedChildren?: BlockType[];
  allowedParents?: BlockType[];
  maxChildren?: number;
};

export type BlockRenderContext<TType extends BlockType = BlockType> = {
  block: EditorBlock & { type: TType };
  sourceData: unknown;
  variant?: "canvas" | "preview";
  editorMode?: "select" | "edit-content" | "edit-style";
  activeHtmlOccurrenceId?: string | null;
  activeTextRegionId?: string | null;
  onSelectHtmlOccurrence?: (occurrence: HtmlVarOccurrence) => void;
  onReplaceHtmlOccurrence?: (occurrenceId: string, newPath: string) => void;
  onSelectTextRegion?: (region: HtmlTextRegion) => void;
  onEditTextRegion?: (region: HtmlTextRegion) => void;
  onInsertVariable?: (path: string) => void;
  onStyleTextRegion?: (region: HtmlTextRegion) => void;
  onToolbarOverlayChange?: (overlay: CanvasToolbarOverlay | null) => void;
  onOccurrencePickerOverlayChange?: (overlay: CanvasOccurrencePickerOverlay | null) => void;
};

export type BlockCompileContext<TType extends BlockType = BlockType> = {
  block: EditorBlock & { type: TType };
  sourceData: unknown;
};

export type BlockValidateContext<TType extends BlockType = BlockType> = {
  block: EditorBlock & { type: TType };
  sourceData?: unknown;
};

export type BlockDefinition<TType extends BlockType = BlockType> = {
  type: TType;
  label: string;
  description: string;
  icon: (props: { className?: string }) => ReactNode;
  categories: Array<TemplateCategory | "shared">;
  defaultProps: Record<string, BlockValue>;
  fields: BlockFieldDefinition[];
  render?: (context: BlockRenderContext<TType>) => ReactNode;
  compile?: (context: BlockCompileContext<TType>) => string;
  validate?: (context: BlockValidateContext<TType>) => BlockValidationIssue[];
  nesting: BlockNestingRule;
};

export type AnyBlockDefinition = BlockDefinition<BlockType>;
