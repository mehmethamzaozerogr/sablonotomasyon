import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type PanelProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function Panel({ className, elevated = false, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        elevated ? "surface-elevated" : "surface-panel",
        "rounded-3xl",
        className,
      )}
      {...props}
    />
  );
}
