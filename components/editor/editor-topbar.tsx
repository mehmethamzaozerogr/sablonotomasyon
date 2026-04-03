"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Clock,
  Columns2,
  Code2,
  Eye,
  EyeOff,
  History,
  PencilRuler,
  Redo2,
  Save,
  Send,
  Settings2,
  Undo2,
} from "lucide-react";

import { categoryMeta, previewModeOptions } from "@/lib/constants";
import { getLocalTemplatePersistenceGateway } from "@/lib/persistence/template-persistence.local";
import type { TemplateVersionSnapshot } from "@/lib/persistence/template-persistence.types";
import { createTemplateDocumentMetadata } from "@/lib/persistence/template-persistence.utils";
import {
  runTemplateValidation,
  type TemplateValidationResult,
} from "@/lib/validation/template-validation";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";
import type {
  PreviewMode,
  TemplateCategory,
  TemplateRecord,
} from "@/types/template";
import { PublishChecklistDialog } from "@/components/editor/publish-checklist-dialog";

type EditorTopbarProps = {
  template: TemplateRecord;
  previewMode: PreviewMode;
  sourceData: unknown;
  previewOpen: boolean;
  workspaceMode: "edit" | "preview" | "split";
  selectionPath: string;
  modeLabel: string;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onCategoryChange: (category: TemplateCategory) => void;
  onTogglePreview: () => void;
  onWorkspaceModeChange: (mode: "edit" | "preview" | "split") => void;
  onFocusBlock?: (blockId: string) => void;
};

export function EditorTopbar({
  template,
  previewMode,
  sourceData,
  previewOpen,
  workspaceMode,
  selectionPath,
  modeLabel,
  onPreviewModeChange,
  onCategoryChange,
  onTogglePreview,
  onWorkspaceModeChange,
  onFocusBlock,
}: EditorTopbarProps) {
  const isDirty = useEditorStore((state) => state.isDirty);
  const saveStatus = useEditorStore((state) => state.saveStatus);
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt);
  const saveErrorMessage = useEditorStore((state) => state.saveErrorMessage);
  const hasConflict = useEditorStore((state) => state.hasConflict);
  const persistenceRevision = useEditorStore(
    (state) => state.persistenceRevision,
  );
  const publishedAt = useEditorStore((state) => state.publishedAt);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const setSaveStatus = useEditorStore((state) => state.setSaveStatus);
  const setVersionHistory = useEditorStore((state) => state.setVersionHistory);
  const syncPersistenceMetadata = useEditorStore(
    (state) => state.syncPersistenceMetadata,
  );
  const toggleVersionPanel = useEditorStore(
    (state) => state.toggleVersionPanel,
  );
  const markSaved = useEditorStore((state) => state.markSaved);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [publishChecklistOpen, setPublishChecklistOpen] = useState(false);
  const [publishChecklistResult, setPublishChecklistResult] =
    useState<TemplateValidationResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

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

  function formatRelativeSavedAt(iso: string | null) {
    if (!iso) return "";
    const delta = Math.max(
      0,
      Math.floor((nowTick - new Date(iso).getTime()) / 1000),
    );
    if (delta < 5) return "az once";
    if (delta < 60) return `${delta} sn once`;
    const minutes = Math.floor(delta / 60);
    if (minutes < 60) return `${minutes} dk once`;
    const hours = Math.floor(minutes / 60);
    return `${hours} sa once`;
  }

  function getStatusLabel() {
    if (saveStatus === "saving") return "Kaydediliyor...";
    if (saveStatus === "saved") {
      const relative = formatRelativeSavedAt(lastSavedAt);
      return relative ? `Kaydedildi ${relative}` : "Kaydedildi";
    }
    if (saveStatus === "error") return "Kaydedilemedi";
    if (saveStatus === "conflict") return "Cakisma var";
    if (isDirty) return "Degisiklik var";
    return "Hazir";
  }

  function getStatusClass() {
    if (saveStatus === "saving") return "border-sky-200 bg-sky-50 text-sky-700";
    if (saveStatus === "saved")
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (saveStatus === "error")
      return "border-rose-200 bg-rose-50 text-rose-700";
    if (saveStatus === "conflict")
      return "border-amber-200 bg-amber-50 text-amber-700";
    if (isDirty) return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  async function refreshVersions() {
    const gateway = getLocalTemplatePersistenceGateway();
    const draft = await gateway.getDraft(template.id);
    const versions = await gateway.listVersions(template.id);
    setVersionHistory(
      versions.map((entry) =>
        toVersionEntry(entry, draft?.metadata.publishedVersionId ?? null),
      ),
    );
  }

  async function persistDraft(overwrite = false, silent = false) {
    if (!isDirty && persistenceRevision !== null && !overwrite) {
      return persistenceRevision;
    }

    setSaveStatus("saving");

    const gateway = getLocalTemplatePersistenceGateway();
    const result = await gateway.saveDraft({
      template,
      metadata: createTemplateDocumentMetadata(template),
      baseRevision: overwrite ? null : persistenceRevision,
    });

    if (!result.ok) {
      if (result.reason === "conflict") {
        setSaveStatus("conflict", result.message);
      } else {
        setSaveStatus("error", result.message);
      }
      if (!silent) {
        toast(result.message || "Save failed", "error");
      }
      return null;
    }

    syncPersistenceMetadata({
      revision: result.document.metadata.revision,
      lastSavedAt: result.document.metadata.savedAt,
      publishedAt: result.document.metadata.publishedAt,
      publishedVersionId: result.document.metadata.publishedVersionId,
    });
    markSaved(result.document.metadata.savedAt ?? undefined);
    if (!silent) {
      toast("Saved", "success");
    }

    return result.document.metadata.revision;
  }

  async function handleSave() {
    if (typeof window === "undefined") return;

    try {
      await persistDraft(false, false);
    } catch {
      setSaveStatus("error", "Save failed");
      toast("Save failed", "error");
    }
  }

  async function handleOverwrite() {
    try {
      const revision = await persistDraft(true, false);
      if (revision !== null) {
        setSaveStatus("saved");
      }
    } catch {
      setSaveStatus("error", "Overwrite failed");
      toast("Overwrite failed", "error");
    }
  }

  async function handleSaveVersion() {
    try {
      const revision = await persistDraft(false, true);
      if (revision === null) return;

      const gateway = getLocalTemplatePersistenceGateway();
      const label = `Version · ${new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      const version = await gateway.createVersion(template.id, label);

      if (!version) {
        toast("Version save failed", "error");
        return;
      }

      await refreshVersions();
      toast("Version saved", "success");
    } catch {
      toast("Version save failed", "error");
    }
  }

  async function handlePublish() {
    setIsPublishing(true);

    try {
      const validationResult = runTemplateValidation(
        template,
        sourceData,
        "publish",
      );
      setPublishChecklistResult(validationResult);

      if (validationResult.hasBlockingErrors) {
        setSaveStatus("error", "Yayin oncesi dogrulama hatasi var.");
        toast("Yayinlama engellendi: once hatalari duzeltin.", "error");
        return;
      }

      const revision = await persistDraft(false, true);
      if (revision === null) {
        return;
      }

      setSaveStatus("saving");
      const gateway = getLocalTemplatePersistenceGateway();
      const publishResult = await gateway.publishDraft({
        templateId: template.id,
        baseRevision: revision,
      });

      if (!publishResult.ok) {
        if (publishResult.reason === "conflict") {
          setSaveStatus("conflict", publishResult.message);
        } else {
          setSaveStatus("error", publishResult.message || "Publish failed");
        }
        toast(publishResult.message || "Publish failed", "error");
        return;
      }

      syncPersistenceMetadata({
        revision: publishResult.document.metadata.revision,
        lastSavedAt: publishResult.document.metadata.savedAt,
        publishedAt: publishResult.document.metadata.publishedAt,
        publishedVersionId: publishResult.document.metadata.publishedVersionId,
      });
      markSaved(publishResult.document.metadata.savedAt ?? undefined);
      await refreshVersions();
      setPublishChecklistOpen(false);
      toast("Yayinlandi", "success");
    } catch {
      setSaveStatus("error", "Publish failed");
      toast("Publish failed", "error");
    } finally {
      setIsPublishing(false);
    }
  }

  function openPublishChecklist() {
    const result = runTemplateValidation(template, sourceData, "publish");
    setPublishChecklistResult(result);
    setPublishChecklistOpen(true);
    if (result.hasBlockingErrors) {
      setSaveStatus("error", "Yayin oncesi dogrulama hatasi var.");
    }
  }

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-border bg-card px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
          title="Back to dashboard"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <h1 className="truncate text-sm font-semibold text-foreground">
            {template.name}
          </h1>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
              getStatusClass(),
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
            {getStatusLabel()}
          </span>
          {publishedAt ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              YAYINDA
            </span>
          ) : null}
        </div>
      </div>

      <div className="mx-auto hidden max-w-xl flex-1 lg:block">
        <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
              {modeLabel}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Current Target
            </span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-foreground">
            {selectionPath}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="hidden items-center gap-1 rounded-xl border border-border bg-muted/40 p-1 xl:flex">
          <button
            type="button"
            onClick={() => onWorkspaceModeChange("edit")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
              workspaceMode === "edit"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
            )}
          >
            <PencilRuler className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onWorkspaceModeChange("split")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
              workspaceMode === "split"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
            )}
          >
            <Columns2 className="h-3.5 w-3.5" />
            Split
          </button>
          <button
            type="button"
            onClick={() => onWorkspaceModeChange("preview")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
              workspaceMode === "preview"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/70 hover:text-foreground",
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => {
              undo();
              toast("Undid last change", "info", 1600);
            }}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              canUndo
                ? "text-foreground hover:bg-white"
                : "cursor-not-allowed text-muted-foreground/40",
            )}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              redo();
              toast("Redid last change", "info", 1600);
            }}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              canRedo
                ? "text-foreground hover:bg-white"
                : "cursor-not-allowed text-muted-foreground/40",
            )}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <select
          value={template.category}
          onChange={(event) =>
            onCategoryChange(event.target.value as TemplateCategory)
          }
          className="hidden h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 xl:block"
        >
          {Object.entries(categoryMeta).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>

        <select
          value={previewMode}
          onChange={(event) =>
            onPreviewModeChange(event.target.value as PreviewMode)
          }
          className="hidden h-8 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 xl:block"
        >
          {previewModeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="mx-1 h-5 w-px bg-border" />

        <button
          type="button"
          onClick={() => void handleSaveVersion()}
          title="Create version snapshot"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
        >
          <History className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleVersionPanel}
          title="Open version history"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onTogglePreview}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors xl:hidden",
            previewOpen
              ? "border-primary/20 bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:bg-gray-100",
          )}
        >
          {previewOpen ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          Preview
        </button>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveStatus === "saving"}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
            isDirty
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              : "border border-border bg-card text-foreground hover:bg-gray-50",
            saveStatus === "saving" && "opacity-60",
          )}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>

        <button
          type="button"
          onClick={openPublishChecklist}
          disabled={saveStatus === "saving" || isPublishing}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
            "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500",
            (saveStatus === "saving" || isPublishing) && "opacity-60",
          )}
        >
          <Send className="h-3.5 w-3.5" />
          Yayinla
        </button>

        {hasConflict ? (
          <div className="hidden items-center gap-1 lg:flex">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-8 rounded-lg border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
            >
              Yeniden Yukle
            </button>
            <button
              type="button"
              onClick={() => void handleOverwrite()}
              className="h-8 rounded-lg border border-amber-300 bg-white px-2.5 text-[11px] font-semibold text-amber-700 transition-colors hover:bg-amber-50"
            >
              Uzerine Yaz
            </button>
          </div>
        ) : null}

        {saveStatus === "error" && saveErrorMessage ? (
          <span className="hidden max-w-[220px] truncate text-[10px] font-medium text-rose-600 lg:inline">
            {saveErrorMessage}
          </span>
        ) : null}

        <Link
          href="/export"
          className="hidden h-8 items-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 lg:flex"
          style={{ padding: "0 12px" }}
        >
          <Code2 className="h-3.5 w-3.5" />
          Export HTML
        </Link>

        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
          title="Settings"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Link>
      </div>

      <PublishChecklistDialog
        open={publishChecklistOpen}
        result={publishChecklistResult}
        publishing={isPublishing}
        onOpenChange={setPublishChecklistOpen}
        onRecheck={openPublishChecklist}
        onConfirmPublish={() => void handlePublish()}
        onFocusBlock={onFocusBlock}
      />
    </header>
  );
}
