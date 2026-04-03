import { categoryMeta } from "@/lib/constants";
import type { TemplateRecord } from "@/types/template";
import { Panel } from "@/components/primitives/panel";
import { TemplateCard } from "@/components/templates/template-card";

type TemplateListProps = {
  templates: TemplateRecord[];
  categoryCounts: Record<string, number>;
};

export function TemplateList({ templates, categoryCounts }: TemplateListProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 xl:grid-cols-4">
        {Object.entries(categoryMeta).map(([key, meta]) => {
          const count = categoryCounts[key] ?? 0;

          return (
            <Panel
              key={key}
              className={`rounded-[28px] border-white/8 bg-gradient-to-br p-5 ${meta.surface}`}
            >
              <p className={`text-sm font-medium ${meta.accent}`}>{meta.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{count}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{meta.hint}</p>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
