import { ArrowUpRight } from "lucide-react";

import { formatCompactNumber } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: number;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {formatCompactNumber(value)}
          </p>
        </div>
        <div className="rounded-lg bg-primary/8 p-2 text-primary">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      <p className="max-w-xs text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
