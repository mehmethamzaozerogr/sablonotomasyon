"use client";

import { Settings2 } from "lucide-react";

import {
  InspectorFieldLabel,
  InspectorSection,
  InspectorShell,
} from "@/components/editor/inspector-shell";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TemplateDesignSystem } from "@/types/template";

type TemplateSettingsPanelProps = {
  designSystem: TemplateDesignSystem;
  onDesignSystemChange: (updater: (design: TemplateDesignSystem) => TemplateDesignSystem) => void;
};

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs">
      <InspectorFieldLabel>{label}</InspectorFieldLabel>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs">
      <InspectorFieldLabel>{label}</InspectorFieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-10 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} className="font-mono" />
      </div>
    </label>
  );
}

function FontField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs">
      <InspectorFieldLabel>{label}</InspectorFieldLabel>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function TemplateSettingsPanel({
  designSystem,
  onDesignSystemChange,
}: TemplateSettingsPanelProps) {
  return (
    <InspectorShell
      icon={<Settings2 className="h-4 w-4" />}
      title="General Settings"
      selectionPath="Template Root > Design Tokens"
      modeLabel="Global"
      helper="These tokens drive the shared template system. Global updates flow into preview rendering and synchronized HTML styling."
    >
      <div className="grid gap-4">
        <InspectorSection
          title="Layout"
          description="Control global canvas width, spacing, and surface rhythm."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <NumberField
              label="Page Width"
              value={designSystem.layout.pageWidth}
              min={480}
              max={1200}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, pageWidth: value },
                }))
              }
            />
            <NumberField
              label="Content Width"
              value={designSystem.layout.contentWidth}
              min={360}
              max={900}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, contentWidth: value },
                }))
              }
            />
            <NumberField
              label="Section Spacing"
              value={designSystem.layout.sectionSpacing}
              min={8}
              max={72}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, sectionSpacing: value },
                }))
              }
            />
            <NumberField
              label="Corner Radius"
              value={designSystem.layout.radius}
              min={0}
              max={40}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, radius: value },
                }))
              }
            />
            <NumberField
              label="Container Padding X"
              value={designSystem.layout.containerPaddingX}
              min={0}
              max={48}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, containerPaddingX: value },
                }))
              }
            />
            <NumberField
              label="Container Padding Y"
              value={designSystem.layout.containerPaddingY}
              min={0}
              max={48}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, containerPaddingY: value },
                }))
              }
            />
          </div>
        </InspectorSection>

        <InspectorSection
          title="Typography"
          description="Global font and typographic scale updates propagate across compatible regions."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <FontField
              label="Main Font Family"
              value={designSystem.typography.fontFamily}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  typography: { ...current.typography, fontFamily: value },
                }))
              }
            />
            <FontField
              label="Heading Font Family"
              value={designSystem.typography.headingFontFamily}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  typography: { ...current.typography, headingFontFamily: value },
                }))
              }
            />
            <NumberField
              label="Base Font Size"
              value={designSystem.typography.baseFontSize}
              min={11}
              max={22}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  typography: { ...current.typography, baseFontSize: value },
                }))
              }
            />
            <NumberField
              label="Heading Scale"
              value={designSystem.typography.headingScale}
              min={1}
              max={1.5}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  typography: { ...current.typography, headingScale: value },
                }))
              }
            />
            <NumberField
              label="Line Height"
              value={designSystem.typography.lineHeight}
              min={1.2}
              max={2}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  typography: { ...current.typography, lineHeight: value },
                }))
              }
            />
          </div>
        </InspectorSection>

        <InspectorSection
          title="Palette"
          description="These tokens act as the global surface and typography palette."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <ColorField
              label="Body Background"
              value={designSystem.palette.bodyBackground}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  palette: { ...current.palette, bodyBackground: value },
                }))
              }
            />
            <ColorField
              label="Content Background"
              value={designSystem.palette.contentBackground}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  palette: { ...current.palette, contentBackground: value },
                }))
              }
            />
            <ColorField
              label="Muted Surface"
              value={designSystem.palette.mutedSurface}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  palette: { ...current.palette, mutedSurface: value },
                }))
              }
            />
            <ColorField
              label="Border Color"
              value={designSystem.palette.borderColor}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  palette: { ...current.palette, borderColor: value },
                }))
              }
            />
            <ColorField
              label="Text Color"
              value={designSystem.palette.textColor}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  palette: { ...current.palette, textColor: value },
                }))
              }
            />
            <ColorField
              label="Heading Color"
              value={designSystem.palette.headingColor}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  palette: { ...current.palette, headingColor: value },
                }))
              }
            />
            <ColorField
              label="Link Color"
              value={designSystem.palette.linkColor}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  palette: { ...current.palette, linkColor: value },
                }))
              }
            />
            <ColorField
              label="Button Background"
              value={designSystem.palette.buttonBackground}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  palette: { ...current.palette, buttonBackground: value },
                }))
              }
            />
          </div>
        </InspectorSection>

        <InspectorSection
          title="Components"
          description="Shared defaults for buttons, media, and separators."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <NumberField
              label="Button Radius"
              value={designSystem.layout.buttonRadius}
              min={0}
              max={40}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, buttonRadius: value },
                }))
              }
            />
            <NumberField
              label="Button Padding X"
              value={designSystem.layout.buttonPaddingX}
              min={8}
              max={40}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, buttonPaddingX: value },
                }))
              }
            />
            <NumberField
              label="Button Padding Y"
              value={designSystem.layout.buttonPaddingY}
              min={6}
              max={24}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, buttonPaddingY: value },
                }))
              }
            />
            <NumberField
              label="Image Radius"
              value={designSystem.layout.imageRadius}
              min={0}
              max={40}
              onChange={(value) =>
                onDesignSystemChange((current) => ({
                  ...current,
                  layout: { ...current.layout, imageRadius: value },
                }))
              }
            />
            <label className="grid gap-1.5 text-xs">
              <InspectorFieldLabel>Shadow Preset</InspectorFieldLabel>
              <Select
                value={designSystem.layout.shadowPreset}
                onChange={(event) =>
                  onDesignSystemChange((current) => ({
                    ...current,
                    layout: {
                      ...current.layout,
                      shadowPreset: event.target.value as TemplateDesignSystem["layout"]["shadowPreset"],
                    },
                  }))
                }
              >
                <option value="none">None</option>
                <option value="soft">Soft</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
              </Select>
            </label>
            <label className="grid gap-1.5 text-xs">
              <InspectorFieldLabel>Divider Style</InspectorFieldLabel>
              <Select
                value={designSystem.layout.dividerStyle}
                onChange={(event) =>
                  onDesignSystemChange((current) => ({
                    ...current,
                    layout: {
                      ...current.layout,
                      dividerStyle: event.target.value as TemplateDesignSystem["layout"]["dividerStyle"],
                    },
                  }))
                }
              >
                <option value="subtle">Subtle</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
              </Select>
            </label>
          </div>
        </InspectorSection>
      </div>
    </InspectorShell>
  );
}
