import { redirect } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import { StudioErrorState } from "@/components/layout/studio-error-state";
import {
  formatStudioError,
  getCategoryDataMap,
  getTemplateById,
} from "@/lib/studio/server-data";

type TemplateEditorPageProps = {
  params: Promise<{
    templateId: string;
  }>;
};

export default async function TemplateEditorPage({
  params,
}: TemplateEditorPageProps) {
  const { templateId } = await params;

  let template;
  let categorySources;

  try {
    template = getTemplateById(templateId);
    categorySources = getCategoryDataMap();
  } catch (error) {
    const hata = formatStudioError(error);

    return (
      <StudioErrorState
        eyebrow="Editor hatasi"
        title={hata.title}
        description="Şablon editörü açılamadı. data/sources klasöründeki workbook veya JSON kaynakları okunamadı."
        detail={hata.detail}
      />
    );
  }

  if (!template) {
    redirect("/dashboard");
  }

  return (
    <EditorShell initialTemplate={template} categorySources={categorySources} />
  );
}
