"use client";

import { Clock, Eye, RotateCcw, X } from "lucide-react";

import { compilePreviewHtml } from "@/lib/preview/compile-preview";
import { getLocalTemplatePersistenceGateway } from "@/lib/persistence/template-persistence.local";
import type { TemplateVersionSnapshot } from "@/lib/persistence/template-persistence.types";
import { useEditorStore } from "@/stores/editor-store";
import { toast } from "@/stores/toast-store";

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

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

type VersionHistoryPanelProps = {
  sourceData: unknown;
};

export function VersionHistoryPanel({ sourceData }: VersionHistoryPanelProps) {
  const template = useEditorStore((s) => s.template);
  const previewMode = useEditorStore((s) => s.previewMode);
  const persistenceRevision = useEditorStore((s) => s.persistenceRevision);
  const publishedVersionId = useEditorStore((s) => s.publishedVersionId);
  const versionHistory = useEditorStore((s) => s.versionHistory);
  const versionPanelOpen = useEditorStore((s) => s.versionPanelOpen);
  const hydrateTemplate = useEditorStore((s) => s.hydrateTemplate);
  const setSaveStatus = useEditorStore((s) => s.setSaveStatus);
  const markSaved = useEditorStore((s) => s.markSaved);
  const setVersionHistory = useEditorStore((s) => s.setVersionHistory);
  const syncPersistenceMetadata = useEditorStore(
    (s) => s.syncPersistenceMetadata,
  );
  const toggleVersionPanel = useEditorStore((s) => s.toggleVersionPanel);

  async function handleRestore(versionId: string, label: string) {
    if (!template) return;

    try {
      setSaveStatus("saving");
      const gateway = getLocalTemplatePersistenceGateway();
      const result = await gateway.restoreVersion({
        templateId: template.id,
        versionId,
        baseRevision: persistenceRevision,
      });

      if (!result.ok) {
        if (result.reason === "conflict") {
          setSaveStatus("conflict", result.message);
        } else {
          setSaveStatus("error", result.message);
        }
        toast(result.message || "Geri yukleme basarisiz", "error");
        return;
      }

      hydrateTemplate(result.document.template);
      syncPersistenceMetadata({
        revision: result.document.metadata.revision,
        lastSavedAt: result.document.metadata.savedAt,
        publishedAt: result.document.metadata.publishedAt,
        publishedVersionId: result.document.metadata.publishedVersionId,
      });
      markSaved(result.document.metadata.savedAt ?? undefined);

      const draft = await gateway.getDraft(template.id);
      const versions = await gateway.listVersions(template.id);
      setVersionHistory(
        versions.map((entry) =>
          toVersionEntry(entry, draft?.metadata.publishedVersionId ?? null),
        ),
      );
      toast(`"${label}" geri yuklendi`, "success");
    } catch {
      setSaveStatus("error", "Geri yukleme basarisiz");
      toast("Geri yukleme basarisiz", "error");
    }
  }

  function handlePreview(versionId: string) {
    const version = versionHistory.find((entry) => entry.id === versionId);
    if (!version?.snapshot) {
      toast("Onizleme verisi bulunamadi", "error");
      return;
    }

    const html = compilePreviewHtml(version.snapshot, sourceData, {
      mode: previewMode,
    });
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      toast("Onizleme penceresi acilamadi", "error");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  if (!versionPanelOpen) return null;

  return (
    <div className="bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Sürüm geçmişi
          </span>
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {versionHistory.length}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleVersionPanel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto border-t border-border scrollbar-thin">
        {versionHistory.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Henüz sürüm yok. Ctrl+Shift+S ile anlık kopya alın.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {[...versionHistory].reverse().map((v, i) => (
              <div
                key={v.id}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/8 text-[10px] font-bold text-primary">
                  {versionHistory.length - i}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">
                    {v.label}
                    {v.isPublished || v.id === publishedVersionId ? (
                      <span className="ml-1 rounded-md border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold uppercase text-emerald-700">
                        aktif
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTime(v.savedAt)} · {v.blocks.length} blok
                    {v.note ? ` · ${v.note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  title="Onizle"
                  onClick={() => handlePreview(v.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-slate-100 hover:text-slate-700"
                >
                  <Eye className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  title="Geri yükle"
                  onClick={() => void handleRestore(v.id, v.label)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/8 hover:text-primary"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
