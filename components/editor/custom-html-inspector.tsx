"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Code2, Copy, MousePointer2, Trash2 } from "lucide-react";

import { BlockIcon } from "@/components/editor/block-icon";
import { HtmlVarPicker } from "@/components/editor/html-var-picker";
import {
  InlineSegmentEditor,
  type InlineSegmentEditorHandle,
} from "@/components/editor/inline-segment-editor";
import {
  InspectorFieldLabel,
  InspectorSection,
  InspectorShell,
  type InspectorTabId,
} from "@/components/editor/inspector-shell";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getBlockLabel } from "@/lib/blocks/registry";
import { getBindingPathOptions } from "@/lib/bindings/introspection";
import type { HtmlVarReplacementOption } from "@/lib/bindings/html-vars";
import type {
  HtmlTextRegion,
  HtmlTextRegionStyle,
  InlineSegment,
} from "@/lib/editor/custom-html-text";
import type { EditorMode } from "@/stores/editor-store";
import { cn } from "@/lib/utils";
import type { EditorBlock } from "@/types/template";

type CustomHtmlInspectorProps = {
  block: EditorBlock;
  sourceData: unknown;
  regions: HtmlTextRegion[];
  selectedRegionId: string | null;
  editorMode: EditorMode;
  focusToken: number;
  onSelectRegion: (regionId: string) => void;
  onChangeSegments: (segments: InlineSegment[]) => void;
  onChangeStyle: (patch: Partial<HtmlTextRegionStyle>) => void;
  onChangeHref: (href: string) => void;
  onChangeRawHtml: (value: string) => void;
  onCommitEdits: () => void;
  onDuplicate: (blockId: string) => void;
  onRemove: (blockId: string) => void;
};

function getSelectionElementType(region: HtmlTextRegion | null) {
  if (!region) return "Text";
  if (region.href !== null) return "Link";
  return "Text";
}

function getModeLabel(mode: EditorMode) {
  if (mode === "edit-content") return "Editing";
  if (mode === "edit-style") return "Styling";
  return "Selected";
}

function StyleInput({
  label,
  value,
  placeholder,
  onChange,
  onBlur,
  disabled,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-xs">
      <InspectorFieldLabel>{label}</InspectorFieldLabel>
      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
    </label>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  onBlur,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-xs">
      <InspectorFieldLabel>{label}</InspectorFieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-white p-1 disabled:cursor-not-allowed"
        />
        <Input
          value={value}
          placeholder="#000000"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="font-mono"
        />
      </div>
    </label>
  );
}

export function CustomHtmlInspector({
  block,
  sourceData,
  regions,
  selectedRegionId,
  editorMode,
  focusToken,
  onSelectRegion,
  onChangeSegments,
  onChangeStyle,
  onChangeHref,
  onChangeRawHtml,
  onCommitEdits,
  onDuplicate,
  onRemove,
}: CustomHtmlInspectorProps) {
  const blockLabel = getBlockLabel(block.type, block.name);
  const editorRef = useRef<InlineSegmentEditorHandle | null>(null);
  const [activeTab, setActiveTab] = useState<InspectorTabId>("content");

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === selectedRegionId) ?? null,
    [regions, selectedRegionId],
  );

  useEffect(() => {
    if (editorMode === "edit-style") {
      setActiveTab("style");
      return;
    }

    if (editorMode === "edit-content") {
      setActiveTab("content");
    }
  }, [editorMode]);

  const variableOptions = useMemo<HtmlVarReplacementOption[]>(
    () =>
      getBindingPathOptions(sourceData)
        .filter((option) => option.kind !== "array" && option.kind !== "object")
        .map((option) => ({
          replacePath: option.path,
          displayPath: option.displayPath,
          label: option.label,
          description: option.description,
          group: option.group,
          sample: option.sample,
          kind: option.kind,
          searchText: option.searchText,
        })),
    [sourceData],
  );

  const selectedStyle = selectedRegion?.styles;
  const selectedRegionReadonly = Boolean(selectedRegion?.readonly);
  const selectionPath = selectedRegion
    ? `${blockLabel} > ${selectedRegion.label} > ${getSelectionElementType(selectedRegion)}`
    : `${blockLabel} > Region > ${getSelectionElementType(null)}`;
  const modeLabel = getModeLabel(editorMode);
  const modeTone =
    editorMode === "edit-content"
      ? "editing"
      : editorMode === "edit-style"
        ? "styling"
        : "selected";

  return (
    <InspectorShell
      icon={<BlockIcon type={block.type} className="h-4 w-4" />}
      title={blockLabel}
      selectionPath={selectionPath}
      modeLabel={modeLabel}
      modeTone={modeTone}
      helper="Selection, content editing, styling, and expert HTML remain aligned in one workflow."
      actions={
        <>
          <button
            type="button"
            onClick={() => onDuplicate(block.id)}
            title="Duplicate block"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(block.id)}
            title="Delete block"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      }
      tabs={[
        { id: "content", label: "Content" },
        { id: "style", label: "Style" },
        { id: "advanced", label: "Advanced" },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "content" ? (
        <div className="grid gap-4">
          <InspectorSection
            title="Text Regions"
            description="Pick the visible text area you want to edit from the canvas structure."
          >
            <div className="grid gap-2">
              {regions.length ? (
                regions.map((region, index) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => onSelectRegion(region.id)}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left transition",
                      selectedRegionId === region.id
                        ? "border-primary/30 bg-primary/5 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
                        : "border-border bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {index + 1}. {region.label}
                        </p>
                        {region.readonly ? (
                          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-amber-700">
                            Fallback (readonly)
                          </p>
                        ) : null}
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {region.textPreview || "Empty text region"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                        {region.tagName}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-5 text-center text-xs text-muted-foreground">
                  No selectable text regions were found in this HTML block.
                </div>
              )}
            </div>
          </InspectorSection>

          {selectedRegion ? (
            <>
              <InspectorSection
                title="Text Content"
                description="Edit visible content safely. Variable and logic tokens stay protected."
              >
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border bg-slate-50 px-3 py-2.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {selectedRegion.label}
                    </span>
                    {" · "}
                    {selectedRegionReadonly
                      ? "Fallback region is readonly. Edit from Raw HTML in Advanced."
                      : "Single click selects. Double click enters text editing."}
                  </div>

                  {selectedRegionReadonly ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                      This text region is generated from a sanitized fallback
                      path. To keep editing safe and deterministic, direct
                      inline editing is disabled.
                    </div>
                  ) : selectedRegion.supportsStructuredEditing ? (
                    <InlineSegmentEditor
                      ref={editorRef}
                      segments={selectedRegion.segments}
                      onChange={onChangeSegments}
                      autoFocusToken={focusToken}
                      onBlurWithin={onCommitEdits}
                    />
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                      This region contains nested HTML. You can still adjust
                      styling safely here. For full source accuracy, use the raw
                      HTML editor in Advanced.
                    </div>
                  )}
                </div>
              </InspectorSection>

              {selectedRegion.href !== null ? (
                <InspectorSection
                  title="Link"
                  description="Update the destination for the selected linked text."
                >
                  <label className="grid gap-1.5 text-xs">
                    <InspectorFieldLabel>Link URL</InspectorFieldLabel>
                    <Input
                      value={selectedRegion.href ?? ""}
                      placeholder="https://"
                      disabled={selectedRegionReadonly}
                      onChange={(event) => onChangeHref(event.target.value)}
                      onBlur={onCommitEdits}
                    />
                  </label>
                </InspectorSection>
              ) : null}

              <InspectorSection
                title="Variables"
                description="Insert protected template variables into the current text flow."
              >
                <div className="grid gap-2">
                  <InspectorFieldLabel>Insert Variable</InspectorFieldLabel>
                  <HtmlVarPicker
                    options={variableOptions}
                    onSelect={(path) => {
                      if (selectedRegionReadonly) return;
                      editorRef.current?.insertVariable(path);
                    }}
                    className="max-h-[320px]"
                  />
                </div>
              </InspectorSection>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-8 text-center text-xs text-muted-foreground shadow-[0_8px_24px_-20px_rgba(15,23,42,0.25)]">
              <MousePointer2 className="mx-auto mb-2 h-4 w-4" />
              Select a text region on the canvas or start from the region list
              above.
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "style" ? (
        <div className="grid gap-4">
          <InspectorSection
            title="Typography"
            description="Control how the selected text looks and aligns."
          >
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <StyleInput
                  label="Font Size"
                  value={selectedStyle?.fontSize ?? ""}
                  placeholder="16px"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ fontSize: value })}
                  onBlur={onCommitEdits}
                />
                <label className="grid gap-1.5 text-xs">
                  <InspectorFieldLabel>Font Weight</InspectorFieldLabel>
                  <Select
                    value={selectedStyle?.fontWeight ?? ""}
                    disabled={!selectedRegion || selectedRegionReadonly}
                    onChange={(event) =>
                      onChangeStyle({ fontWeight: event.target.value })
                    }
                    onBlur={onCommitEdits}
                  >
                    <option value="">Auto</option>
                    <option value="400">400</option>
                    <option value="500">500</option>
                    <option value="600">600</option>
                    <option value="700">700</option>
                    <option value="800">800</option>
                  </Select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StyleInput
                  label="Line Height"
                  value={selectedStyle?.lineHeight ?? ""}
                  placeholder="1.6"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ lineHeight: value })}
                  onBlur={onCommitEdits}
                />
                <StyleInput
                  label="Letter Spacing"
                  value={selectedStyle?.letterSpacing ?? ""}
                  placeholder="0.02em"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ letterSpacing: value })}
                  onBlur={onCommitEdits}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ColorInput
                  label="Text Color"
                  value={selectedStyle?.color ?? ""}
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ color: value })}
                  onBlur={onCommitEdits}
                />
                <label className="grid gap-1.5 text-xs">
                  <InspectorFieldLabel>Text Align</InspectorFieldLabel>
                  <Select
                    value={selectedStyle?.textAlign ?? ""}
                    disabled={!selectedRegion || selectedRegionReadonly}
                    onChange={(event) =>
                      onChangeStyle({ textAlign: event.target.value })
                    }
                    onBlur={onCommitEdits}
                  >
                    <option value="">Auto</option>
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                  </Select>
                </label>
              </div>
            </div>
          </InspectorSection>

          <InspectorSection
            title="Spacing"
            description="Adjust padding and margins around the selected region."
          >
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <StyleInput
                  label="Padding Top"
                  value={selectedStyle?.paddingTop ?? ""}
                  placeholder="16px"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ paddingTop: value })}
                  onBlur={onCommitEdits}
                />
                <StyleInput
                  label="Padding Right"
                  value={selectedStyle?.paddingRight ?? ""}
                  placeholder="20px"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ paddingRight: value })}
                  onBlur={onCommitEdits}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StyleInput
                  label="Padding Bottom"
                  value={selectedStyle?.paddingBottom ?? ""}
                  placeholder="16px"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ paddingBottom: value })}
                  onBlur={onCommitEdits}
                />
                <StyleInput
                  label="Padding Left"
                  value={selectedStyle?.paddingLeft ?? ""}
                  placeholder="20px"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ paddingLeft: value })}
                  onBlur={onCommitEdits}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StyleInput
                  label="Margin Top"
                  value={selectedStyle?.marginTop ?? ""}
                  placeholder="0"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ marginTop: value })}
                  onBlur={onCommitEdits}
                />
                <StyleInput
                  label="Margin Bottom"
                  value={selectedStyle?.marginBottom ?? ""}
                  placeholder="12px"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ marginBottom: value })}
                  onBlur={onCommitEdits}
                />
              </div>
            </div>
          </InspectorSection>

          <InspectorSection
            title="Appearance"
            description="Set background, border, and width rules for the selected element."
          >
            <div className="grid gap-3">
              <ColorInput
                label="Background"
                value={selectedStyle?.backgroundColor ?? ""}
                disabled={!selectedRegion || selectedRegionReadonly}
                onChange={(value) => onChangeStyle({ backgroundColor: value })}
                onBlur={onCommitEdits}
              />

              <div className="grid grid-cols-2 gap-3">
                <StyleInput
                  label="Border Radius"
                  value={selectedStyle?.borderRadius ?? ""}
                  placeholder="12px"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ borderRadius: value })}
                  onBlur={onCommitEdits}
                />
                <StyleInput
                  label="Border"
                  value={selectedStyle?.border ?? ""}
                  placeholder="1px solid #e2e8f0"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ border: value })}
                  onBlur={onCommitEdits}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StyleInput
                  label="Width"
                  value={selectedStyle?.width ?? ""}
                  placeholder="100%"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ width: value })}
                  onBlur={onCommitEdits}
                />
                <StyleInput
                  label="Max Width"
                  value={selectedStyle?.maxWidth ?? ""}
                  placeholder="600px"
                  disabled={!selectedRegion || selectedRegionReadonly}
                  onChange={(value) => onChangeStyle({ maxWidth: value })}
                  onBlur={onCommitEdits}
                />
              </div>
            </div>
          </InspectorSection>
        </div>
      ) : null}

      {activeTab === "advanced" ? (
        <div className="grid gap-4">
          <InspectorSection
            title="Raw HTML"
            description="Expert mode. Changes here update the live preview immediately."
          >
            <div className="grid gap-3">
              <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-muted-foreground">
                <Code2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Raw HTML remains available for advanced use. Structured
                  editing and variable safety stay intact.
                </span>
              </div>
              <Textarea
                value={String(block.props.html ?? "")}
                onChange={(event) => onChangeRawHtml(event.target.value)}
                onBlur={onCommitEdits}
                className="min-h-[300px] font-mono text-[12px] leading-6"
              />
            </div>
          </InspectorSection>
        </div>
      ) : null}
    </InspectorShell>
  );
}
