import { AlertTriangle } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

type StudioErrorStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  detail?: string;
};

export function StudioErrorState({ eyebrow, title, description, detail }: StudioErrorStateProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-100 p-2 text-red-500">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Hata detayı</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {detail ?? "data/sources klasöründeki veri dosyaları kontrol edilmeden işleme devam edilemedi."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
