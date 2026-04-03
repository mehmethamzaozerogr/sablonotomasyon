import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        eyebrow="Ayarlar"
        title="Yerel Çalışma Tercihleri"
        description="Stüdyo adı, varsayılan sayfa adı ve editör davranışları gibi yerel tercihlerinizi bu alandan yönetebilirsiniz."
      />
      <SettingsForm />
    </div>
  );
}
