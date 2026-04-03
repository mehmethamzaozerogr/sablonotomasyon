"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Copy, SlidersHorizontal, Trash2 } from "lucide-react";

import { BlockIcon } from "@/components/editor/block-icon";
import { FieldBindingControl } from "@/components/editor/field-binding-control";
import {
  getBlockDefinition,
  getBlockFields,
  getBlockLabel,
} from "@/lib/blocks/registry";
import {
  InspectorEmptyState,
  InspectorFieldLabel,
  InspectorSection,
  InspectorShell,
  type InspectorTabId,
} from "@/components/editor/inspector-shell";
import { RepeaterBindingControl } from "@/components/editor/repeater-binding-control";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { EditorMode } from "@/stores/editor-store";
import { cn } from "@/lib/utils";
import type { BlockFieldBinding, RepeaterBinding } from "@/types/binding";
import type {
  BlockFieldDefinition,
  BlockValue,
  EditorBlock,
  TemplateCategory,
} from "@/types/template";

type BlockSettingsProps = {
  category: TemplateCategory;
  sourceData: unknown;
  block: EditorBlock | null;
  editorMode: EditorMode;
  onChange: (blockId: string, key: string, value: BlockValue) => void;
  onBindingChange: (blockId: string, key: string, binding: BlockFieldBinding) => void;
  onBindingClear: (blockId: string, key: string) => void;
  onRepeaterChange: (blockId: string, repeater: RepeaterBinding) => void;
  onRepeaterClear: (blockId: string) => void;
  onRemove: (blockId: string) => void;
  onDuplicate: (blockId: string) => void;
};

type FieldEditorProps = {
  block: EditorBlock;
  field: BlockFieldDefinition;
  value: BlockValue | undefined;
  onChange: (blockId: string, key: string, value: BlockValue) => void;
  autoFocus?: boolean;
  compact?: boolean;
};

const STYLE_KEY_HINTS = [
  "color",
  "background",
  "padding",
  "radius",
  "align",
  "width",
  "size",
  "font",
  "tone",
  "status",
  "muted",
  "border",
  "layout",
];

const PRIORITY_CONTENT_KEYS = [
  "headline",
  "body",
  "label",
  "href",
  "ctaLabel",
  "ctaHref",
  "promoCode",
  "productName",
  "price",
  "companyName",
];

const BLOCK_LABELS: Record<EditorBlock["type"], string> = {
  hero: "Hero",
  richText: "Text",
  cta: "Button",
  divider: "Divider",
  spacer: "Spacer",
  image: "Image",
  footer: "Footer",
  customHtml: "Custom HTML",
  address: "Address",
  customerInfo: "Customer",
  note: "Note",
  lineItems: "Collection",
  totals: "Invoice Summary",
  summary: "Totals",
  status: "Status",
  shippingInfo: "Shipping",
  returnInfo: "Return",
  orderSummary: "Order",
  paymentInfo: "Payment",
  supportSection: "Support",
  invoiceSummary: "Invoice",
  invoiceNotice: "Invoice Notice",
  shipmentSummary: "Shipment",
  trackingTimeline: "Tracking",
  returnReason: "Return Reason",
  returnInstructions: "Return Steps",
  promotionBanner: "Promotion",
  productCard: "Product Card",
  loyaltyPoints: "Loyalty",
  ratingRequest: "Rating",
  dataTable: "Data Table",
};

function isStyleField(field: BlockFieldDefinition) {
  const key = field.key.toLocaleLowerCase("en-US");
  return field.type === "color" || STYLE_KEY_HINTS.some((hint) => key.includes(hint));
}

function getModeLabel(mode: EditorMode) {
  if (mode === "edit-style") return "Styling";
  if (mode === "edit-content") return "Editing";
  return "Selected";
}

function getFieldKindLabel(field: BlockFieldDefinition | null) {
  if (!field) return "Block";
  if (field.type === "textarea") return "Text";
  if (field.key.toLowerCase().includes("href")) return "Link";
  if (field.type === "toggle") return "Toggle";
  if (field.type === "select") return "Setting";
  return "Field";
}

function sortFields(fields: BlockFieldDefinition[]) {
  return [...fields].sort((a, b) => {
    const aIndex = PRIORITY_CONTENT_KEYS.indexOf(a.key);
    const bIndex = PRIORITY_CONTENT_KEYS.indexOf(b.key);
    if (aIndex === -1 && bIndex === -1) return a.label.localeCompare(b.label, "en-US");
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

function FieldEditor({
  block,
  field,
  value,
  onChange,
  autoFocus = false,
  compact = false,
}: FieldEditorProps) {
  if (field.type === "textarea") {
    return (
      <label className="grid gap-1.5 text-xs">
        <InspectorFieldLabel>{field.label}</InspectorFieldLabel>
        <Textarea
          autoFocus={autoFocus}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(block.id, field.key, event.target.value)}
          placeholder={field.placeholder}
          className={cn(compact ? "min-h-[96px]" : "min-h-[130px]")}
        />
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <label className="grid gap-1.5 text-xs">
        <InspectorFieldLabel>{field.label}</InspectorFieldLabel>
        <Input
          autoFocus={autoFocus}
          type="number"
          value={typeof value === "number" ? value : 0}
          min={field.min}
          max={field.max}
          onChange={(event) => onChange(block.id, field.key, Number(event.target.value))}
        />
      </label>
    );
  }

  if (field.type === "color") {
    return (
      <label className="grid gap-1.5 text-xs">
        <InspectorFieldLabel>{field.label}</InspectorFieldLabel>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={typeof value === "string" ? value : "#6b7280"}
            onChange={(event) => onChange(block.id, field.key, event.target.value)}
            className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-white p-1"
          />
          <Input
            autoFocus={autoFocus}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(block.id, field.key, event.target.value)}
            placeholder="#6b7280"
            className="font-mono"
          />
        </div>
      </label>
    );
  }

  if (field.type === "toggle") {
    return (
      <label className="flex items-center justify-between rounded-xl border border-border bg-slate-50 px-3 py-2.5">
        <div>
          <p className="text-xs font-medium text-foreground">{field.label}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Turn this presentation setting on or off.
          </p>
        </div>
        <Switch
          checked={typeof value === "boolean" ? value : false}
          onCheckedChange={(checked) => onChange(block.id, field.key, checked)}
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="grid gap-1.5 text-xs">
        <InspectorFieldLabel>{field.label}</InspectorFieldLabel>
        <Select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(block.id, field.key, event.target.value)}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
    );
  }

  return (
    <label className="grid gap-1.5 text-xs">
      <InspectorFieldLabel>{field.label}</InspectorFieldLabel>
      <Input
        autoFocus={autoFocus}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(block.id, field.key, event.target.value)}
        placeholder={field.placeholder}
      />
    </label>
  );
}

function FieldCard({
  block,
  field,
  value,
  selected,
  onSelect,
  onChange,
  bindingControl,
}: {
  block: EditorBlock;
  field: BlockFieldDefinition;
  value: BlockValue | undefined;
  selected: boolean;
  onSelect: () => void;
  onChange: (blockId: string, key: string, value: BlockValue) => void;
  bindingControl?: ReactNode;
}) {
  const textPreview = typeof value === "string"
    ? value
    : typeof value === "number"
      ? `${value}`
      : typeof value === "boolean"
        ? value ? "On" : "Off"
        : "";

  return (
    <div
      className={cn(
        "rounded-2xl border transition",
        selected
          ? "border-primary/30 bg-primary/5 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
          : "border-border bg-white hover:border-slate-300 hover:bg-slate-50/60",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{field.label}</p>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {textPreview || field.placeholder || "Ready to edit."}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
          {getFieldKindLabel(field)}
        </span>
      </button>

      <div className="border-t border-border px-4 py-4">
        <div className="grid gap-3">
          <FieldEditor
            block={block}
            field={field}
            value={value}
            onChange={onChange}
            autoFocus={selected}
            compact
          />
          {bindingControl}
        </div>
      </div>
    </div>
  );
}

export function BlockSettings({
  category,
  sourceData,
  block,
  editorMode,
  onChange,
  onBindingChange,
  onBindingClear,
  onRepeaterChange,
  onRepeaterClear,
  onRemove,
  onDuplicate,
}: BlockSettingsProps) {
  const [activeTab, setActiveTab] = useState<InspectorTabId>("content");
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);

  const supportsRepeater = block?.type === "lineItems";
  const blockDefinition = block ? getBlockDefinition(block.type) : null;
  const blockFields = useMemo(() => (block ? getBlockFields(block) : []), [block]);
  const blockLabel = block ? getBlockLabel(block.type, block.name) : "";

  const { contentFields, styleFields, bindingFields, advancedFields } = useMemo(() => {
    if (!block) {
      return {
        contentFields: [] as BlockFieldDefinition[],
        styleFields: [] as BlockFieldDefinition[],
        bindingFields: [] as BlockFieldDefinition[],
        advancedFields: [] as BlockFieldDefinition[],
      };
    }

    return {
      contentFields: sortFields(
        blockFields.filter((field) => !isStyleField(field) && !field.bindingOnly),
      ),
      styleFields: sortFields(blockFields.filter((field) => isStyleField(field))),
      bindingFields: sortFields(
        blockFields.filter((field) => field.bindingTarget !== undefined && !field.bindingOnly),
      ),
      advancedFields: sortFields(blockFields.filter((field) => field.bindingOnly)),
    };
  }, [block, blockFields]);

  useEffect(() => {
    if (editorMode === "edit-style") {
      setActiveTab("style");
      return;
    }

    if (editorMode === "edit-content") {
      setActiveTab("content");
    }
  }, [editorMode]);

  useEffect(() => {
    if (!block) {
      setSelectedFieldKey(null);
      return;
    }

    const availableKeys = new Set(contentFields.map((field) => field.key));
    if (!selectedFieldKey || !availableKeys.has(selectedFieldKey)) {
      setSelectedFieldKey(contentFields[0]?.key ?? null);
    }
  }, [block, contentFields, selectedFieldKey]);

  const selectedField = useMemo(
    () => contentFields.find((field) => field.key === selectedFieldKey) ?? null,
    [contentFields, selectedFieldKey],
  );

  const selectionPath = block
    ? `${blockLabel} > ${selectedField?.label ?? "Content"} > ${getFieldKindLabel(selectedField)}`
    : "";
  const modeLabel = getModeLabel(editorMode);
  const modeTone = editorMode === "edit-style"
    ? "styling"
    : editorMode === "edit-content"
      ? "editing"
      : "selected";

  const blockSnapshot = useMemo(() => {
    if (!block) return "";
    return JSON.stringify(
      {
        type: block.type,
        props: block.props,
        bindings: block.bindings ?? {},
        repeater: block.repeater ?? null,
      },
      null,
      2,
    );
  }, [block]);

  if (!block) {
    return (
      <InspectorEmptyState
        icon={<SlidersHorizontal className="h-5 w-5" />}
        title="No block selected"
        description="Select a block on the canvas to edit its content and styles."
      />
    );
  }

  return (
    <InspectorShell
      icon={<BlockIcon type={block.type} className="h-4 w-4" />}
      title={blockLabel}
      selectionPath={selectionPath}
      modeLabel={modeLabel}
      modeTone={modeTone}
      meta={(
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
          {BLOCK_LABELS[block.type]}
        </span>
      )}
      helper={blockDefinition?.description ?? "Use the same content, style, and advanced structure across every block type."}
      actions={(
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
      )}
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
            title="Editable Content"
            description="Select the content area you want to update, then edit it directly from the inspector."
          >
            {contentFields.length ? (
              <div className="grid gap-3">
                {contentFields.map((field) => (
                  <FieldCard
                    key={field.key}
                    block={block}
                    field={field}
                    value={block.props[field.key]}
                    selected={selectedFieldKey === field.key}
                    onSelect={() => setSelectedFieldKey(field.key)}
                    onChange={onChange}
                    bindingControl={field.bindingTarget ? (
                      <FieldBindingControl
                        category={category}
                        sourceData={sourceData}
                        fieldKey={field.key}
                        fieldLabel={field.label}
                        target={field.bindingTarget}
                        binding={block.bindings?.[field.key]}
                        repeaterPath={block.repeater?.sourcePath}
                        defaultOpen={!block.bindings?.[field.key]?.segments?.length}
                        onChange={(binding) => onBindingChange(block.id, field.key, binding)}
                        onClear={() => onBindingClear(block.id, field.key)}
                      />
                    ) : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-5 text-center text-xs text-muted-foreground">
                This block does not expose direct content controls yet.
              </div>
            )}
          </InspectorSection>

          {supportsRepeater ? (
            <InspectorSection
              title="Collection Source"
              description="Connect this block to a repeating list and manage how empty states behave."
            >
              <RepeaterBindingControl
                category={category}
                sourceData={sourceData}
                repeater={block.repeater}
                onChange={(repeater) => onRepeaterChange(block.id, repeater)}
                onClear={() => onRepeaterClear(block.id)}
              />
            </InspectorSection>
          ) : null}

          {block.type === "dataTable" ? (
            <InspectorSection
              title="Table Rows"
              description="Edit visible labels while value bindings stay controlled in Advanced."
            >
              <div className="grid gap-3">
                {[1, 2, 3, 4, 5, 6].map((index) => {
                  const labelKey = `row${index}Label`;
                  const valueKey = `row${index}Value`;
                  const hasRow = Boolean(block.props[labelKey]) ||
                    Boolean(block.bindings?.[valueKey]?.segments?.length) ||
                    index <= 2;
                  if (!hasRow) return null;

                  return (
                    <div key={labelKey} className="rounded-2xl border border-border bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-foreground">Row {index}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Visible label on the left side of the table.
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          Label
                        </span>
                      </div>
                      <FieldEditor
                        block={block}
                        field={{ key: labelKey, label: `Row ${index} label`, type: "text" }}
                        value={block.props[labelKey]}
                        onChange={onChange}
                        compact
                      />
                    </div>
                  );
                })}
              </div>
            </InspectorSection>
          ) : null}
        </div>
      ) : null}

      {activeTab === "style" ? (
        <div className="grid gap-4">
          <InspectorSection
            title="Style Controls"
            description="Adjust presentation settings for this block without touching the block structure."
          >
            {styleFields.length ? (
              <div className="grid gap-3">
                {styleFields.map((field) => (
                  <div key={field.key} className="rounded-2xl border border-border bg-white p-4">
                    <FieldEditor
                      block={block}
                      field={field}
                      value={block.props[field.key]}
                      onChange={onChange}
                      compact
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-5 text-center text-xs text-muted-foreground">
                This block does not expose separate style controls. Its visual output is driven by the block type itself.
              </div>
            )}
          </InspectorSection>
        </div>
      ) : null}

      {activeTab === "advanced" ? (
        <div className="grid gap-4">
          <InspectorSection
            title="Bindings"
            description="Technical mapping controls stay here so day-to-day editing remains focused on content first."
          >
            <div className="grid gap-3">
              {advancedFields.length ? (
                advancedFields.map((field) => (
                  <FieldBindingControl
                    key={field.key}
                    category={category}
                    sourceData={sourceData}
                    fieldKey={field.key}
                    fieldLabel={field.label}
                    target={field.bindingTarget ?? "label"}
                    binding={block.bindings?.[field.key]}
                    repeaterPath={block.repeater?.sourcePath}
                    onChange={(binding) => onBindingChange(block.id, field.key, binding)}
                    onClear={() => onBindingClear(block.id, field.key)}
                  />
                ))
              ) : bindingFields.length ? (
                bindingFields
                  .filter((field) => !contentFields.some((contentField) => contentField.key === field.key))
                  .map((field) => (
                    <FieldBindingControl
                      key={field.key}
                      category={category}
                      sourceData={sourceData}
                      fieldKey={field.key}
                      fieldLabel={field.label}
                      target={field.bindingTarget ?? "label"}
                      binding={block.bindings?.[field.key]}
                      repeaterPath={block.repeater?.sourcePath}
                      onChange={(binding) => onBindingChange(block.id, field.key, binding)}
                      onClear={() => onBindingClear(block.id, field.key)}
                    />
                  ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-5 text-center text-xs text-muted-foreground">
                  No additional binding controls are available for this block.
                </div>
              )}
            </div>
          </InspectorSection>

          <InspectorSection
            title="Block Snapshot"
            description="Read-only block state for debugging and advanced QA."
          >
            <label className="grid gap-1.5 text-xs">
              <InspectorFieldLabel>Current Block Data</InspectorFieldLabel>
              <Textarea
                readOnly
                value={blockSnapshot}
                className="min-h-[240px] font-mono text-[12px] leading-6"
              />
            </label>
          </InspectorSection>
        </div>
      ) : null}
    </InspectorShell>
  );
}
