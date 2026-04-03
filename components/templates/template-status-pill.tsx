import { templateStatuses } from "@/lib/constants";
import type { TemplateStatus } from "@/types/template";
import { cn } from "@/lib/utils";

type TemplateStatusPillProps = {
  status: TemplateStatus;
};

export function TemplateStatusPill({ status }: TemplateStatusPillProps) {
  const meta = templateStatuses[status];

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
        meta.tone,
      )}
    >
      {meta.label}
    </span>
  );
}
