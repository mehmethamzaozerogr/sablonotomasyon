"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  Download,
  LayoutTemplate,
  Settings2,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutTemplate, label: "Panel" },
  { href: "/import", icon: Database, label: "İçe aktar" },
  { href: "/export", icon: Download, label: "Dışa aktar" },
  { href: "/settings", icon: Settings2, label: "Ayarlar" },
] as const;

export function IconSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-16 flex-col items-center bg-sidebar-bg py-5">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary transition-transform hover:scale-105"
        title="Şablon Stüdyosu"
      >
        <Sparkles className="h-5 w-5" />
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href === "/dashboard" && pathname.startsWith("/templates/"));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150",
                active
                  ? "bg-sidebar-active text-sidebar-icon-active shadow-[0_2px_8px_rgba(124,58,237,0.3)]"
                  : "text-sidebar-icon hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />

              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom settings (already in nav, just a visual separator area) */}
      <div className="mt-auto pt-4">
        <div className="h-px w-6 rounded bg-white/10" />
      </div>
    </aside>
  );
}
