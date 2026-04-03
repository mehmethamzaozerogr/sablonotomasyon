"use client";

import { useMemo, useState } from "react";
import { CopyPlus, Palette, RotateCcw, Save } from "lucide-react";

import {
  InspectorSection,
  InspectorShell,
} from "@/components/editor/inspector-shell";
import { Input } from "@/components/ui/input";
import { TEMPLATE_THEME_PRESETS } from "@/lib/editor/template-design";
import type { TemplateDesignSystem } from "@/types/template";
import { cn } from "@/lib/utils";

type ThemeManagerPanelProps = {
  designSystem: TemplateDesignSystem;
  onApplyTheme: (themeId: string) => void;
  onSaveCurrentTheme: (name: string) => void;
  onDuplicateActiveTheme: () => void;
  onResetTheme: () => void;
};

export function ThemeManagerPanel({
  designSystem,
  onApplyTheme,
  onSaveCurrentTheme,
  onDuplicateActiveTheme,
  onResetTheme,
}: ThemeManagerPanelProps) {
  const [customThemeName, setCustomThemeName] = useState("");

  const themeCards = useMemo(
    () => [...TEMPLATE_THEME_PRESETS, ...(designSystem.customThemes ?? [])],
    [designSystem.customThemes],
  );

  return (
    <InspectorShell
      icon={<Palette className="h-4 w-4" />}
      title="Theme Manager"
      selectionPath="Template Root > Theme Presets"
      modeLabel="Preset"
      helper="Switch the whole template system instantly, then save a tuned version as a reusable custom theme."
    >
      <div className="grid gap-4">
        <InspectorSection
          title="Active Theme"
          description="The active theme drives layout tokens, palette, and typography defaults."
        >
          <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-950">
                  {designSystem.activeThemeName}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {designSystem.activeThemeId.startsWith("custom-")
                    ? "Custom theme derived from your current settings."
                    : "Preset theme currently applied to the template."}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDuplicateActiveTheme}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  <CopyPlus className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={onResetTheme}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {[
                designSystem.palette.bodyBackground,
                designSystem.palette.contentBackground,
                designSystem.palette.mutedSurface,
                designSystem.palette.linkColor,
                designSystem.palette.buttonBackground,
              ].map((color) => (
                <div
                  key={color}
                  className="h-10 rounded-2xl border border-white/60 shadow-inner"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </InspectorSection>

        <InspectorSection
          title="Preset Library"
          description="Apply a premium-safe preset without rewriting the rest of the editor architecture."
        >
          <div className="grid gap-3">
            {themeCards.map((theme) => {
              const isActive = designSystem.activeThemeId === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onApplyTheme(theme.id)}
                  className={cn(
                    "rounded-3xl border px-4 py-4 text-left transition",
                    isActive
                      ? "border-primary/30 bg-primary/5 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-950">{theme.name}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {theme.description ?? "Custom saved theme."}
                      </p>
                    </div>
                    {isActive ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
                        Active
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex gap-2">
                    {[
                      theme.palette.bodyBackground,
                      theme.palette.contentBackground,
                      theme.palette.linkColor,
                      theme.palette.buttonBackground,
                    ].map((color) => (
                      <span
                        key={color}
                        className="h-8 flex-1 rounded-2xl border border-white/60 shadow-inner"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </InspectorSection>

        <InspectorSection
          title="Save Current Theme"
          description="Capture the current token system as a reusable custom theme."
        >
          <div className="flex gap-2">
            <Input
              value={customThemeName}
              onChange={(event) => setCustomThemeName(event.target.value)}
              placeholder="Premium Commerce Variant"
            />
            <button
              type="button"
              onClick={() => {
                const value = customThemeName.trim() || `${designSystem.activeThemeName} Custom`;
                onSaveCurrentTheme(value);
                setCustomThemeName("");
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              <Save className="h-3.5 w-3.5" />
              Save Theme
            </button>
          </div>
        </InspectorSection>
      </div>
    </InspectorShell>
  );
}
