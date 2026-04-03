import type {
  PublishInput,
  PublishResult,
  RestoreVersionInput,
  SaveDraftInput,
  SaveDraftResult,
  TemplateDraftDocument,
  TemplateVersionSnapshot,
} from "@/lib/persistence/template-persistence.types";

export interface TemplatePersistenceGateway {
  getDraft(templateId: string): Promise<TemplateDraftDocument | null>;
  saveDraft(input: SaveDraftInput): Promise<SaveDraftResult>;
  createVersion(
    templateId: string,
    label: string,
    note?: string,
  ): Promise<TemplateVersionSnapshot | null>;
  listVersions(templateId: string): Promise<TemplateVersionSnapshot[]>;
  publishDraft(input: PublishInput): Promise<PublishResult>;
  restoreVersion(input: RestoreVersionInput): Promise<SaveDraftResult>;
}
