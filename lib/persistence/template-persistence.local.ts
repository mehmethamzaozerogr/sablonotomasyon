import type {
  PublishInput,
  PublishResult,
  RestoreVersionInput,
  SaveDraftInput,
  SaveDraftResult,
  TemplateDocumentMetadata,
  TemplateDraftDocument,
  TemplateVersionSnapshot,
} from "@/lib/persistence/template-persistence.types";
import type { TemplatePersistenceGateway } from "@/lib/persistence/template-persistence.gateway";

function draftKey(templateId: string) {
  return `sablongpt:persistence:draft:${templateId}`;
}

function versionsKey(templateId: string) {
  return `sablongpt:persistence:versions:${templateId}`;
}

function publishedKey(templateId: string) {
  return `sablongpt:persistence:published:${templateId}`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage quota or serialization errors are handled by caller status.
  }
}

function createVersionId() {
  return `ver_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function upsertVersion(templateId: string, version: TemplateVersionSnapshot) {
  const versions = readJson<TemplateVersionSnapshot[]>(
    versionsKey(templateId),
    [],
  );
  const next = [...versions, version].slice(-50);
  writeJson(versionsKey(templateId), next);
  return next;
}

export class LocalTemplatePersistenceGateway implements TemplatePersistenceGateway {
  async getDraft(templateId: string): Promise<TemplateDraftDocument | null> {
    return readJson<TemplateDraftDocument | null>(draftKey(templateId), null);
  }

  async saveDraft(input: SaveDraftInput): Promise<SaveDraftResult> {
    const existing = await this.getDraft(input.metadata.templateId);

    if (
      existing &&
      input.baseRevision !== null &&
      input.baseRevision !== existing.metadata.revision
    ) {
      return {
        ok: false,
        reason: "conflict",
        message: "Draft kaydi daha yeni bir revizyona sahip.",
        strategy: "local",
        latestDocument: existing,
      };
    }

    const nextMetadata: TemplateDocumentMetadata = {
      ...input.metadata,
      revision: (existing?.metadata.revision ?? input.metadata.revision) + 1,
      savedAt: nowIso(),
      updatedAt: nowIso(),
    };

    const document: TemplateDraftDocument = {
      metadata: nextMetadata,
      template: clone(input.template),
    };

    writeJson(draftKey(input.metadata.templateId), document);

    return {
      ok: true,
      document,
      strategy: "local",
    };
  }

  async createVersion(
    templateId: string,
    label: string,
    note?: string,
  ): Promise<TemplateVersionSnapshot | null> {
    const draft = await this.getDraft(templateId);
    if (!draft) {
      return null;
    }

    const version: TemplateVersionSnapshot = {
      id: createVersionId(),
      templateId,
      label,
      note: note ?? null,
      createdAt: nowIso(),
      revision: draft.metadata.revision,
      snapshot: clone(draft.template),
    };

    upsertVersion(templateId, version);
    return version;
  }

  async listVersions(templateId: string): Promise<TemplateVersionSnapshot[]> {
    return readJson<TemplateVersionSnapshot[]>(versionsKey(templateId), []);
  }

  async publishDraft(input: PublishInput): Promise<PublishResult> {
    const draft = await this.getDraft(input.templateId);
    if (!draft) {
      return {
        ok: false,
        reason: "validation",
        message: "Yayinlamak icin once draft kaydi gerekli.",
        strategy: "local",
      };
    }

    if (draft.metadata.revision !== input.baseRevision) {
      return {
        ok: false,
        reason: "conflict",
        message: "Yayinlama onceki revizyona ait. Lutfen yeniden kaydedin.",
        strategy: "local",
        latestDocument: draft,
      };
    }

    const publishedVersion: TemplateVersionSnapshot = {
      id: createVersionId(),
      templateId: input.templateId,
      label: `Published · ${new Date().toLocaleString("tr-TR")}`,
      note: input.publishNote ?? null,
      createdAt: nowIso(),
      revision: draft.metadata.revision,
      snapshot: clone(draft.template),
    };

    const nextMetadata: TemplateDocumentMetadata = {
      ...draft.metadata,
      publishedAt: publishedVersion.createdAt,
      publishedVersionId: publishedVersion.id,
      versionNote: input.publishNote ?? null,
      updatedAt: nowIso(),
    };

    const nextDocument: TemplateDraftDocument = {
      metadata: nextMetadata,
      template: clone(draft.template),
    };

    writeJson(draftKey(input.templateId), nextDocument);
    writeJson(publishedKey(input.templateId), publishedVersion);
    upsertVersion(input.templateId, publishedVersion);

    return {
      ok: true,
      document: nextDocument,
      publishedVersion,
      strategy: "local",
    };
  }

  async restoreVersion(input: RestoreVersionInput): Promise<SaveDraftResult> {
    const versions = await this.listVersions(input.templateId);
    const target = versions.find((entry) => entry.id === input.versionId);

    if (!target) {
      return {
        ok: false,
        reason: "validation",
        message: "Geri yuklenecek surum bulunamadi.",
        strategy: "local",
      };
    }

    const draft = await this.getDraft(input.templateId);
    const nextMetadata: TemplateDocumentMetadata = {
      ...(draft?.metadata ?? {
        templateId: input.templateId,
        templateName: target.snapshot.name,
        subject: target.snapshot.subject,
        category: target.snapshot.category,
        sourceTemplateType: target.snapshot.source.templateType,
        sourceTemplateId: target.snapshot.source.templateId,
        updatedAt: nowIso(),
        savedAt: nowIso(),
        publishedAt: null,
        publishedVersionId: null,
        versionNote: null,
        revision: 0,
      }),
      revision: (draft?.metadata.revision ?? 0) + 1,
      updatedAt: nowIso(),
      savedAt: nowIso(),
      versionNote: `Restored from ${target.label}`,
    };

    const nextDocument: TemplateDraftDocument = {
      metadata: nextMetadata,
      template: clone(target.snapshot),
    };

    writeJson(draftKey(input.templateId), nextDocument);

    return {
      ok: true,
      document: nextDocument,
      strategy: "local",
    };
  }
}

let singleton: LocalTemplatePersistenceGateway | null = null;

export function getLocalTemplatePersistenceGateway() {
  if (!singleton) {
    singleton = new LocalTemplatePersistenceGateway();
  }
  return singleton;
}
