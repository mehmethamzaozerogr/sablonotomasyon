"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { BlockLibrary } from "@/components/editor/block-library";
import { BlockSettings } from "@/components/editor/block-settings";
import { CustomHtmlInspector } from "@/components/editor/custom-html-inspector";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorTopbar } from "@/components/editor/editor-topbar";
import { LivePreview } from "@/components/editor/live-preview";
import { StructurePanel } from "@/components/editor/structure-panel";
import { TemplateSettingsPanel } from "@/components/editor/template-settings-panel";
import { ThemeManagerPanel } from "@/components/editor/theme-manager-panel";
import { VersionHistoryPanel } from "@/components/editor/version-history-panel";
import {
  extractHtmlVarOccurrences,
  type HtmlVarOccurrence,
} from "@/lib/bindings/html-vars";
import { getBlockLabel } from "@/lib/blocks/registry";
import {
  createVariableSegment,
  getCustomHtmlTextRegionsWithFallback,
  normalizeInlineSegments,
  updateCustomHtmlRegionContent,
  updateCustomHtmlRegionHref,
  updateCustomHtmlRegionStyle,
  type HtmlTextRegion,
  type HtmlTextRegionStyle,
  type InlineSegment,
} from "@/lib/editor/custom-html-text";
import {
  analyzeTemplateStructure,
  getSelectionBreadcrumbs,
} from "@/lib/editor/template-intelligence";
import type { TemplateVersionSnapshot } from "@/lib/persistence/template-persistence.types";
import { getLocalTemplatePersistenceGateway } from "@/lib/persistence/template-persistence.local";
import { createTemplateDocumentMetadata } from "@/lib/persistence/template-persistence.utils";
import { sanitizeCustomHtmlForApp } from "@/lib/security/sanitize-custom-html";
import { getBlocksForCategory } from "@/lib/studio/presets";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import type {
  BlockPreset,
  TemplateCategory,
  TemplateRecord,
} from "@/types/template";

const AUTOSAVE_DELAY = 4000;

function getModeLabel(mode: "select" | "edit-content" | "edit-style") {
  if (mode === "edit-content") return "Editing";
  if (mode === "edit-style") return "Styling";
  return "Selected";
}

function getSelectionElementType(region: HtmlTextRegion | null) {
  if (!region) return "Block";
  if (region.href !== null) return "Link";
  return "Text";
}

type EditorShellProps = {
  initialTemplate: TemplateRecord;
  categorySources: Record<TemplateCategory, unknown>;
};

type ActiveDragData = {
  origin?: "library" | "canvas";
  preset?: BlockPreset;
  blockId?: string;
};

function toVersionEntry(
  version: TemplateVersionSnapshot,
  publishedVersionId: string | null,
) {
  return {
    id: version.id,
    label: version.label,
    savedAt: version.createdAt,
    blocks: version.snapshot.blocks,
    note: version.note,
    revision: version.revision,
    isPublished: version.id === publishedVersionId,
    snapshot: version.snapshot,
  };
}

export function EditorShell({
  initialTemplate,
  categorySources,
}: EditorShellProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [activeDragOrigin, setActiveDragOrigin] = useState<
    "library" | "canvas" | null
  >(null);
  const [leftPanelTab, setLeftPanelTab] = useState<"structure" | "library">(
    "structure",
  );
  const [workspaceMode, setWorkspaceMode] = useState<
    "edit" | "preview" | "split"
  >("edit");
  const [rightPanel, setRightPanel] = useState<
    "inspector" | "settings" | "themes"
  >("inspector");
  const [textEditorFocusToken, setTextEditorFocusToken] = useState(0);

  const template = useEditorStore((state) => state.template);
  const selectedBlockId = useEditorStore((state) => state.selectedBlockId);
  const selection = useEditorStore((state) => state.selection);
  const editorMode = useEditorStore((state) => state.editorMode);
  const previewMode = useEditorStore((state) => state.previewMode);
  const isDirty = useEditorStore((state) => state.isDirty);
  const versionPanelOpen = useEditorStore((state) => state.versionPanelOpen);

  const hydrateTemplate = useEditorStore((state) => state.hydrateTemplate);
  const selectBlock = useEditorStore((state) => state.selectBlock);
  const selectRegion = useEditorStore((state) => state.selectRegion);
  const selectToken = useEditorStore((state) => state.selectToken);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const setEditorMode = useEditorStore((state) => state.setEditorMode);
  const beginEditSession = useEditorStore((state) => state.beginEditSession);
  const commitEditSession = useEditorStore((state) => state.commitEditSession);
  const setPreviewMode = useEditorStore((state) => state.setPreviewMode);
  const setCategory = useEditorStore((state) => state.setCategory);
  const insertBlock = useEditorStore((state) => state.insertBlock);
  const moveBlock = useEditorStore((state) => state.moveBlock);
  const moveBlockUp = useEditorStore((state) => state.moveBlockUp);
  const moveBlockDown = useEditorStore((state) => state.moveBlockDown);
  const duplicateBlock = useEditorStore((state) => state.duplicateBlock);
  const updateBlockProp = useEditorStore((state) => state.updateBlockProp);
  const replaceHtmlVar = useEditorStore((state) => state.replaceHtmlVar);
  const updateBlockBinding = useEditorStore(
    (state) => state.updateBlockBinding,
  );
  const clearBlockBinding = useEditorStore((state) => state.clearBlockBinding);
  const updateBlockRepeater = useEditorStore(
    (state) => state.updateBlockRepeater,
  );
  const clearBlockRepeater = useEditorStore(
    (state) => state.clearBlockRepeater,
  );
  const removeBlock = useEditorStore((state) => state.removeBlock);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const markSaved = useEditorStore((state) => state.markSaved);
  const setSaveStatus = useEditorStore((state) => state.setSaveStatus);
  const setVersionHistory = useEditorStore((state) => state.setVersionHistory);
  const syncPersistenceMetadata = useEditorStore(
    (state) => state.syncPersistenceMetadata,
  );
  const persistenceRevision = useEditorStore(
    (state) => state.persistenceRevision,
  );
  const updateDesignSystem = useEditorStore(
    (state) => state.updateDesignSystem,
  );
  const applyThemePreset = useEditorStore((state) => state.applyThemePreset);
  const saveCurrentTheme = useEditorStore((state) => state.saveCurrentTheme);
  const duplicateActiveTheme = useEditorStore(
    (state) => state.duplicateActiveTheme,
  );
  const resetTheme = useEditorStore((state) => state.resetTheme);

  const editCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingEditCommit = useCallback(() => {
    if (editCommitTimerRef.current) {
      clearTimeout(editCommitTimerRef.current);
      editCommitTimerRef.current = null;
    }
  }, []);

  const scheduleEditCommit = useCallback(
    (delay = 900) => {
      clearPendingEditCommit();
      editCommitTimerRef.current = setTimeout(() => {
        commitEditSession();
        editCommitTimerRef.current = null;
      }, delay);
    },
    [clearPendingEditCommit, commitEditSession],
  );

  const commitCustomHtmlEditSession = useCallback(() => {
    clearPendingEditCommit();
    commitEditSession();
  }, [clearPendingEditCommit, commitEditSession]);

  const beginCustomHtmlEditSession = useCallback(() => {
    beginEditSession();
  }, [beginEditSession]);

  const handleInsertBlock = useCallback(
    (preset: BlockPreset) => insertBlock(preset),
    [insertBlock],
  );

  const handleRemoveBlock = useCallback(
    (id: string) => {
      removeBlock(id);
      toast("Block deleted", "warning", 2000);
    },
    [removeBlock],
  );

  const handleDuplicateBlock = useCallback(
    (id: string) => {
      duplicateBlock(id);
      toast("Block duplicated", "success", 2000);
    },
    [duplicateBlock],
  );

  const handleMoveUp = useCallback(
    (id: string) => moveBlockUp(id),
    [moveBlockUp],
  );
  const handleMoveDown = useCallback(
    (id: string) => moveBlockDown(id),
    [moveBlockDown],
  );

  const handleSelect = useCallback(
    (id: string) => {
      commitCustomHtmlEditSession();
      selectBlock(id);
      setEditorMode("select");
    },
    [commitCustomHtmlEditSession, selectBlock, setEditorMode],
  );

  const selectedBlock = useMemo(
    () =>
      template?.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [template, selectedBlockId],
  );

  const presets = useMemo(
    () => (template ? getBlocksForCategory(template.category) : []),
    [template],
  );

  const sourceData = useMemo(
    () => (template ? categorySources[template.category] : undefined),
    [categorySources, template],
  );
  const previewOpen = workspaceMode === "preview";
  const splitView = workspaceMode === "split";
  const analysis = useMemo(
    () => (template ? analyzeTemplateStructure(template) : null),
    [template],
  );

  const selectedCustomHtmlRowMode = useMemo(() => {
    if (!selectedBlock || selectedBlock.type !== "customHtml") {
      return false;
    }

    return String(selectedBlock.props["htmlSectionKind"] ?? "") === "tbody-row";
  }, [selectedBlock]);

  const selectedCustomHtmlRegions = useMemo(() => {
    if (!selectedBlock || selectedBlock.type !== "customHtml") {
      return [];
    }

    const rawHtml = String(selectedBlock.props["html"] ?? "");
    const safeHtml = sanitizeCustomHtmlForApp(rawHtml);

    return getCustomHtmlTextRegionsWithFallback(
      safeHtml,
      rawHtml,
      selectedCustomHtmlRowMode,
    );
  }, [selectedBlock, selectedCustomHtmlRowMode]);

  const activeHtmlVar = useMemo(
    () =>
      selection.kind === "token"
        ? { blockId: selection.blockId, occurrenceId: selection.occurrenceId }
        : null,
    [selection],
  );
  const activeTextRegion = useMemo(
    () =>
      selection.kind === "region"
        ? { blockId: selection.blockId, regionId: selection.regionId }
        : null,
    [selection],
  );

  useEffect(() => {
    if (!selectedBlock || selectedBlock.type !== "customHtml") {
      if (selection.kind === "region" || selection.kind === "token") {
        if (selectedBlockId) {
          selectBlock(selectedBlockId);
        } else {
          clearSelection();
        }
      }
      return;
    }

    if (selection.kind === "token" && selection.blockId === selectedBlock.id) {
      const rawHtml = String(selectedBlock.props["html"] ?? "");
      const occurrences = extractHtmlVarOccurrences(rawHtml);
      if (
        !occurrences.some(
          (occurrence) => occurrence.id === selection.occurrenceId,
        )
      ) {
        selectBlock(selectedBlock.id);
      }
    }

    if (selection.kind === "region" && selection.blockId === selectedBlock.id) {
      if (
        !selectedCustomHtmlRegions.some(
          (region) => region.id === selection.regionId,
        )
      ) {
        selectBlock(selectedBlock.id);
      }
    }
  }, [
    clearSelection,
    selectBlock,
    selectedBlock,
    selectedBlockId,
    selectedCustomHtmlRegions,
    selection,
  ]);

  useEffect(() => {
    if (editorMode === "select") {
      return;
    }

    if (!selectedBlock || selectedBlock.type !== "customHtml") {
      setEditorMode("select");
      return;
    }

    if (!activeTextRegion || activeTextRegion.blockId !== selectedBlock.id) {
      setEditorMode("select");
    }
  }, [activeTextRegion, editorMode, selectedBlock, setEditorMode]);

  const handleSelectHtmlOccurrence = useCallback(
    (blockId: string, occurrence: HtmlVarOccurrence) => {
      commitCustomHtmlEditSession();
      selectToken(blockId, occurrence.id);
      setEditorMode("select");
      setRightPanel("inspector");
    },
    [commitCustomHtmlEditSession, selectToken, setEditorMode],
  );

  const handleReplaceHtmlOccurrence = useCallback(
    (blockId: string, occurrenceId: string, newPath: string) => {
      replaceHtmlVar(blockId, occurrenceId, newPath);
      selectToken(blockId, occurrenceId);
      setRightPanel("inspector");
    },
    [replaceHtmlVar, selectToken],
  );

  const handleSelectTextRegion = useCallback(
    (blockId: string, region: HtmlTextRegion) => {
      commitCustomHtmlEditSession();
      selectRegion(blockId, region.id);
      setEditorMode("select");
      setRightPanel("inspector");
    },
    [commitCustomHtmlEditSession, selectRegion, setEditorMode],
  );

  const handleEditTextRegion = useCallback(
    (blockId: string, region: HtmlTextRegion) => {
      commitCustomHtmlEditSession();
      selectRegion(blockId, region.id);
      setEditorMode("edit-content");
      setRightPanel("inspector");
      setTextEditorFocusToken((current) => current + 1);
    },
    [commitCustomHtmlEditSession, selectRegion, setEditorMode],
  );

  const handleStyleTextRegion = useCallback(
    (blockId: string, region: HtmlTextRegion) => {
      commitCustomHtmlEditSession();
      selectRegion(blockId, region.id);
      setEditorMode("edit-style");
      setRightPanel("inspector");
    },
    [commitCustomHtmlEditSession, selectRegion, setEditorMode],
  );

  const handleInsertVariableIntoRegion = useCallback(
    (blockId: string, path: string) => {
      if (!template) return;

      const block = template.blocks.find((entry) => entry.id === blockId);
      if (!block || block.type !== "customHtml") return;

      const rowMode =
        String(block.props["htmlSectionKind"] ?? "") === "tbody-row";
      const rawHtml = String(block.props["html"] ?? "");
      const safeHtml = sanitizeCustomHtmlForApp(rawHtml);
      const regions = getCustomHtmlTextRegionsWithFallback(
        safeHtml,
        rawHtml,
        rowMode,
      );
      const targetRegionId =
        activeTextRegion?.blockId === blockId
          ? activeTextRegion.regionId
          : null;
      const region = regions.find((entry) => entry.id === targetRegionId);
      if (!region || !region.supportsStructuredEditing || region.readonly) {
        return;
      }

      beginCustomHtmlEditSession();
      const nextSegments = normalizeInlineSegments([
        ...region.segments,
        createVariableSegment(path),
      ]);
      const currentHtml = String(block.props["html"] ?? "");
      const nextHtml = updateCustomHtmlRegionContent(
        currentHtml,
        region.id,
        nextSegments,
        rowMode,
      );

      if (nextHtml !== currentHtml) {
        updateBlockProp(block.id, "html", nextHtml);
      }

      selectRegion(block.id, region.id);
      setRightPanel("inspector");
      setEditorMode("edit-content");
      setTextEditorFocusToken((current) => current + 1);
      commitCustomHtmlEditSession();
    },
    [
      activeTextRegion,
      beginCustomHtmlEditSession,
      commitCustomHtmlEditSession,
      selectRegion,
      setEditorMode,
      template,
      updateBlockProp,
    ],
  );

  const handleChangeSelectedRegionSegments = useCallback(
    (segments: InlineSegment[]) => {
      if (
        !selectedBlock ||
        selectedBlock.type !== "customHtml" ||
        !activeTextRegion ||
        activeTextRegion.blockId !== selectedBlock.id
      ) {
        return;
      }

      const selectedRegion = selectedCustomHtmlRegions.find(
        (region) => region.id === activeTextRegion.regionId,
      );
      if (!selectedRegion || selectedRegion.readonly) {
        return;
      }

      beginCustomHtmlEditSession();
      setEditorMode("edit-content");

      const currentHtml = String(selectedBlock.props["html"] ?? "");
      const nextHtml = updateCustomHtmlRegionContent(
        currentHtml,
        activeTextRegion.regionId,
        segments,
        selectedCustomHtmlRowMode,
      );

      if (nextHtml !== currentHtml) {
        updateBlockProp(selectedBlock.id, "html", nextHtml);
        scheduleEditCommit();
      }
    },
    [
      activeTextRegion,
      beginCustomHtmlEditSession,
      scheduleEditCommit,
      selectedBlock,
      selectedCustomHtmlRegions,
      selectedCustomHtmlRowMode,
      setEditorMode,
      updateBlockProp,
    ],
  );

  const handleChangeSelectedRegionStyle = useCallback(
    (patch: Partial<HtmlTextRegionStyle>) => {
      if (
        !selectedBlock ||
        selectedBlock.type !== "customHtml" ||
        !activeTextRegion ||
        activeTextRegion.blockId !== selectedBlock.id
      ) {
        return;
      }

      const selectedRegion = selectedCustomHtmlRegions.find(
        (region) => region.id === activeTextRegion.regionId,
      );
      if (!selectedRegion || selectedRegion.readonly) {
        return;
      }

      beginCustomHtmlEditSession();
      setEditorMode("edit-style");

      const currentHtml = String(selectedBlock.props["html"] ?? "");
      const nextHtml = updateCustomHtmlRegionStyle(
        currentHtml,
        activeTextRegion.regionId,
        patch,
        selectedCustomHtmlRowMode,
      );

      if (nextHtml !== currentHtml) {
        updateBlockProp(selectedBlock.id, "html", nextHtml);
        scheduleEditCommit();
      }
    },
    [
      activeTextRegion,
      beginCustomHtmlEditSession,
      scheduleEditCommit,
      selectedBlock,
      selectedCustomHtmlRegions,
      selectedCustomHtmlRowMode,
      setEditorMode,
      updateBlockProp,
    ],
  );

  const handleChangeSelectedRegionHref = useCallback(
    (href: string) => {
      if (
        !selectedBlock ||
        selectedBlock.type !== "customHtml" ||
        !activeTextRegion ||
        activeTextRegion.blockId !== selectedBlock.id
      ) {
        return;
      }

      const selectedRegion = selectedCustomHtmlRegions.find(
        (region) => region.id === activeTextRegion.regionId,
      );
      if (!selectedRegion || selectedRegion.readonly) {
        return;
      }

      beginCustomHtmlEditSession();
      setEditorMode("edit-content");

      const currentHtml = String(selectedBlock.props["html"] ?? "");
      const nextHtml = updateCustomHtmlRegionHref(
        currentHtml,
        activeTextRegion.regionId,
        href,
        selectedCustomHtmlRowMode,
      );

      if (nextHtml !== currentHtml) {
        updateBlockProp(selectedBlock.id, "html", nextHtml);
        scheduleEditCommit();
      }
    },
    [
      activeTextRegion,
      beginCustomHtmlEditSession,
      scheduleEditCommit,
      selectedBlock,
      selectedCustomHtmlRegions,
      selectedCustomHtmlRowMode,
      setEditorMode,
      updateBlockProp,
    ],
  );

  const handleChangeSelectedRawHtml = useCallback(
    (value: string) => {
      if (!selectedBlock || selectedBlock.type !== "customHtml") {
        return;
      }

      beginCustomHtmlEditSession();
      updateBlockProp(selectedBlock.id, "html", value);
      scheduleEditCommit(1200);
    },
    [
      beginCustomHtmlEditSession,
      scheduleEditCommit,
      selectedBlock,
      updateBlockProp,
    ],
  );

  useEffect(() => {
    hydrateTemplate(initialTemplate);
  }, [hydrateTemplate, initialTemplate]);

  useEffect(() => {
    if (!template) return;

    let cancelled = false;
    void (async () => {
      const gateway = getLocalTemplatePersistenceGateway();
      const draft = await gateway.getDraft(template.id);
      if (cancelled) return;

      syncPersistenceMetadata({
        revision: draft?.metadata.revision ?? null,
        lastSavedAt: draft?.metadata.savedAt ?? null,
        publishedAt: draft?.metadata.publishedAt ?? null,
        publishedVersionId: draft?.metadata.publishedVersionId ?? null,
      });

      const versions = await gateway.listVersions(template.id);
      if (cancelled) return;

      const entries = versions.map((version) =>
        toVersionEntry(version, draft?.metadata.publishedVersionId ?? null),
      );
      setVersionHistory(entries);
    })();

    return () => {
      cancelled = true;
    };
  }, [setVersionHistory, syncPersistenceMetadata, template]);

  useEffect(() => {
    if (!template || !isDirty) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          setSaveStatus("saving");
          const gateway = getLocalTemplatePersistenceGateway();
          const result = await gateway.saveDraft({
            template,
            metadata: createTemplateDocumentMetadata(template),
            baseRevision: persistenceRevision,
          });

          if (!result.ok) {
            if (result.reason === "conflict") {
              setSaveStatus("conflict", result.message);
            } else {
              setSaveStatus("error", result.message);
            }
            return;
          }

          syncPersistenceMetadata({
            revision: result.document.metadata.revision,
            lastSavedAt: result.document.metadata.savedAt,
            publishedAt: result.document.metadata.publishedAt,
            publishedVersionId: result.document.metadata.publishedVersionId,
          });
          markSaved(result.document.metadata.savedAt ?? undefined);
        } catch {
          setSaveStatus("error", "Autosave basarisiz.");
          // Ignore autosave issues.
        }
      })();
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [
    isDirty,
    markSaved,
    persistenceRevision,
    setSaveStatus,
    syncPersistenceMetadata,
    template,
  ]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => () => clearPendingEditCommit(), [clearPendingEditCommit]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const inInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      const ctrl = event.ctrlKey || event.metaKey;

      if (ctrl && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
          toast("Undid last change", "info", 1600);
        }
        return;
      }

      if (
        ctrl &&
        (event.key === "y" || (event.key === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        if (canRedo) {
          redo();
          toast("Redid last change", "info", 1600);
        }
        return;
      }

      if (ctrl && event.key === "s" && !event.shiftKey) {
        event.preventDefault();
        if (template) {
          void (async () => {
            try {
              setSaveStatus("saving");
              const gateway = getLocalTemplatePersistenceGateway();
              const result = await gateway.saveDraft({
                template,
                metadata: createTemplateDocumentMetadata(template),
                baseRevision: persistenceRevision,
              });

              if (!result.ok) {
                if (result.reason === "conflict") {
                  setSaveStatus("conflict", result.message);
                } else {
                  setSaveStatus("error", result.message || "Save failed");
                }
                toast(result.message || "Save failed", "error");
                return;
              }

              syncPersistenceMetadata({
                revision: result.document.metadata.revision,
                lastSavedAt: result.document.metadata.savedAt,
                publishedAt: result.document.metadata.publishedAt,
                publishedVersionId: result.document.metadata.publishedVersionId,
              });
              markSaved(result.document.metadata.savedAt ?? undefined);
              toast("Saved", "success");
            } catch {
              setSaveStatus("error", "Save failed");
              toast("Save failed", "error");
            }
          })();
        }
        return;
      }

      if (ctrl && event.shiftKey && event.key === "S") {
        event.preventDefault();
        if (template) {
          void (async () => {
            try {
              const gateway = getLocalTemplatePersistenceGateway();
              const label = `Version · ${new Date().toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}`;
              const version = await gateway.createVersion(template.id, label);
              if (!version) {
                toast("Version save failed", "error");
                return;
              }
              const draft = await gateway.getDraft(template.id);
              const versions = await gateway.listVersions(template.id);
              setVersionHistory(
                versions.map((entry) =>
                  toVersionEntry(
                    entry,
                    draft?.metadata.publishedVersionId ?? null,
                  ),
                ),
              );
              toast("Version saved", "success");
            } catch {
              toast("Version save failed", "error");
            }
          })();
        }
        return;
      }

      if (ctrl && event.key === "p") {
        event.preventDefault();
        setWorkspaceMode((current) =>
          current === "preview" ? "edit" : "preview",
        );
        return;
      }

      if (event.key === "Escape") {
        const activeElement = document.activeElement;

        if (editorMode !== "select") {
          event.preventDefault();
          commitCustomHtmlEditSession();
          setEditorMode("select");
          if (activeElement instanceof HTMLElement) {
            activeElement.blur();
          }
          return;
        }

        if (selectedBlockId || selection.kind !== "none") {
          event.preventDefault();
          clearSelection();
          return;
        }
      }

      if (inInput) return;

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedBlockId
      ) {
        removeBlock(selectedBlockId);
        toast("Block deleted", "warning", 2000);
        return;
      }

      if (ctrl && event.key === "d" && selectedBlockId) {
        event.preventDefault();
        duplicateBlock(selectedBlockId);
        toast("Block duplicated", "success", 2000);
        return;
      }

      if (event.altKey && event.key === "ArrowUp" && selectedBlockId) {
        event.preventDefault();
        moveBlockUp(selectedBlockId);
        return;
      }

      if (event.altKey && event.key === "ArrowDown" && selectedBlockId) {
        event.preventDefault();
        moveBlockDown(selectedBlockId);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    canRedo,
    canUndo,
    clearSelection,
    commitCustomHtmlEditSession,
    duplicateBlock,
    editorMode,
    markSaved,
    moveBlockDown,
    moveBlockUp,
    persistenceRevision,
    redo,
    removeBlock,
    setSaveStatus,
    setVersionHistory,
    selectedBlockId,
    selection.kind,
    setEditorMode,
    syncPersistenceMetadata,
    template,
    undo,
  ]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as ActiveDragData | undefined;

    if (data?.origin === "library" && data.preset) {
      setActiveDragOrigin("library");
      setActiveLabel(data.preset.name);
      return;
    }

    if (data?.origin === "canvas") {
      setActiveDragOrigin("canvas");
      setActiveLabel(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveLabel(null);
      setActiveDragOrigin(null);

      const { active, over } = event;
      if (!over || !template) return;

      const data = active.data.current as ActiveDragData | undefined;
      const overId = String(over.id);

      if (data?.origin === "library" && data.preset) {
        if (overId === "canvas-root") {
          insertBlock(data.preset);
          return;
        }

        if (overId.startsWith("gap-")) {
          const index = parseInt(overId.split("-")[1], 10);
          insertBlock(data.preset, Number.isNaN(index) ? undefined : index);
          return;
        }

        const overIndex = template.blocks.findIndex(
          (block) => block.id === overId,
        );
        insertBlock(data.preset, overIndex < 0 ? undefined : overIndex + 1);
        return;
      }

      if (data?.origin === "canvas") {
        if (overId === "canvas-root" || overId.startsWith("gap-")) return;
        if (active.id !== over.id) {
          moveBlock(String(active.id), overId);
        }
      }
    },
    [insertBlock, moveBlock, template],
  );

  const handleDragCancel = useCallback(() => {
    setActiveLabel(null);
    setActiveDragOrigin(null);
  }, []);

  const selectedRegion = useMemo(
    () =>
      selectedCustomHtmlRegions.find(
        (region) => region.id === activeTextRegion?.regionId,
      ) ?? null,
    [activeTextRegion?.regionId, selectedCustomHtmlRegions],
  );

  const currentTargetLabel = useMemo(() => {
    if (!selectedBlock) {
      return "No selection";
    }

    const blockLabel = getBlockLabel(selectedBlock.type, selectedBlock.name);

    if (selection.kind === "region" && selectedRegion) {
      return `${blockLabel} > ${selectedRegion.label} > ${getSelectionElementType(selectedRegion)}`;
    }

    if (selection.kind === "token") {
      return `${blockLabel} > Variable token > Variable`;
    }

    if (selectedBlock.type === "customHtml") {
      return `${blockLabel} > Region > Block`;
    }

    return `${blockLabel} > Content > Block`;
  }, [selectedBlock, selectedRegion, selection.kind]);
  const selectionBreadcrumbs = useMemo(
    () => (analysis ? getSelectionBreadcrumbs(analysis, selection) : []),
    [analysis, selection],
  );

  const handleFocusBlockFromChecklist = useCallback(
    (blockId: string) => {
      if (!template) return;
      if (!template.blocks.some((block) => block.id === blockId)) {
        return;
      }

      commitCustomHtmlEditSession();
      selectBlock(blockId);
      setEditorMode("select");
      setRightPanel("inspector");
      if (previewOpen) {
        setWorkspaceMode("edit");
      }
    },
    [
      commitCustomHtmlEditSession,
      previewOpen,
      selectBlock,
      setEditorMode,
      template,
    ],
  );

  if (!template) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full flex-col">
        <EditorTopbar
          template={template}
          previewMode={previewMode}
          sourceData={sourceData}
          previewOpen={previewOpen}
          workspaceMode={workspaceMode}
          selectionPath={currentTargetLabel}
          modeLabel={getModeLabel(editorMode)}
          onPreviewModeChange={setPreviewMode}
          onCategoryChange={setCategory}
          onTogglePreview={() =>
            setWorkspaceMode((current) =>
              current === "preview" ? "edit" : "preview",
            )
          }
          onWorkspaceModeChange={setWorkspaceMode}
          onFocusBlock={handleFocusBlockFromChecklist}
        />

        <div className="flex min-h-0 flex-1 bg-[linear-gradient(180deg,#eef3f8_0%,#f8fafc_26%,#ffffff_100%)]">
          {!previewOpen && analysis ? (
            <div className="flex w-[320px] shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur">
              <div className="flex shrink-0 border-b border-slate-200/80 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setLeftPanelTab("structure")}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    leftPanelTab === "structure"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  Structure
                </button>
                <button
                  type="button"
                  onClick={() => setLeftPanelTab("library")}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                    leftPanelTab === "library"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  Library
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                {leftPanelTab === "structure" ? (
                  <StructurePanel
                    analysis={analysis}
                    selection={selection}
                    onSelectBlock={(blockId) => {
                      commitCustomHtmlEditSession();
                      selectBlock(blockId);
                      setEditorMode("select");
                      setRightPanel("inspector");
                    }}
                    onSelectRegion={(blockId, regionId) => {
                      commitCustomHtmlEditSession();
                      selectRegion(blockId, regionId);
                      setEditorMode("select");
                      setRightPanel("inspector");
                    }}
                  />
                ) : (
                  <BlockLibrary
                    presets={presets}
                    onInsert={handleInsertBlock}
                  />
                )}
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {!previewOpen ? (
              <div className="shrink-0 border-b border-slate-200/80 bg-white/70 px-5 py-3 backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  {selectionBreadcrumbs.map((crumb) => (
                    <span
                      key={crumb}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                    >
                      {crumb}
                    </span>
                  ))}
                  {analysis ? (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {analysis.summary.variables} variables
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div
              className={cn(
                "flex min-h-0 flex-1",
                splitView ? "gap-4 p-4" : "",
              )}
            >
              {!previewOpen ? (
                <div
                  className={cn(
                    "flex min-w-0 flex-1 flex-col overflow-hidden",
                    splitView &&
                      "rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]",
                  )}
                >
                  <EditorCanvas
                    blocks={template.blocks}
                    sourceData={sourceData}
                    selectedBlockId={selectedBlockId}
                    editorMode={editorMode}
                    isLibraryDragActive={activeDragOrigin === "library"}
                    onSelect={handleSelect}
                    onRemove={handleRemoveBlock}
                    onDuplicate={handleDuplicateBlock}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    activeHtmlOccurrenceId={activeHtmlVar?.occurrenceId ?? null}
                    activeTextRegionId={
                      activeTextRegion?.blockId === selectedBlockId
                        ? activeTextRegion.regionId
                        : null
                    }
                    onSelectHtmlOccurrence={handleSelectHtmlOccurrence}
                    onReplaceHtmlOccurrence={handleReplaceHtmlOccurrence}
                    onSelectTextRegion={handleSelectTextRegion}
                    onEditTextRegion={handleEditTextRegion}
                    onInsertVariable={handleInsertVariableIntoRegion}
                    onStyleTextRegion={handleStyleTextRegion}
                    onInlineEdit={(blockId, key, value) => {
                      updateBlockProp(blockId, key, value);
                    }}
                  />
                  {versionPanelOpen ? (
                    <div className="h-[260px] shrink-0 overflow-hidden border-t border-border">
                      <VersionHistoryPanel sourceData={sourceData} />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {previewOpen || splitView ? (
                <div
                  className={cn(
                    "min-w-0 flex-1 overflow-hidden",
                    splitView &&
                      "rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]",
                  )}
                >
                  <LivePreview
                    template={template}
                    previewMode={previewMode}
                    sourceData={sourceData}
                    onClose={
                      previewOpen ? () => setWorkspaceMode("edit") : undefined
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>

          {!previewOpen && analysis ? (
            <div className="flex w-[360px] shrink-0 flex-col border-l border-slate-200/80 bg-white/95 backdrop-blur">
              <div className="flex shrink-0 border-b border-slate-200/80 px-3 py-2">
                {[
                  { id: "inspector", label: "Properties" },
                  { id: "settings", label: "Settings" },
                  { id: "themes", label: "Themes" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRightPanel(tab.id as typeof rightPanel)}
                    className={cn(
                      "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition",
                      rightPanel === tab.id
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="shrink-0 border-b border-slate-200/80 bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Current Target
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    {getModeLabel(editorMode)}
                  </span>
                  <p className="min-w-0 truncate text-[11px] font-medium text-slate-950">
                    {currentTargetLabel}
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                {rightPanel === "inspector" ? (
                  selectedBlock?.type === "customHtml" ? (
                    <CustomHtmlInspector
                      block={selectedBlock}
                      sourceData={sourceData}
                      regions={selectedCustomHtmlRegions}
                      selectedRegionId={
                        activeTextRegion?.blockId === selectedBlock.id
                          ? activeTextRegion.regionId
                          : null
                      }
                      editorMode={editorMode}
                      focusToken={textEditorFocusToken}
                      onSelectRegion={(regionId) => {
                        commitCustomHtmlEditSession();
                        setEditorMode("select");
                        selectRegion(selectedBlock.id, regionId);
                      }}
                      onChangeSegments={handleChangeSelectedRegionSegments}
                      onChangeStyle={handleChangeSelectedRegionStyle}
                      onChangeHref={handleChangeSelectedRegionHref}
                      onChangeRawHtml={handleChangeSelectedRawHtml}
                      onCommitEdits={commitCustomHtmlEditSession}
                      onRemove={handleRemoveBlock}
                      onDuplicate={handleDuplicateBlock}
                    />
                  ) : (
                    <BlockSettings
                      category={template.category}
                      sourceData={sourceData}
                      block={selectedBlock}
                      editorMode={editorMode}
                      onChange={updateBlockProp}
                      onBindingChange={updateBlockBinding}
                      onBindingClear={clearBlockBinding}
                      onRepeaterChange={updateBlockRepeater}
                      onRepeaterClear={clearBlockRepeater}
                      onRemove={handleRemoveBlock}
                      onDuplicate={handleDuplicateBlock}
                    />
                  )
                ) : rightPanel === "settings" ? (
                  <TemplateSettingsPanel
                    designSystem={analysis.designSystem}
                    onDesignSystemChange={updateDesignSystem}
                  />
                ) : (
                  <ThemeManagerPanel
                    designSystem={analysis.designSystem}
                    onApplyTheme={(themeId) => {
                      applyThemePreset(themeId);
                      toast(
                        "Theme applied across the template",
                        "success",
                        1800,
                      );
                    }}
                    onSaveCurrentTheme={(name) => {
                      saveCurrentTheme(name);
                      toast("Custom theme saved", "success", 1800);
                    }}
                    onDuplicateActiveTheme={() => {
                      duplicateActiveTheme();
                      toast("Theme duplicated", "success", 1800);
                    }}
                    onResetTheme={() => {
                      resetTheme();
                      toast("Theme reset to default", "info", 1800);
                    }}
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
        {activeLabel ? (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-lg">
            <div className="h-2 w-2 rounded-full bg-primary" />
            {activeLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
