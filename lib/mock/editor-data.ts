// ---------------------------------------------------------------------------
// Mock data for the visual template editor
// ---------------------------------------------------------------------------

export type ComponentCategory = "temel" | "lojistik" | "duzen";

export type ComponentItem = {
  id: string;
  type: string;
  name: string;
  icon: string; // lucide icon name
  category: ComponentCategory;
};

export const componentLibraryItems: ComponentItem[] = [
  // Temel
  { id: "text-block", type: "text", name: "Metin Bloğu", icon: "Type", category: "temel" },
  { id: "image-block", type: "image", name: "Görsel Bloğu", icon: "Image", category: "temel" },
  { id: "button-block", type: "button", name: "Buton Bloğu", icon: "MousePointer2", category: "temel" },
  // Lojistik
  { id: "tracking-map", type: "trackingMap", name: "Takip Haritası", icon: "MapPin", category: "lojistik" },
  { id: "order-table", type: "orderTable", name: "Sipariş Tablosu", icon: "Table", category: "lojistik" },
  { id: "shipping-status", type: "shippingStatus", name: "Kargo Durumu", icon: "Truck", category: "lojistik" },
  // Düzen
  { id: "columns", type: "columns", name: "Sütunlar", icon: "Columns", category: "duzen" },
  { id: "dividers", type: "dividers", name: "Ayırıcılar", icon: "SeparatorHorizontal", category: "duzen" },
];

export const categoryLabels: Record<ComponentCategory, string> = {
  temel: "Temel",
  lojistik: "Lojistik",
  duzen: "Düzen",
};

// ---------------------------------------------------------------------------
// Sample canvas blocks for the order confirmation template
// ---------------------------------------------------------------------------

export type CanvasElement = {
  id: string;
  type: string;
  label: string;
  selected?: boolean;
  content?: Record<string, unknown>;
};

export const sampleCanvasElements: CanvasElement[] = [
  {
    id: "el-1",
    type: "heading",
    label: "SİPARİŞ ONAYI",
    content: {
      text: "SİPARİŞ ONAYI",
      fontSize: 14,
      fontWeight: 600,
      textAlign: "center",
      color: "#6B7280",
      letterSpacing: "0.1em",
    },
  },
  {
    id: "el-2",
    type: "orderNumber",
    label: "Sipariş No: #10421798815",
    content: {
      text: "Sipariş No: #10421798815",
      fontSize: 32,
      fontWeight: 700,
      textAlign: "center",
      color: "#111827",
    },
  },
  {
    id: "el-3",
    type: "greeting",
    label: "Karşılama Metni",
    content: {
      text: "Merhaba ((Müşteri.Ad)),\nSiparişiniz için teşekkür ederiz. Gönderiniz ((Kargo.Firma)) ile yola çıktı.",
      fontSize: 15,
      color: "#374151",
      padding: 24,
      backgroundColor: "#F9FAFB",
      borderRadius: 8,
    },
  },
  {
    id: "el-4",
    type: "productTable",
    label: "Ürün Tablosu",
    content: {
      columns: ["Ürün", "Adet", "Fiyat"],
      rows: [
        ["Trendyol Duty", "1", "₺59,99"],
        ["Kablosuz Kulaklık", "1", "₺129,50"],
      ],
    },
  },
  {
    id: "el-5",
    type: "totals",
    label: "Toplam Özeti",
    content: {
      subtotal: "₺189,48",
      shipping: "₺0,00",
      total: "₺189,49",
    },
  },
  {
    id: "el-6",
    type: "ctaButton",
    label: "CTA Butonu",
    content: {
      text: "Siparişini Takip Et",
      backgroundColor: "#EF4444",
      color: "#FFFFFF",
      borderRadius: 8,
      padding: "12px 32px",
    },
  },
];

// ---------------------------------------------------------------------------
// Font options for the inspector
// ---------------------------------------------------------------------------

export const fontFamilyOptions = [
  { label: "Inter", value: "Inter" },
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
];

export const textAlignOptions = [
  { label: "Sol", value: "left", icon: "AlignLeft" },
  { label: "Orta", value: "center", icon: "AlignCenter" },
  { label: "Sağ", value: "right", icon: "AlignRight" },
  { label: "İki Yana", value: "justify", icon: "AlignJustify" },
];

export const borderStyleOptions = [
  { label: "Yok", value: "none" },
  { label: "Düz", value: "solid" },
  { label: "Kesikli", value: "dashed" },
  { label: "Noktalı", value: "dotted" },
];

export const recentColors = [
  "#EF4444",
  "#F97316",
  "#F5F5F5",
  "#E5E7EB",
  "#FFFFFF",
  "#111827",
];
