"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import { BlockActionRail } from "@/components/editor/block-action-rail";
import { BlockIcon } from "@/components/editor/block-icon";
import { TemplateBlockRenderer } from "@/components/editor/template-block-renderer";
import { getBlockLabel } from "@/lib/blocks/registry";
import type { HtmlVarOccurrence } from "@/lib/bindings/html-vars";
import type {
  CanvasOccurrencePickerOverlay,
  CanvasToolbarOverlay,
} from "@/lib/editor/canvas-overlay";
import type { HtmlTextRegion } from "@/lib/editor/custom-html-text";
import type { EditorMode } from "@/stores/editor-store";
import type { EditorBlock } from "@/types/template";
import { cn } from "@/lib/utils";

type CanvasBlockProps = {
  block: EditorBlock;
  sourceData: unknown;
  selected: boolean;
  editorMode: EditorMode;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (blockId: string) => void;
  onRemove: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  activeHtmlOccurrenceId?: string | null;
  activeTextRegionId?: string | null;
  onSelectHtmlOccurrence: (occurrence: HtmlVarOccurrence) => void;
  onReplaceHtmlOccurrence: (occurrenceId: string, newPath: string) => void;
  onSelectTextRegion: (region: HtmlTextRegion) => void;
  onEditTextRegion: (region: HtmlTextRegion) => void;
  onInsertVariable: (path: string) => void;
  onStyleTextRegion: (region: HtmlTextRegion) => void;
  onInlineEdit?: (blockId: string, key: string, value: string) => void;
  onToolbarOverlayChange?: (overlay: CanvasToolbarOverlay | null) => void;
  onOccurrencePickerOverlayChange?: (
    overlay: CanvasOccurrencePickerOverlay | null,
  ) => void;
};

const INLINE_EDIT_PRIORITY_KEYS = [
  "headline",
  "body",
  "label",
  "orderNumber",
  "orderDate",
  "invoiceNumber",
  "invoiceDate",
  "dueDate",
  "customerName",
  "status",
  "carrier",
  "trackingNumber",
  "estimatedDelivery",
  "rmaNumber",
  "reason",
  "details",
  "promoCode",
  "productName",
  "price",
  "ctaLabel",
  "companyName",
  "address",
  "unsubscribeText",
  "note",
  "step1",
  "step2",
  "step3",
];

function resolveInlineEditableField(block: EditorBlock) {
  for (const key of INLINE_EDIT_PRIORITY_KEYS) {
    const value = block.props[key];
    if (typeof value === "string") {
      return {
        key,
        multiline:
          key === "body" ||
          key === "details" ||
          key === "note" ||
          key.startsWith("step"),
      };
    }
  }

  const firstTextProp = Object.entries(block.props).find(
    ([, value]) => typeof value === "string",
  );
  if (!firstTextProp) {
    return null;
  }

  return {
    key: firstTextProp[0],
    multiline: firstTextProp[0].includes("body"),
  };
}

export const CanvasBlock = memo(function CanvasBlock({
  block,
  sourceData,
  selected,
  editorMode,
  isFirst,
  isLast,
  onSelect,
  onRemove,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  activeHtmlOccurrenceId,
  activeTextRegionId,
  onSelectHtmlOccurrence,
  onReplaceHtmlOccurrence,
  onSelectTextRegion,
  onEditTextRegion,
  onInsertVariable,
  onStyleTextRegion,
  onInlineEdit,
  onToolbarOverlayChange,
  onOccurrencePickerOverlayChange,
}: CanvasBlockProps) {
  const blockLabel = getBlockLabel(block.type, block.name);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { origin: "canvas", blockId: block.id },
  });

  const [hovered, setHovered] = useState(false);
  const [inlineDraft, setInlineDraft] = useState<string>("");
  const [inlineEditingKey, setInlineEditingKey] = useState<string | null>(null);
  const inlineEditorRef = useRef<HTMLDivElement | null>(null);

  const inlineEditableField = useMemo(
    () =>
      block.type === "customHtml" ? null : resolveInlineEditableField(block),
    [block],
  );
  const isInlineEditing = inlineEditingKey !== null;

  useEffect(() => {
    if (inlineEditingKey) {
      return;
    }
    setInlineDraft("");
  }, [inlineEditingKey]);

  useEffect(() => {
    if (!selected && inlineEditingKey) {
      setInlineEditingKey(null);
      setInlineDraft("");
    }
  }, [inlineEditingKey, selected]);

  const commitInlineEdit = () => {
    if (!inlineEditingKey) return;
    onInlineEdit?.(block.id, inlineEditingKey, inlineDraft);
    setInlineEditingKey(null);
  };

  const cancelInlineEdit = () => {
    setInlineEditingKey(null);
    setInlineDraft("");
  };

  const hasRegionSelection = Boolean(activeTextRegionId);
  const suppressBlockChrome = hasRegionSelection || editorMode !== "select";
  const showHeader = !suppressBlockChrome && (selected || hovered);
  const compactControls = blockLabel.length > 24;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/block relative transition-all duration-150",
        selected &&
          !hasRegionSelection &&
          "z-10 rounded-lg outline outline-2 outline-primary/40 outline-offset-2",
        selected &&
          hasRegionSelection &&
          "z-10 rounded-lg outline outline-1 outline-slate-300/60 outline-offset-1",
        !selected &&
          hovered &&
          !suppressBlockChrome &&
          "rounded-lg outline outline-1 outline-slate-200/80 outline-offset-1",
        isDragging && "opacity-40",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("[data-inline-editor]")) {
          return;
        }
        onSelect(block.id);
      }}
      onDoubleClick={(event) => {
        if (!inlineEditableField || block.type === "customHtml") {
          return;
        }

        if ((event.target as HTMLElement).closest("[data-inline-editor]")) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onSelect(block.id);
        setInlineEditingKey(inlineEditableField.key);
        setInlineDraft(String(block.props[inlineEditableField.key] ?? ""));
      }}
    >
      {isInlineEditing && inlineEditingKey ? (
        <div
          ref={inlineEditorRef}
          data-inline-editor
          className="absolute inset-x-4 top-2 z-20 rounded-xl border border-sky-200 bg-white p-3 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.5)]"
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
          onBlurCapture={(event) => {
            const nextTarget = event.relatedTarget as HTMLElement | null;
            if (nextTarget && event.currentTarget.contains(nextTarget)) {
              return;
            }
            commitInlineEdit();
          }}
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Inline Edit | {inlineEditingKey}
          </p>
          {inlineEditableField?.multiline ? (
            <textarea
              autoFocus
              value={inlineDraft}
              onChange={(event) => setInlineDraft(event.target.value)}
              className="min-h-[84px] w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelInlineEdit();
                  return;
                }
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  commitInlineEdit();
                }
              }}
            />
          ) : (
            <input
              autoFocus
              value={inlineDraft}
              onChange={(event) => setInlineDraft(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelInlineEdit();
                  return;
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitInlineEdit();
                }
              }}
            />
          )}
          <p className="mt-2 text-[10px] text-slate-500">
            Enter to save | Esc to cancel
          </p>
        </div>
      ) : null}

      {showHeader ? (
        <div className="absolute -top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
          <div
            className={cn(
              "pointer-events-auto inline-flex min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium shadow-sm backdrop-blur-sm",
              selected
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-slate-200 bg-white/95 text-slate-500",
            )}
          >
            <BlockIcon type={block.type} className="h-3 w-3" />
            <span className="max-w-[180px] truncate">{blockLabel}</span>
          </div>

          <div className="pointer-events-auto shrink-0">
            <BlockActionRail
              visible
              compact={compactControls}
              isFirst={isFirst}
              isLast={isLast}
              onMoveUp={() => onMoveUp(block.id)}
              onMoveDown={() => onMoveDown(block.id)}
              onDuplicate={() => onDuplicate(block.id)}
              onRemove={() => onRemove(block.id)}
              dragAttributes={attributes as unknown as Record<string, unknown>}
              dragListeners={listeners as unknown as Record<string, unknown>}
            />
          </div>
        </div>
      ) : null}

      <div>
        <TemplateBlockRenderer
          block={block}
          sourceData={sourceData}
          variant="canvas"
          editorMode={editorMode}
          activeHtmlOccurrenceId={activeHtmlOccurrenceId}
          activeTextRegionId={activeTextRegionId}
          onSelectHtmlOccurrence={onSelectHtmlOccurrence}
          onReplaceHtmlOccurrence={onReplaceHtmlOccurrence}
          onSelectTextRegion={onSelectTextRegion}
          onEditTextRegion={onEditTextRegion}
          onInsertVariable={onInsertVariable}
          onStyleTextRegion={onStyleTextRegion}
          onToolbarOverlayChange={onToolbarOverlayChange}
          onOccurrencePickerOverlayChange={onOccurrencePickerOverlayChange}
        />
      </div>
    </div>
  );
});
