"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { create } from "zustand";

import { replaceHtmlVarOccurrence } from "@/lib/bindings/html-vars";
import {
  replaceColorInHtml,
  replaceFontInHtml,
} from "@/lib/design/color-utils";
import {
  applyThemePreset as applyThemePresetToTemplate,
  duplicateActiveTheme as duplicateActiveTemplateTheme,
  ensureTemplateDesignSystem,
  saveCurrentThemeAsCustomTheme,
  updateTemplateDesignSystem,
} from "@/lib/editor/template-design";
import type { SaveStatus } from "@/lib/persistence/template-persistence.types";
import type { BlockFieldBinding, RepeaterBinding } from "@/types/binding";
import type {
  BlockPreset,
  BlockValue,
  EditorBlock,
  PreviewMode,
  TemplateDesignSystem,
  TemplateCategory,
  TemplateRecord,
} from "@/types/template";

export type VersionEntry = {
  id: string;
  label: string;
  savedAt: string;
  blocks: EditorBlock[];
  note?: string | null;
  revision?: number;
  isPublished?: boolean;
  snapshot?: TemplateRecord;
};

export type EditorMode = "select" | "edit-content" | "edit-style";

export type EditorSelection =
  | { kind: "none" }
  | { kind: "block"; blockId: string }
  | { kind: "region"; blockId: string; regionId: string }
  | { kind: "token"; blockId: string; occurrenceId: string };

type EditSession = {
  snapshot: TemplateRecord;
};

type EditorStore = {
  template: TemplateRecord | null;
  selectedBlockId: string | null;
  selection: EditorSelection;
  editorMode: EditorMode;
  activeEditSession: EditSession | null;
  hasPendingEditSessionChanges: boolean;
  previewMode: PreviewMode;
  previewOpen: boolean;
  previewZoom: number;
  previewRefreshKey: number;
  undoStack: TemplateRecord[];
  redoStack: TemplateRecord[];
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  hasConflict: boolean;
  saveErrorMessage: string | null;
  persistenceRevision: number | null;
  publishedAt: string | null;
  publishedVersionId: string | null;
  savedAt: string | null;
  versionHistory: VersionEntry[];
  versionPanelOpen: boolean;

  hydrateTemplate: (template: TemplateRecord) => void;
  setSelectedBlockId: (blockId: string | null) => void;
  setSelection: (selection: EditorSelection) => void;
  selectBlock: (blockId: string) => void;
  selectRegion: (blockId: string, regionId: string) => void;
  selectToken: (blockId: string, occurrenceId: string) => void;
  clearSelection: () => void;
  setEditorMode: (mode: EditorMode) => void;
  beginEditSession: () => void;
  commitEditSession: () => void;
  cancelEditSession: () => void;
  setPreviewMode: (mode: PreviewMode) => void;
  togglePreview: () => void;
  setPreviewZoom: (zoom: number) => void;
  refreshPreview: () => void;
  setCategory: (category: TemplateCategory) => void;
  insertBlock: (preset: BlockPreset, index?: number) => void;
  moveBlock: (activeId: string, overId: string) => void;
  moveBlockUp: (blockId: string) => void;
  moveBlockDown: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  updateBlockProp: (blockId: string, key: string, value: BlockValue) => void;
  replaceHtmlVar: (
    blockId: string,
    occurrenceId: string,
    newPath: string,
  ) => void;
  replaceColorInAllBlocks: (oldHex: string, newHex: string) => void;
  replaceFontInAllBlocks: (oldFont: string, newFont: string) => void;
  updateDesignSystem: (
    updater: (design: TemplateDesignSystem) => TemplateDesignSystem,
  ) => void;
  applyThemePreset: (themeId: string) => void;
  saveCurrentTheme: (name: string) => void;
  duplicateActiveTheme: () => void;
  resetTheme: () => void;
  updateBlockBinding: (
    blockId: string,
    key: string,
    binding: BlockFieldBinding,
  ) => void;
  clearBlockBinding: (blockId: string, key: string) => void;
  updateBlockRepeater: (blockId: string, repeater: RepeaterBinding) => void;
  clearBlockRepeater: (blockId: string) => void;
  removeBlock: (blockId: string) => void;
  undo: () => void;
  redo: () => void;
  markSaved: (savedAt?: string) => void;
  setSaveStatus: (status: SaveStatus, message?: string | null) => void;
  setVersionHistory: (entries: VersionEntry[]) => void;
  syncPersistenceMetadata: (payload: {
    revision?: number | null;
    lastSavedAt?: string | null;
    publishedAt?: string | null;
    publishedVersionId?: string | null;
  }) => void;
  saveVersion: (label?: string) => void;
  restoreVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  toggleVersionPanel: () => void;
};

const MAX_VERSIONS = 10;
const MAX_UNDO = 30;

function versionStorageKey(templateId: string) {
  return `sablongpt-versions-${templateId}`;
}

function loadVersionHistory(templateId: string): VersionEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(versionStorageKey(templateId));
    if (!raw) return [];
    return JSON.parse(raw) as VersionEntry[];
  } catch {
    return [];
  }
}

function persistVersionHistory(templateId: string, versions: VersionEntry[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      versionStorageKey(templateId),
      JSON.stringify(versions),
    );
  } catch {
    // Ignore storage issues.
  }
}

function cloneBlock(block: EditorBlock): EditorBlock {
  return {
    ...block,
    fields: block.fields?.map((field) => ({ ...field })),
    props: { ...block.props },
    bindings: block.bindings
      ? Object.fromEntries(
          Object.entries(block.bindings).map(([key, binding]) => [
            key,
            {
              ...binding,
              segments: binding.segments.map((segment) => ({ ...segment })),
              format: { ...binding.format },
            },
          ]),
        )
      : undefined,
    repeater: block.repeater ? { ...block.repeater } : null,
    children: block.children?.map(cloneBlock),
  };
}

function cloneTemplate(template: TemplateRecord): TemplateRecord {
  return {
    ...template,
    tags: [...template.tags],
    htmlEnvelope: template.htmlEnvelope ? { ...template.htmlEnvelope } : null,
    designSystem: template.designSystem
      ? JSON.parse(JSON.stringify(template.designSystem))
      : ensureTemplateDesignSystem(template),
    source: { ...template.source },
    blocks: template.blocks.map(cloneBlock),
  };
}

function createBlockId(type: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${type}-${crypto.randomUUID()}`;
  }

  return `${type}-${Math.random().toString(36).slice(2, 10)}`;
}

function createVersionId() {
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function getCanUndo(
  state: Pick<EditorStore, "undoStack" | "hasPendingEditSessionChanges">,
) {
  return state.undoStack.length > 0 || state.hasPendingEditSessionChanges;
}

function selectionFromBlockId(blockId: string | null): EditorSelection {
  return blockId ? { kind: "block", blockId } : { kind: "none" };
}

function getSelectedBlockIdFromSelection(selection: EditorSelection) {
  if (selection.kind === "none") return null;
  return selection.blockId;
}

function resolveSelectionAfterTemplateChange(
  blocks: EditorBlock[],
  selection: EditorSelection,
  selectedBlockId: string | null,
) {
  const desiredBlockId =
    getSelectedBlockIdFromSelection(selection) ?? selectedBlockId;

  if (desiredBlockId && blocks.some((block) => block.id === desiredBlockId)) {
    return {
      selectedBlockId: desiredBlockId,
      selection,
    };
  }

  const fallbackBlockId = blocks[0]?.id ?? null;
  return {
    selectedBlockId: fallbackBlockId,
    selection: selectionFromBlockId(fallbackBlockId),
  };
}

function withUndo(state: EditorStore) {
  let nextUndo = [...state.undoStack];

  if (state.activeEditSession && state.hasPendingEditSessionChanges) {
    nextUndo.push(cloneTemplate(state.activeEditSession.snapshot));
  }

  if (state.template) {
    nextUndo.push(cloneTemplate(state.template));
  }

  nextUndo = nextUndo.slice(-MAX_UNDO);

  return {
    undoStack: nextUndo,
    redoStack: [],
    canUndo: nextUndo.length > 0,
    canRedo: false,
    isDirty: true,
    saveStatus: "idle" as const,
    hasConflict: false,
    saveErrorMessage: null,
  };
}

export const useEditorStore = create<EditorStore>((set) => ({
  template: null,
  selectedBlockId: null,
  selection: { kind: "none" },
  editorMode: "select",
  activeEditSession: null,
  hasPendingEditSessionChanges: false,
  previewMode: "desktop",
  previewOpen: false,
  previewZoom: 100,
  previewRefreshKey: 0,
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  isDirty: false,
  saveStatus: "idle",
  lastSavedAt: null,
  hasConflict: false,
  saveErrorMessage: null,
  persistenceRevision: null,
  publishedAt: null,
  publishedVersionId: null,
  savedAt: null,
  versionHistory: [],
  versionPanelOpen: false,

  hydrateTemplate: (template) => {
    const versions = loadVersionHistory(template.id);
    const firstBlockId = template.blocks[0]?.id ?? null;

    set({
      template: cloneTemplate(template),
      selectedBlockId: firstBlockId,
      selection: selectionFromBlockId(firstBlockId),
      editorMode: "select",
      activeEditSession: null,
      hasPendingEditSessionChanges: false,
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      isDirty: false,
      saveStatus: "idle",
      lastSavedAt: null,
      hasConflict: false,
      saveErrorMessage: null,
      persistenceRevision: null,
      publishedAt: null,
      publishedVersionId: null,
      savedAt: null,
      versionHistory: versions,
    });
  },

  setSelectedBlockId: (blockId) =>
    set({
      selectedBlockId: blockId,
      selection: selectionFromBlockId(blockId),
    }),

  setSelection: (selection) =>
    set({
      selection,
      selectedBlockId: getSelectedBlockIdFromSelection(selection),
    }),

  selectBlock: (blockId) =>
    set({
      selectedBlockId: blockId,
      selection: { kind: "block", blockId },
    }),

  selectRegion: (blockId, regionId) =>
    set({
      selectedBlockId: blockId,
      selection: { kind: "region", blockId, regionId },
    }),

  selectToken: (blockId, occurrenceId) =>
    set({
      selectedBlockId: blockId,
      selection: { kind: "token", blockId, occurrenceId },
    }),

  clearSelection: () =>
    set({
      selectedBlockId: null,
      selection: { kind: "none" },
    }),

  setEditorMode: (editorMode) => set({ editorMode }),

  beginEditSession: () =>
    set((state) => {
      if (!state.template || state.activeEditSession) return state;
      return {
        activeEditSession: { snapshot: cloneTemplate(state.template) },
        hasPendingEditSessionChanges: false,
      };
    }),

  commitEditSession: () =>
    set((state) => {
      if (!state.activeEditSession) return state;

      if (!state.hasPendingEditSessionChanges) {
        return {
          activeEditSession: null,
          hasPendingEditSessionChanges: false,
          canUndo: getCanUndo({
            undoStack: state.undoStack,
            hasPendingEditSessionChanges: false,
          }),
        };
      }

      const nextUndo = [
        ...state.undoStack.slice(-(MAX_UNDO - 1)),
        cloneTemplate(state.activeEditSession.snapshot),
      ];

      return {
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        undoStack: nextUndo,
        redoStack: [],
        canUndo: nextUndo.length > 0,
        canRedo: false,
        isDirty: true,
        saveStatus: "idle",
        hasConflict: false,
        saveErrorMessage: null,
      };
    }),

  cancelEditSession: () =>
    set((state) => {
      if (!state.activeEditSession) return state;

      const template = cloneTemplate(state.activeEditSession.snapshot);
      const nextSelection = resolveSelectionAfterTemplateChange(
        template.blocks,
        state.selection,
        state.selectedBlockId,
      );

      return {
        template,
        ...nextSelection,
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        canUndo: state.undoStack.length > 0,
      };
    }),

  setPreviewMode: (previewMode) => set({ previewMode }),
  togglePreview: () => set((state) => ({ previewOpen: !state.previewOpen })),
  setPreviewZoom: (zoom) =>
    set({ previewZoom: Math.max(50, Math.min(150, zoom)) }),
  refreshPreview: () =>
    set((state) => ({ previewRefreshKey: state.previewRefreshKey + 1 })),

  undo: () =>
    set((state) => {
      if (
        state.activeEditSession &&
        state.hasPendingEditSessionChanges &&
        state.template
      ) {
        const template = cloneTemplate(state.activeEditSession.snapshot);
        const nextRedo = [...state.redoStack, cloneTemplate(state.template)];
        const nextSelection = resolveSelectionAfterTemplateChange(
          template.blocks,
          state.selection,
          state.selectedBlockId,
        );

        return {
          template,
          ...nextSelection,
          activeEditSession: null,
          hasPendingEditSessionChanges: false,
          redoStack: nextRedo,
          canUndo: state.undoStack.length > 0,
          canRedo: nextRedo.length > 0,
          isDirty: true,
          saveStatus: "idle",
          hasConflict: false,
          saveErrorMessage: null,
        };
      }

      if (state.undoStack.length === 0 || !state.template) return state;

      const previousTemplate = cloneTemplate(
        state.undoStack[state.undoStack.length - 1],
      );
      const nextRedo = [...state.redoStack, cloneTemplate(state.template)];
      const nextUndo = state.undoStack.slice(0, -1);
      const nextSelection = resolveSelectionAfterTemplateChange(
        previousTemplate.blocks,
        state.selection,
        state.selectedBlockId,
      );

      return {
        template: previousTemplate,
        ...nextSelection,
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        undoStack: nextUndo,
        redoStack: nextRedo,
        canUndo: getCanUndo({
          undoStack: nextUndo,
          hasPendingEditSessionChanges: false,
        }),
        canRedo: nextRedo.length > 0,
        isDirty: true,
        saveStatus: "idle",
        hasConflict: false,
        saveErrorMessage: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0 || !state.template) return state;

      const nextTemplate = cloneTemplate(
        state.redoStack[state.redoStack.length - 1],
      );
      const nextUndo = [...state.undoStack, cloneTemplate(state.template)];
      const nextRedo = state.redoStack.slice(0, -1);
      const nextSelection = resolveSelectionAfterTemplateChange(
        nextTemplate.blocks,
        state.selection,
        state.selectedBlockId,
      );

      return {
        template: nextTemplate,
        ...nextSelection,
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        undoStack: nextUndo,
        redoStack: nextRedo,
        canUndo: nextUndo.length > 0,
        canRedo: nextRedo.length > 0,
        isDirty: true,
        saveStatus: "idle",
        hasConflict: false,
        saveErrorMessage: null,
      };
    }),

  markSaved: (savedAt) =>
    set({
      isDirty: false,
      saveStatus: "saved",
      hasConflict: false,
      saveErrorMessage: null,
      lastSavedAt: savedAt ?? new Date().toISOString(),
      savedAt: savedAt ?? new Date().toISOString(),
    }),

  setSaveStatus: (status, message) =>
    set({
      saveStatus: status,
      hasConflict: status === "conflict",
      saveErrorMessage: message ?? null,
    }),

  setVersionHistory: (entries) => set({ versionHistory: entries }),

  syncPersistenceMetadata: ({
    revision,
    lastSavedAt,
    publishedAt,
    publishedVersionId,
  }) =>
    set((state) => ({
      persistenceRevision: revision ?? state.persistenceRevision,
      lastSavedAt: lastSavedAt ?? state.lastSavedAt,
      savedAt: lastSavedAt ?? state.savedAt,
      publishedAt: publishedAt ?? state.publishedAt,
      publishedVersionId: publishedVersionId ?? state.publishedVersionId,
    })),

  saveVersion: (label) =>
    set((state) => {
      if (!state.template) return state;

      const entry: VersionEntry = {
        id: createVersionId(),
        label: label ?? `Version ${state.versionHistory.length + 1}`,
        savedAt: new Date().toISOString(),
        blocks: state.template.blocks.map(cloneBlock),
        snapshot: cloneTemplate(state.template),
      };

      const nextHistory = [
        ...state.versionHistory.slice(-(MAX_VERSIONS - 1)),
        entry,
      ];
      persistVersionHistory(state.template.id, nextHistory);

      return { versionHistory: nextHistory };
    }),

  restoreVersion: (id) =>
    set((state) => {
      if (!state.template) return state;

      const entry = state.versionHistory.find((version) => version.id === id);
      if (!entry) return state;

      const template = entry.snapshot
        ? cloneTemplate(entry.snapshot)
        : { ...state.template, blocks: entry.blocks.map(cloneBlock) };
      const nextSelection = resolveSelectionAfterTemplateChange(
        template.blocks,
        state.selection,
        state.selectedBlockId,
      );

      return {
        template,
        ...nextSelection,
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  deleteVersion: (id) =>
    set((state) => {
      if (!state.template) return state;

      const nextHistory = state.versionHistory.filter(
        (version) => version.id !== id,
      );
      persistVersionHistory(state.template.id, nextHistory);
      return { versionHistory: nextHistory };
    }),

  toggleVersionPanel: () =>
    set((state) => ({ versionPanelOpen: !state.versionPanelOpen })),

  setCategory: (category) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: { ...state.template, category },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  insertBlock: (preset, index) =>
    set((state) => {
      if (!state.template) return state;

      const nextBlock: EditorBlock = {
        id: createBlockId(preset.type),
        type: preset.type,
        props: { ...preset.props },
        bindings: {},
        repeater: null,
        children: [],
      };

      const blocks = [...state.template.blocks];
      const insertionIndex =
        typeof index === "number"
          ? Math.max(0, Math.min(index, blocks.length))
          : blocks.length;
      blocks.splice(insertionIndex, 0, nextBlock);

      return {
        template: { ...state.template, blocks },
        selectedBlockId: nextBlock.id,
        selection: { kind: "block", blockId: nextBlock.id },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  moveBlock: (activeId, overId) =>
    set((state) => {
      if (!state.template || activeId === overId) return state;

      const activeIndex = state.template.blocks.findIndex(
        (block) => block.id === activeId,
      );
      const overIndex = state.template.blocks.findIndex(
        (block) => block.id === overId,
      );
      if (activeIndex < 0 || overIndex < 0) return state;

      return {
        template: {
          ...state.template,
          blocks: arrayMove(state.template.blocks, activeIndex, overIndex),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  moveBlockUp: (blockId) =>
    set((state) => {
      if (!state.template) return state;

      const index = state.template.blocks.findIndex(
        (block) => block.id === blockId,
      );
      if (index <= 0) return state;

      return {
        template: {
          ...state.template,
          blocks: arrayMove(state.template.blocks, index, index - 1),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  moveBlockDown: (blockId) =>
    set((state) => {
      if (!state.template) return state;

      const index = state.template.blocks.findIndex(
        (block) => block.id === blockId,
      );
      if (index < 0 || index >= state.template.blocks.length - 1) return state;

      return {
        template: {
          ...state.template,
          blocks: arrayMove(state.template.blocks, index, index + 1),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  duplicateBlock: (blockId) =>
    set((state) => {
      if (!state.template) return state;

      const index = state.template.blocks.findIndex(
        (block) => block.id === blockId,
      );
      if (index < 0) return state;

      const clone = {
        ...cloneBlock(state.template.blocks[index]),
        id: createBlockId(state.template.blocks[index].type),
      };

      const blocks = [...state.template.blocks];
      blocks.splice(index + 1, 0, clone);

      return {
        template: { ...state.template, blocks },
        selectedBlockId: clone.id,
        selection: { kind: "block", blockId: clone.id },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  updateBlockProp: (blockId, key, value) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: {
          ...state.template,
          blocks: state.template.blocks.map((block) =>
            block.id === blockId
              ? { ...block, props: { ...block.props, [key]: value } }
              : block,
          ),
        },
        hasPendingEditSessionChanges: state.activeEditSession
          ? true
          : state.hasPendingEditSessionChanges,
        canUndo: state.activeEditSession
          ? true
          : getCanUndo({
              undoStack: state.undoStack,
              hasPendingEditSessionChanges: state.hasPendingEditSessionChanges,
            }),
        isDirty: true,
      };
    }),

  replaceHtmlVar: (blockId, occurrenceId, newPath) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: {
          ...state.template,
          blocks: state.template.blocks.map((block) => {
            if (block.id !== blockId) return block;
            const html = String(block.props["html"] ?? "");
            return {
              ...block,
              props: {
                ...block.props,
                html: replaceHtmlVarOccurrence(html, occurrenceId, newPath),
              },
            };
          }),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  replaceColorInAllBlocks: (oldHex, newHex) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: {
          ...state.template,
          blocks: state.template.blocks.map((block) => {
            if (block.type !== "customHtml") return block;
            const html = String(block.props["html"] ?? "");
            return {
              ...block,
              props: {
                ...block.props,
                html: replaceColorInHtml(html, oldHex, newHex),
              },
            };
          }),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  replaceFontInAllBlocks: (oldFont, newFont) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: {
          ...state.template,
          blocks: state.template.blocks.map((block) => {
            if (block.type !== "customHtml") return block;
            const html = String(block.props["html"] ?? "");
            return {
              ...block,
              props: {
                ...block.props,
                html: replaceFontInHtml(html, oldFont, newFont),
              },
            };
          }),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  updateDesignSystem: (updater) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: updateTemplateDesignSystem(state.template, updater),
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  applyThemePreset: (themeId) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: applyThemePresetToTemplate(state.template, themeId),
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  saveCurrentTheme: (name) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: saveCurrentThemeAsCustomTheme(state.template, name),
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  duplicateActiveTheme: () =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: duplicateActiveTemplateTheme(state.template),
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  resetTheme: () =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: applyThemePresetToTemplate(state.template, "modern-light"),
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  updateBlockBinding: (blockId, key, binding) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: {
          ...state.template,
          blocks: state.template.blocks.map((block) =>
            block.id === blockId
              ? {
                  ...block,
                  bindings: {
                    ...block.bindings,
                    [key]: {
                      ...binding,
                      segments: binding.segments.map((segment) => ({
                        ...segment,
                      })),
                      format: { ...binding.format },
                    },
                  },
                }
              : block,
          ),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  clearBlockBinding: (blockId, key) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: {
          ...state.template,
          blocks: state.template.blocks.map((block) => {
            if (block.id !== blockId || !block.bindings) return block;
            const nextBindings = { ...block.bindings };
            delete nextBindings[key];
            return {
              ...block,
              bindings: Object.keys(nextBindings).length
                ? nextBindings
                : undefined,
            };
          }),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  updateBlockRepeater: (blockId, repeater) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: {
          ...state.template,
          blocks: state.template.blocks.map((block) =>
            block.id === blockId
              ? { ...block, repeater: { ...repeater } }
              : block,
          ),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  clearBlockRepeater: (blockId) =>
    set((state) => {
      if (!state.template) return state;

      return {
        template: {
          ...state.template,
          blocks: state.template.blocks.map((block) =>
            block.id === blockId ? { ...block, repeater: null } : block,
          ),
        },
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),

  removeBlock: (blockId) =>
    set((state) => {
      if (!state.template) return state;

      const blocks = state.template.blocks.filter(
        (block) => block.id !== blockId,
      );
      const nextSelection = resolveSelectionAfterTemplateChange(
        blocks,
        state.selection,
        state.selectedBlockId === blockId ? null : state.selectedBlockId,
      );

      return {
        template: { ...state.template, blocks },
        ...nextSelection,
        activeEditSession: null,
        hasPendingEditSessionChanges: false,
        ...withUndo(state),
      };
    }),
}));
