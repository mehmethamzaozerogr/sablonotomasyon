import type { BlockFieldBinding, BindingFieldTarget, RepeaterBinding } from "@/types/binding";

export type TemplateCategory = "order" | "invoice" | "return" | "shipping";

export type TemplateStatus = "draft" | "review" | "active";

export type PreviewMode = "desktop" | "tablet" | "mobile" | "print";

export type TemplateShadowPreset = "none" | "soft" | "medium" | "strong";

export type TemplateDividerStyle = "solid" | "dashed" | "subtle";

export type TemplateColorTokens = {
  bodyBackground: string;
  canvasBackground: string;
  contentBackground: string;
  mutedSurface: string;
  borderColor: string;
  textColor: string;
  headingColor: string;
  linkColor: string;
  accentColor: string;
  buttonBackground: string;
  buttonTextColor: string;
};

export type TemplateTypographySystem = {
  fontFamily: string;
  headingFontFamily: string;
  baseFontSize: number;
  headingScale: number;
  lineHeight: number;
};

export type TemplateLayoutSystem = {
  pageWidth: number;
  contentWidth: number;
  sectionSpacing: number;
  containerPaddingX: number;
  containerPaddingY: number;
  radius: number;
  borderWidth: number;
  shadowPreset: TemplateShadowPreset;
  buttonRadius: number;
  buttonPaddingX: number;
  buttonPaddingY: number;
  imageRadius: number;
  dividerStyle: TemplateDividerStyle;
};

export type TemplateSavedTheme = {
  id: string;
  name: string;
  description?: string;
  originPresetId?: string | null;
  palette: TemplateColorTokens;
  typography: TemplateTypographySystem;
  layout: TemplateLayoutSystem;
};

export type TemplateDesignSystem = {
  version: 1;
  activeThemeId: string;
  activeThemeName: string;
  palette: TemplateColorTokens;
  typography: TemplateTypographySystem;
  layout: TemplateLayoutSystem;
  syncedFromSource?: {
    fonts: string[];
    colors: Partial<Record<keyof TemplateColorTokens, string>>;
  };
  customThemes?: TemplateSavedTheme[];
  lastAppliedAt?: string | null;
};

export type BlockType =
  // Shared layout
  | "hero"
  | "richText"
  | "cta"
  | "divider"
  | "spacer"
  | "image"
  | "footer"
  | "customHtml"
  // Customer & address
  | "address"
  | "customerInfo"
  | "note"
  // Commerce
  | "lineItems"
  | "totals"
  | "summary"
  | "status"
  // Category-specific
  | "shippingInfo"
  | "returnInfo"
  // Order
  | "orderSummary"
  | "paymentInfo"
  | "supportSection"
  // Invoice
  | "invoiceSummary"
  | "invoiceNotice"
  // Shipping
  | "shipmentSummary"
  | "trackingTimeline"
  // Return
  | "returnReason"
  | "returnInstructions"
  // E-commerce extras
  | "promotionBanner"
  | "productCard"
  | "loyaltyPoints"
  | "ratingRequest"
  // Generic
  | "dataTable";

export type BlockFieldType =
  | "text"
  | "textarea"
  | "number"
  | "color"
  | "toggle"
  | "select";

export type BlockFieldOption = {
  label: string;
  value: string;
};

export type BlockFieldDefinition = {
  key: string;
  label: string;
  type: BlockFieldType;
  bindingTarget?: BindingFieldTarget;
  /** When true, the field only appears in the binding panel — not in the content editor */
  bindingOnly?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: BlockFieldOption[];
};

export type BlockValue = string | number | boolean;

export type LegacyBlockMetadata = {
  name?: string;
  description?: string;
  fields?: BlockFieldDefinition[];
};

export type EditorBlock = LegacyBlockMetadata & {
  id: string;
  type: BlockType;
  props: Record<string, BlockValue>;
  bindings?: Record<string, BlockFieldBinding>;
  repeater?: RepeaterBinding | null;
  children?: EditorBlock[];
};

export type BlockPreset = {
  type: BlockType;
  name: string;
  description: string;
  props: Record<string, BlockValue>;
  fields: BlockFieldDefinition[];
  bindings?: Record<string, BlockFieldBinding>;
  repeater?: RepeaterBinding | null;
  categories: Array<TemplateCategory | "shared">;
  accent: string;
};

export type WorkbookTemplateRow = {
  parsedTemplateEngine: string;
  parsedTemplateType: string;
  templateId: string;
  templateType: string;
  title: string;
  description: string;
  messageSubject: string;
  messageDetail: string;
  createdDate: string;
  isEnabled: boolean;
  contentType: string;
  itemTemplate: string;
  pageBreak: string;
  templateEngine: string;
  sourceFile: string;
  sheetName: string;
};

export type TemplateHtmlEnvelope = {
  kind: "row-sections";
  envelopeOpen: string;
  envelopeClose: string;
};

export type TemplateRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  status: TemplateStatus;
  updatedAt: string;
  subject: string;
  tags: string[];
  blocks: EditorBlock[];
  htmlEnvelope?: TemplateHtmlEnvelope | null;
  designSystem?: TemplateDesignSystem | null;
  source: WorkbookTemplateRow;
};
