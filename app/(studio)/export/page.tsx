import { StudioErrorState } from "@/components/layout/studio-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { ExportActions } from "@/components/export/export-actions";
import {
  formatStudioError,
  getCategoryDataMap,
  getWorkbookTemplates,
} from "@/lib/studio/server-data";

export default function ExportPage() {
  try {
    const templates = getWorkbookTemplates();
    const categorySources = getCategoryDataMap();

    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <PageHeader
          eyebrow="Dışa aktarma"
          title="HTML ve XLSX Dışa Aktarım Merkezi"
          description="Her şablon derlenmiş HTML olarak indirilebilir. Tüm şablonlar toplu biçimde MessageTemplate formatında XLSX olarak da dışa aktarılabilir."
          actions={
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {templates.length} şablon
            </span>
          }
        />
        <ExportActions templates={templates} categorySources={categorySources} />
      </div>
    );
  } catch (error) {
    const hata = formatStudioError(error);

    return (
      <StudioErrorState
        eyebrow="Dışa aktarma hatası"
        title={hata.title}
        description="Dışa aktarım listesi hazırlanamadı. Workbook ve data/sources klasörü kontrol edilmelidir."
        detail={hata.detail}
      />
    );
  }
}
