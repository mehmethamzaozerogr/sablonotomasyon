"use client";

import { useMemo, useState } from "react";
import { Palette, Type } from "lucide-react";

import {
  InspectorSection,
  InspectorShell,
} from "@/components/editor/inspector-shell";
import {
  extractColorsFromHtml,
  extractFontsFromHtml,
  type ExtractedColor,
} from "@/lib/design/color-utils";
import type { EditorBlock } from "@/types/template";

type DesignPanelProps = {
  blocks: EditorBlock[];
  sourceHtml: string;
  selectionPath: string;
  modeLabel: string;
  onReplaceColor: (oldHex: string, newHex: string) => void;
  onReplaceFont: (oldFont: string, newFont: string) => void;
};

type ColorRowProps = {
  color: ExtractedColor;
  onReplace: (oldHex: string, newHex: string) => void;
};

const ROLE_LABELS: Record<ExtractedColor["role"], string> = {
  background: "Background",
  text: "Text",
  border: "Border",
  other: "Other",
};

const COMMON_FONTS = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Tahoma",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Inter",
  "Nunito",
  "Raleway",
];

function ColorRow({ color, onReplace }: ColorRowProps) {
  const [editHex, setEditHex] = useState(color.hex);
  const [pending, setPending] = useState(false);

  function handleChange(newHex: string) {
    setEditHex(newHex);
    setPending(newHex.toLowerCase() !== color.hex.toLowerCase());
  }

  function handleApply() {
    if (!pending) return;
    onReplace(color.hex, editHex);
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-2">
      <div className="relative shrink-0">
        <div
          className="h-8 w-8 rounded-md border border-border shadow-sm"
          style={{ backgroundColor: color.hex }}
        />
        <input
          type="color"
          value={editHex}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={handleApply}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          title="Change color"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] font-medium text-foreground">{color.hex}</p>
        <p className="text-[10px] text-muted-foreground">
          {ROLE_LABELS[color.role]} · {color.usages} uses
        </p>
      </div>

      {pending ? (
        <button
          type="button"
          onClick={handleApply}
          className="shrink-0 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
        >
          Apply
        </button>
      ) : null}
    </div>
  );
}

function FontRow({
  font,
  onReplace,
}: {
  font: string;
  onReplace: (oldFont: string, newFont: string) => void;
}) {
  const [replacement, setReplacement] = useState(font);
  const pending = replacement.trim() !== font;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-2.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground" style={{ fontFamily: font }}>
          {font}
        </p>
      </div>
      <select
        value={replacement}
        onChange={(event) => setReplacement(event.target.value)}
        className="h-7 rounded-md border border-border bg-gray-50 px-1.5 text-[11px] focus:border-primary/40 focus:outline-none"
      >
        <option value={font}>{font}</option>
        {COMMON_FONTS.filter((entry) => entry !== font).map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </select>
      {pending ? (
        <button
          type="button"
          onClick={() => onReplace(font, replacement)}
          className="shrink-0 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
        >
          Apply
        </button>
      ) : null}
    </div>
  );
}

export function DesignPanel({
  blocks,
  sourceHtml,
  selectionPath,
  modeLabel,
  onReplaceColor,
  onReplaceFont,
}: DesignPanelProps) {
  const allHtml = useMemo(() => {
    const blockHtml = blocks
      .filter((block) => block.type === "customHtml")
      .map((block) => String(block.props["html"] ?? ""))
      .join("\n");
    return blockHtml || sourceHtml;
  }, [blocks, sourceHtml]);

  const colors = useMemo(() => extractColorsFromHtml(allHtml), [allHtml]);
  const fonts = useMemo(() => extractFontsFromHtml(allHtml), [allHtml]);

  const backgroundColors = colors.filter((color) => color.role === "background");
  const textColors = colors.filter((color) => color.role === "text");
  const otherColors = colors.filter(
    (color) => color.role !== "background" && color.role !== "text",
  );

  return (
    <InspectorShell
      icon={<Palette className="h-4 w-4" />}
      title="Theme"
      selectionPath={selectionPath}
      modeLabel={modeLabel}
      helper="Global palette and font changes update every custom HTML block while keeping the editor model intact."
    >
      {colors.length === 0 && fonts.length === 0 ? (
        <div className="flex h-full items-center justify-center p-6">
          <div className="max-w-[220px] text-center">
            <div className="mx-auto mb-3 inline-flex rounded-xl bg-gray-100 p-3 text-gray-400">
              <Palette className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">No theme data found</p>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
              Add custom HTML blocks to expose shared colors and fonts here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {colors.length ? (
            <InspectorSection
              title="Color Palette"
              description="Click a swatch to update that color across custom HTML blocks."
            >
              <div className="grid gap-4">
                {backgroundColors.length ? (
                  <div className="grid gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Background
                    </p>
                    <div className="grid gap-1.5">
                      {backgroundColors.map((color) => (
                        <ColorRow key={color.hex} color={color} onReplace={onReplaceColor} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {textColors.length ? (
                  <div className="grid gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Text
                    </p>
                    <div className="grid gap-1.5">
                      {textColors.map((color) => (
                        <ColorRow key={color.hex} color={color} onReplace={onReplaceColor} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {otherColors.length ? (
                  <div className="grid gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Other
                    </p>
                    <div className="grid gap-1.5">
                      {otherColors.map((color) => (
                        <ColorRow key={color.hex} color={color} onReplace={onReplaceColor} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </InspectorSection>
          ) : null}

          {fonts.length ? (
            <InspectorSection
              title="Font Library"
              description="Swap recurring font stacks used in custom HTML blocks."
            >
              <div className="grid gap-1.5">
                {fonts.map((font) => (
                  <FontRow key={font} font={font} onReplace={onReplaceFont} />
                ))}
              </div>
            </InspectorSection>
          ) : null}

          <InspectorSection
            title="Scope"
            description="Theme changes are global. Region-level styling still lives in the Inspector."
          >
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-muted-foreground">
              <Type className="h-3.5 w-3.5 shrink-0" />
              <span>Use the Inspector for precise region styling and the Theme panel for broad template-wide cleanup.</span>
            </div>
          </InspectorSection>
        </div>
      )}
    </InspectorShell>
  );
}
