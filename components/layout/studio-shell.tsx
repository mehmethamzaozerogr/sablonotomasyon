import type { ReactNode } from "react";

import { IconSidebar } from "@/components/layout/icon-sidebar";
import type { TemplateCategory } from "@/types/template";

type StudioShellProps = {
  children: ReactNode;
  categoryCounts: Record<TemplateCategory, number>;
};

export function StudioShell({ children }: StudioShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <IconSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
