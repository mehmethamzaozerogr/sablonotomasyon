"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Database,
  Download,
  LayoutTemplate,
  Settings2,
  Sparkles,
} from "lucide-react";

import { Panel } from "@/components/primitives/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appNavigation, categoryMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TemplateCategory } from "@/types/template";

const navIcons = {
  "/dashboard": LayoutTemplate,
  "/import": Database,
  "/export": Download,
  "/settings": Settings2,
};

type StudioSidebarProps = {
  categoryCounts: Record<TemplateCategory, number>;
};

export function StudioSidebar({ categoryCounts }: StudioSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <Panel className="rounded-[32px] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="teal" className="mb-4">
              İç kullanım
            </Badge>
            <Link href="/dashboard" className="inline-flex items-center gap-3">
              <div className="rounded-2xl border border-primary/25 bg-primary/12 p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">
                  Şablon Stüdyosu
                </p>
                <p className="text-sm leading-6 text-slate-400">Yerel dosyalarla çalışan şablon editörü</p>
              </div>
            </Link>
          </div>
          <Button asChild size="sm" variant="ghost" className="hidden lg:inline-flex">
            <Link href="/import">
              İçe aktar
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-2">
          {appNavigation.map((item) => {
            const Icon = navIcons[item.href as keyof typeof navIcons];
            const active =
              pathname === item.href ||
              (item.href === "/dashboard" && pathname.startsWith("/templates/")) ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                  active
                    ? "border-primary/25 bg-primary/12 text-white"
                    : "border-transparent bg-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white",
                )}
              >
                <div
                  className={cn(
                    "rounded-xl p-2",
                    active ? "bg-primary/15 text-primary" : "bg-white/5 text-slate-400",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Panel>

      <Panel className="rounded-[32px] p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Kategoriler</p>
            <p className="text-sm leading-6 text-slate-400">Çalışma dosyalarına göre dağılım</p>
          </div>
          <Badge>Yerel kaynak</Badge>
        </div>
        <div className="grid gap-3">
          {Object.entries(categoryMeta).map(([key, meta]) => (
            <div
              key={key}
              className={cn(
                "rounded-2xl border border-white/8 bg-gradient-to-r p-4",
                meta.surface,
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn("text-sm font-semibold", meta.accent)}>{meta.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{meta.hint}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-lg font-semibold text-white">
                  {categoryCounts[key as TemplateCategory]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </aside>
  );
}
