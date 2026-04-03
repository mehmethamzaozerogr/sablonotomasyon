import Link from "next/link";
import { ArrowUpRight, Clock3, FileCode2, Layers3 } from "lucide-react";

import { categoryMeta } from "@/lib/constants";
import { cn, formatDateLabel } from "@/lib/utils";
import type { TemplateRecord } from "@/types/template";
import { TemplateStatusPill } from "@/components/templates/template-status-pill";

type TemplateCardProps = {
  template: TemplateRecord;
};

export function TemplateCard({ template }: TemplateCardProps) {
  const category = categoryMeta[template.category];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-gray-300 hover:shadow-card-hover">
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium", category.surface, category.accent)}>
                {category.label}
              </span>
              <TemplateStatusPill status={template.status} />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {template.name}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {template.description}
              </p>
            </div>
          </div>
          <Link
            href={`/templates/${template.id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-2 rounded-lg border border-border bg-gray-50/50 p-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Bloklar</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground">
              <Layers3 className="h-3.5 w-3.5 text-primary" />
              {template.blocks.length} hazır blok
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Kaynak</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground">
              <FileCode2 className="h-3.5 w-3.5 text-primary" />
              {template.source.templateId}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Tarih</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              {formatDateLabel(template.updatedAt)}
            </p>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {template.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {template.source.templateEngine}
          </p>
        </div>
      </div>
    </div>
  );
}
