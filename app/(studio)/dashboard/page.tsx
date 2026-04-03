import Link from "next/link";
import { ArrowUpRight, Download, Layers2 } from "lucide-react";

import { StudioErrorState } from "@/components/layout/studio-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/primitives/metric-card";
import { TemplateFilter } from "@/components/templates/template-filter";
import { ImportTemplatesDialog } from "@/components/templates/import-templates-dialog";
import {
  formatStudioError,
  getCategoryCounts,
  getStudioStats,
  getWorkbookTemplates,
} from "@/lib/studio/server-data";

export default function DashboardPage() {
  try {
    const templates = getWorkbookTemplates();
    const studioStats = getStudioStats();
    const categoryCounts = getCategoryCounts();

    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <PageHeader
          eyebrow="Genel görünüm"
          title="MessageTemplate kayıtlarını yerel dosyalardan yönetin"
          description="Panel, SCB-6 Güncel.xlsx içindeki MessageTemplate satırlarını ve kategoriye özel JSON kaynaklarını birlikte kullanır."
          actions={
            <>
              <ImportTemplatesDialog />
              <Link
                href="/export"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground transition-colors hover:bg-gray-50"
              >
                Dışa aktarım merkezi
                <Download className="h-3.5 w-3.5" />
              </Link>
              {templates[0] ? (
                <Link
                  href={`/templates/${templates[0].id}`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  Editörü aç
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </>
          }
        />

        <section className="grid gap-4 xl:grid-cols-3">
          {studioStats.map((stat) => (
            <MetricCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} />
          ))}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-primary/8 p-2 text-primary">
              <Layers2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Şablon listesi</p>
              <p className="text-xs text-muted-foreground">
                data/sources klasöründeki workbook satırları ve kategori dağılımı.
              </p>
            </div>
          </div>
          <TemplateFilter templates={templates} categoryCounts={categoryCounts} />
        </section>
      </div>
    );
  } catch (error) {
    const hata = formatStudioError(error);

    return (
      <StudioErrorState
        eyebrow="Veri hatası"
        title={hata.title}
        description="Panel açılamadı. data/sources klasöründeki veri dosyaları okunamadı."
        detail={hata.detail}
      />
    );
  }
}
