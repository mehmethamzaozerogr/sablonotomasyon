import type { TemplateCategory, TemplateRecord } from "@/types/template";

export type SaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error"
  | "offline"
  | "conflict";

export type PersistenceStrategy = "local" | "remote" | "hybrid";

export type TemplateDocumentMetadata = {
  templateId: string;
  templateName: string;
  subject: string;
  category: TemplateCategory;
  sourceTemplateType: string;
  sourceTemplateId: string;
  updatedAt: string;
  savedAt: string | null;
  publishedAt: string | null;
  publishedVersionId: string | null;
  versionNote: string | null;
  revision: number;
};

export type TemplateDraftDocument = {
  metadata: TemplateDocumentMetadata;
  template: TemplateRecord;
};

export type TemplateVersionSnapshot = {
  id: string;
  templateId: string;
  label: string;
  note: string | null;
  createdAt: string;
  revision: number;
  snapshot: TemplateRecord;
};

export type SaveDraftInput = {
  template: TemplateRecord;
  metadata: TemplateDocumentMetadata;
  baseRevision: number | null;
  idempotencyKey?: string;
};

export type SaveDraftResult =
  | {
      ok: true;
      document: TemplateDraftDocument;
      strategy: PersistenceStrategy;
    }
  | {
      ok: false;
      reason: "conflict" | "validation" | "network" | "unknown";
      message: string;
      strategy: PersistenceStrategy;
      latestDocument?: TemplateDraftDocument;
    };

export type PublishInput = {
  templateId: string;
  baseRevision: number;
  publishNote?: string;
};

export type PublishResult =
  | {
      ok: true;
      publishedVersion: TemplateVersionSnapshot;
      document: TemplateDraftDocument;
      strategy: PersistenceStrategy;
    }
  | {
      ok: false;
      reason: "conflict" | "validation" | "network" | "unknown";
      message: string;
      strategy: PersistenceStrategy;
      latestDocument?: TemplateDraftDocument;
    };

export type RestoreVersionInput = {
  templateId: string;
  versionId: string;
  baseRevision: number | null;
};
