import { StudioErrorState } from "@/components/layout/studio-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { ImportFlow } from "@/components/import/import-flow";
import {
  formatStudioError,
  getWorkbookSummary,
  getWorkbookTemplates,
} from "@/lib/studio/server-data";

export default function ImportPage() {
  try {
    const summary = getWorkbookSummary();
    let existingTemplateIds: string[] = [];
    try {
      existingTemplateIds = getWorkbookTemplates().map((t) => t.id);
    } catch {
      // Kritik değil: şablonlar okunamazsa tablo tüm satırları "yeni" olarak gösterir
    }

    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <PageHeader
          eyebrow="İçe aktarma"
          title="Workbook ve MessageTemplate İçe Aktarımı"
          description="Yerel workbook özetini inceleyin ya da harici bir XLSX dosyası yükleyerek MessageTemplate satırlarını önizleyin."
        />
        <ImportFlow summary={summary} existingTemplateIds={existingTemplateIds} />
      </div>
    );
  } catch (error) {
    const hata = formatStudioError(error);

    return (
      <StudioErrorState
        eyebrow="İçe aktarma hatası"
        title={hata.title}
        description="Workbook özeti hazırlanamadı. data/sources klasörü denetlenmelidir."
        detail={hata.detail}
      />
    );
  }
}
