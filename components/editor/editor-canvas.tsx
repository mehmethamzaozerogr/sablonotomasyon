"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Layers, MousePointer2, Sparkles } from "lucide-react";

import { CanvasBlock } from "@/components/editor/canvas-block";
import { HtmlVarPicker } from "@/components/editor/html-var-picker";
import type { HtmlVarOccurrence } from "@/lib/bindings/html-vars";
import type {
  CanvasOccurrencePickerOverlay,
  CanvasToolbarOverlay,
} from "@/lib/editor/canvas-overlay";
import type { HtmlTextRegion } from "@/lib/editor/custom-html-text";
import type { EditorMode } from "@/stores/editor-store";
import type { EditorBlock } from "@/types/template";
import { cn } from "@/lib/utils";

type InsertionGapProps = { index: number; active: boolean };

type EditorCanvasProps = {
  blocks: EditorBlock[];
  sourceData: unknown;
  selectedBlockId: string | null;
  editorMode: EditorMode;
  isLibraryDragActive: boolean;
  onSelect: (blockId: string) => void;
  onRemove: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
  onMoveUp: (blockId: string) => void;
  onMoveDown: (blockId: string) => void;
  activeHtmlOccurrenceId?: string | null;
  activeTextRegionId?: string | null;
  onSelectHtmlOccurrence: (
    blockId: string,
    occurrence: HtmlVarOccurrence,
  ) => void;
  onReplaceHtmlOccurrence: (
    blockId: string,
    occurrenceId: string,
    newPath: string,
  ) => void;
  onSelectTextRegion: (blockId: string, region: HtmlTextRegion) => void;
  onEditTextRegion: (blockId: string, region: HtmlTextRegion) => void;
  onInsertVariable: (blockId: string, path: string) => void;
  onStyleTextRegion: (blockId: string, region: HtmlTextRegion) => void;
  onInlineEdit?: (blockId: string, key: string, value: string) => void;
};

const FLOATING_TOOLBAR_WIDTH = 232;
const FLOATING_TOOLBAR_HEIGHT = 44;
const FLOATING_TOOLBAR_GAP = 10;
const FLOATING_PANEL_WIDTH = 250;
const FLOATING_PANEL_HEIGHT = 288;

function clampPosition(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function InsertionGap({ index, active }: InsertionGapProps) {
  const { isOver, setNodeRef } = useDroppable({ id: `gap-${index}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex items-center transition-all duration-150",
        active ? "min-h-[44px]" : "min-h-0",
      )}
    >
      {isOver && active ? (
        <>
          <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
          <div className="absolute left-4 top-1/2 h-2.5 w-2.5 -translate-x-1 -translate-y-1/2 rounded-full bg-primary" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] font-medium text-primary">
            Drop here
          </div>
        </>
      ) : null}
    </div>
  );
}

function EmptyCanvasState({ isOver }: { isOver: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed transition-colors duration-150",
        isOver
          ? "border-primary/50 bg-primary/[0.04]"
          : "border-gray-200 bg-gray-50/50",
      )}
    >
      <div className="max-w-xs text-center">
        <div
          className={cn(
            "mx-auto mb-4 inline-flex rounded-xl p-3.5 transition-colors",
            isOver ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400",
          )}
        >
          {isOver ? (
            <Sparkles className="h-6 w-6" />
          ) : (
            <MousePointer2 className="h-6 w-6" />
          )}
        </div>
        <p className="text-base font-semibold text-foreground">
          {isOver ? "Drop component" : "Canvas is empty"}
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isOver
            ? "Dropping here adds the component to the template."
            : "Drag a component from the library to start building the template."}
        </p>
        {!isOver ? (
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            <span>Component library is ready</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CanvasOverlayLayer({
  host,
  toolbarOverlay,
  occurrencePickerOverlay,
}: {
  host: HTMLDivElement | null;
  toolbarOverlay: CanvasToolbarOverlay | null;
  occurrencePickerOverlay: CanvasOccurrencePickerOverlay | null;
}) {
  if (!host || (!toolbarOverlay && !occurrencePickerOverlay)) {
    return null;
  }

  const showToolbar = Boolean(toolbarOverlay && !occurrencePickerOverlay);
  const hostRect = host.getBoundingClientRect();

  const toolbarLeft =
    showToolbar && toolbarOverlay
      ? clampPosition(
          toolbarOverlay.anchorRect.left -
            hostRect.left +
            toolbarOverlay.anchorRect.width / 2 -
            FLOATING_TOOLBAR_WIDTH / 2,
          12,
          Math.max(12, hostRect.width - FLOATING_TOOLBAR_WIDTH - 12),
        )
      : 0;

  const toolbarTop =
    showToolbar && toolbarOverlay
      ? (() => {
          const topAbove =
            toolbarOverlay.anchorRect.top -
            hostRect.top -
            FLOATING_TOOLBAR_HEIGHT -
            FLOATING_TOOLBAR_GAP;
          const topBelow =
            toolbarOverlay.anchorRect.bottom -
            hostRect.top +
            FLOATING_TOOLBAR_GAP;
          const fitsBelow =
            topBelow + FLOATING_TOOLBAR_HEIGHT <= hostRect.height - 12;
          return fitsBelow
            ? topBelow
            : Math.max(12 - FLOATING_TOOLBAR_HEIGHT, topAbove);
        })()
      : 0;

  const occurrenceLeft = occurrencePickerOverlay
    ? clampPosition(
        occurrencePickerOverlay.anchorRect.left - hostRect.left,
        12,
        Math.max(12, hostRect.width - FLOATING_PANEL_WIDTH - 12),
      )
    : 0;

  const occurrenceTop = occurrencePickerOverlay
    ? (() => {
        const topBelow =
          occurrencePickerOverlay.anchorRect.bottom - hostRect.top + 10;
        const fitsBelow =
          topBelow + FLOATING_PANEL_HEIGHT <= hostRect.height - 12;
        if (fitsBelow) return topBelow;
        return Math.max(
          12 - FLOATING_PANEL_HEIGHT,
          occurrencePickerOverlay.anchorRect.top -
            hostRect.top -
            FLOATING_PANEL_HEIGHT -
            10,
        );
      })()
    : 0;

  const toolbarPanelTop =
    toolbarTop +
      FLOATING_TOOLBAR_HEIGHT +
      FLOATING_TOOLBAR_GAP +
      FLOATING_PANEL_HEIGHT <=
    hostRect.height - 12
      ? FLOATING_TOOLBAR_HEIGHT + FLOATING_TOOLBAR_GAP
      : -(FLOATING_PANEL_HEIGHT + FLOATING_TOOLBAR_GAP);

  return createPortal(
    <>
      {showToolbar && toolbarOverlay ? (
        <div
          className="pointer-events-auto absolute"
          style={{
            top: toolbarTop,
            left: toolbarLeft,
            width: FLOATING_TOOLBAR_WIDTH,
            opacity: toolbarOverlay.visible ? 1 : 0,
            transform: `translateY(${toolbarOverlay.visible ? 0 : 6}px)`,
            transition: "opacity 160ms ease, transform 160ms ease",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative flex items-center gap-1 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.5)] backdrop-blur">
            <button
              type="button"
              onClick={toolbarOverlay.onEdit}
              disabled={
                !toolbarOverlay.region.supportsStructuredEditing ||
                Boolean(toolbarOverlay.region.readonly)
              }
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                toolbarOverlay.region.supportsStructuredEditing &&
                  !toolbarOverlay.region.readonly
                  ? "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  : "cursor-not-allowed text-slate-300",
              )}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={toolbarOverlay.onToggleVariablePicker}
              disabled={
                !toolbarOverlay.region.supportsStructuredEditing ||
                Boolean(toolbarOverlay.region.readonly)
              }
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                toolbarOverlay.region.supportsStructuredEditing &&
                  !toolbarOverlay.region.readonly
                  ? "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  : "cursor-not-allowed text-slate-300",
              )}
            >
              Insert Variable
            </button>
            <button
              type="button"
              onClick={toolbarOverlay.onStyle}
              disabled={Boolean(toolbarOverlay.region.readonly)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                toolbarOverlay.region.readonly
                  ? "cursor-not-allowed text-slate-300"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              Style
            </button>
          </div>

          {toolbarOverlay.variablePickerOpen ? (
            <div
              className="absolute z-10"
              style={{
                top: toolbarPanelTop,
                left: clampPosition(
                  FLOATING_TOOLBAR_WIDTH - FLOATING_PANEL_WIDTH,
                  0,
                  Math.max(0, FLOATING_TOOLBAR_WIDTH - FLOATING_PANEL_WIDTH),
                ),
                width: FLOATING_PANEL_WIDTH,
              }}
            >
              <HtmlVarPicker
                options={toolbarOverlay.insertVariableOptions}
                onSelect={toolbarOverlay.onSelectVariable}
                onClose={toolbarOverlay.onCloseVariablePicker}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {occurrencePickerOverlay ? (
        <div
          className="pointer-events-auto absolute z-40 w-[250px]"
          style={{ top: occurrenceTop, left: occurrenceLeft }}
          onClick={(event) => event.stopPropagation()}
        >
          <HtmlVarPicker
            options={occurrencePickerOverlay.options}
            onSelect={occurrencePickerOverlay.onSelect}
            onClose={occurrencePickerOverlay.onClose}
          />
        </div>
      ) : null}
    </>,
    host,
  );
}

export function EditorCanvas({
  blocks,
  sourceData,
  selectedBlockId,
  editorMode,
  isLibraryDragActive,
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
}: EditorCanvasProps) {
  const { isOver, setNodeRef } = useDroppable({ id: "canvas-root" });
  const overlayHostRef = useRef<HTMLDivElement | null>(null);
  const [toolbarOverlay, setToolbarOverlay] =
    useState<CanvasToolbarOverlay | null>(null);
  const [occurrencePickerOverlay, setOccurrencePickerOverlay] =
    useState<CanvasOccurrencePickerOverlay | null>(null);

  useEffect(() => {
    if (!activeTextRegionId) {
      setToolbarOverlay(null);
    }
  }, [activeTextRegionId]);

  useEffect(() => {
    if (!activeHtmlOccurrenceId) {
      setOccurrencePickerOverlay(null);
    }
  }, [activeHtmlOccurrenceId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-2.5">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-foreground">Editor</p>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
            {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
          </span>
        </div>
        {isLibraryDragActive ? (
          <div className="rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary drop-zone-pulse">
            Drop zone active
          </div>
        ) : null}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-auto bg-[#e2e8f0] p-6 pb-12 scrollbar-thin",
          isOver && blocks.length === 0 && "bg-primary/[0.04]",
        )}
      >
        <div className="relative mx-auto max-w-[720px]">
          <div className="overflow-visible rounded-[18px] border border-slate-300/30 bg-white shadow-[0_26px_80px_-48px_rgba(15,23,42,0.45)]">
            {blocks.length === 0 ? (
              <EmptyCanvasState isOver={isOver} />
            ) : (
              <SortableContext
                items={blocks.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
              >
                <InsertionGap index={0} active={isLibraryDragActive} />
                {blocks.map((block, index) => (
                  <Fragment key={block.id}>
                    <CanvasBlock
                      block={block}
                      sourceData={sourceData}
                      selected={selectedBlockId === block.id}
                      editorMode={editorMode}
                      isFirst={index === 0}
                      isLast={index === blocks.length - 1}
                      onSelect={onSelect}
                      onRemove={onRemove}
                      onDuplicate={onDuplicate}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                      activeHtmlOccurrenceId={
                        selectedBlockId === block.id
                          ? activeHtmlOccurrenceId
                          : null
                      }
                      activeTextRegionId={
                        selectedBlockId === block.id ? activeTextRegionId : null
                      }
                      onSelectHtmlOccurrence={(occurrence) =>
                        onSelectHtmlOccurrence(block.id, occurrence)
                      }
                      onReplaceHtmlOccurrence={(occurrenceId, newPath) =>
                        onReplaceHtmlOccurrence(block.id, occurrenceId, newPath)
                      }
                      onSelectTextRegion={(region) =>
                        onSelectTextRegion(block.id, region)
                      }
                      onEditTextRegion={(region) =>
                        onEditTextRegion(block.id, region)
                      }
                      onInsertVariable={(path) =>
                        onInsertVariable(block.id, path)
                      }
                      onStyleTextRegion={(region) =>
                        onStyleTextRegion(block.id, region)
                      }
                      onInlineEdit={onInlineEdit}
                      onToolbarOverlayChange={
                        selectedBlockId === block.id
                          ? setToolbarOverlay
                          : undefined
                      }
                      onOccurrencePickerOverlayChange={
                        selectedBlockId === block.id
                          ? setOccurrencePickerOverlay
                          : undefined
                      }
                    />
                    <InsertionGap
                      index={index + 1}
                      active={isLibraryDragActive}
                    />
                  </Fragment>
                ))}
              </SortableContext>
            )}
          </div>
          <div
            ref={overlayHostRef}
            className="pointer-events-none absolute inset-0 z-50 overflow-visible"
          />
        </div>

        <CanvasOverlayLayer
          host={overlayHostRef.current}
          toolbarOverlay={toolbarOverlay}
          occurrencePickerOverlay={occurrencePickerOverlay}
        />
      </div>
    </div>
  );
}
