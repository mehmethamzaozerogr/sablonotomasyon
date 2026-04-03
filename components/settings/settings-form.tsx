"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Info, LayoutTemplate, Save, Settings2, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { settingsSchema, type SettingsFormValues } from "@/lib/validators/settings";

// ---------------------------------------------------------------------------
// Toggle row
// ---------------------------------------------------------------------------

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-4 transition-colors hover:bg-gray-50">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">
        <Switch checked={checked} onCheckedChange={onChange} />
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function SettingsForm() {
  const [saved, setSaved] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      studioName: "Şablon Stüdyosu",
      defaultSheetName: "MessageTemplate",
      autosave: true,
      enablePreviewPane: true,
      requireReviewOnExport: false,
    },
  });

  const onSubmit = form.handleSubmit(() => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      {/* Main form card */}
      <div className="rounded-xl border border-border bg-card">
        {/* Card header */}
        <div className="flex items-start gap-4 border-b border-border px-6 py-5">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Stüdyo tercihleri</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Yerel workbook akışı, varsayılan sayfa adı ve editör davranışlarını buradan düzenleyebilirsiniz.
            </p>
          </div>
        </div>

        <form className="space-y-6 p-6" onSubmit={onSubmit}>
          {/* Text fields */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-foreground">Stüdyo adı</label>
              <Input {...form.register("studioName")} placeholder="Şablon Stüdyosu" />
              {form.formState.errors.studioName?.message && (
                <p className="text-xs text-red-500">{form.formState.errors.studioName.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold text-foreground">Varsayılan sayfa adı</label>
              <Input {...form.register("defaultSheetName")} placeholder="MessageTemplate" />
              {form.formState.errors.defaultSheetName?.message && (
                <p className="text-xs text-red-500">{form.formState.errors.defaultSheetName.message}</p>
              )}
            </div>
          </div>

          {/* Toggle settings */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Editör davranışları
            </p>
            <div className="space-y-2.5">
              <ToggleRow
                label="Otomatik kayıt"
                description="Editör değişikliklerini 4 saniye sonra yerel depolama alanına kaydeder."
                checked={form.watch("autosave")}
                onChange={(v) => form.setValue("autosave", v)}
              />
              <ToggleRow
                label="Canlı önizleme varsayılanı"
                description="Editör ilk açıldığında alt önizleme paneli otomatik olarak açılır."
                checked={form.watch("enablePreviewPane")}
                onChange={(v) => form.setValue("enablePreviewPane", v)}
              />
              <ToggleRow
                label="Dışa aktarım onayı"
                description="HTML çıktısı alınmadan önce inceleme adımı gösterilir."
                checked={form.watch("requireReviewOnExport")}
                onChange={(v) => form.setValue("requireReviewOnExport", v)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Ayarlar bu aşamada yerel arayüz durumunda tutulur.
            </p>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Ayarları kaydet
            </Button>
          </div>
        </form>
      </div>

      {/* Info sidebar */}
      <div className="space-y-4">
        {/* Status card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Yerel durum</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Bu panel ileride klasör doğrulama, satır senkronu ve dışa aktarım onay bilgisini gösterecektir.
              </p>
            </div>
          </div>

          {saved && (
            <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs font-medium text-emerald-700">Ayarlar yerel olarak kaydedildi.</p>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Veri kaynağı</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Uygulama yalnızca{" "}
                <span className="font-medium text-foreground">data/sources</span>{" "}
                klasöründeki dosyaları kullanır. Harici bir API veya veritabanı bağlantısı yoktur.
              </p>
            </div>
          </div>
        </div>

        {/* Quick nav card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-violet-100 p-2 text-violet-600">
              <LayoutTemplate className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Hızlı erişim</p>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                <li>· <span className="font-medium text-foreground">Panel</span> — şablon listesi</li>
                <li>· <span className="font-medium text-foreground">İçe Aktar</span> — XLSX yükle ve önizle</li>
                <li>· <span className="font-medium text-foreground">Dışa Aktar</span> — HTML ve XLSX çıktısı</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
