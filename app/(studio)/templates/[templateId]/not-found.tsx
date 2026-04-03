import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default function TemplateNotFoundPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Şablon bulunamadı"
        title="Istenen MessageTemplate kaydi bulunamadi"
        description="Istenen TemplateID, yerel workbook icinde bulunamadi veya kategoriye eslenemedi."
        actions={
          <Button asChild>
            <Link href="/dashboard">Panele dön</Link>
          </Button>
        }
      />
    </div>
  );
}
