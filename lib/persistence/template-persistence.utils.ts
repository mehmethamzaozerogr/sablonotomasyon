import type { TemplateDocumentMetadata } from "@/lib/persistence/template-persistence.types";
import type { TemplateRecord } from "@/types/template";

type MetadataOverride = Partial<TemplateDocumentMetadata>;

export function createTemplateDocumentMetadata(
  template: TemplateRecord,
  override: MetadataOverride = {},
): TemplateDocumentMetadata {
  return {
    templateId: template.id,
    templateName: template.name,
    subject: template.subject,
    category: template.category,
    sourceTemplateType: template.source.templateType,
    sourceTemplateId: template.source.templateId,
    updatedAt: template.updatedAt || new Date().toISOString(),
    savedAt: null,
    publishedAt: null,
    publishedVersionId: null,
    versionNote: null,
    revision: 0,
    ...override,
  };
}
