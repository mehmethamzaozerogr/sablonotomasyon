import type {
  BlockFieldDefinition,
  BlockPreset,
  BlockValue,
  EditorBlock,
  TemplateCategory,
  TemplateHtmlEnvelope,
} from "@/types/template";
import { createBlockInstanceFromDefinition } from "@/lib/blocks/define-block";
import {
  getBlockDefinition,
  getBlockPresetFromDefinition,
  getRegisteredBlockTypes,
  isCategoryAllowed,
} from "@/lib/blocks/registry";
import { parseScribanHtmlToBlocks } from "./html-parser";

const metinAlanlari: BlockFieldDefinition[] = [
  {
    key: "headline",
    label: "Başlık",
    type: "text",
    bindingTarget: "title",
    placeholder: "Başlık",
  },
  {
    key: "body",
    label: "İçerik",
    type: "textarea",
    bindingTarget: "text",
    placeholder: "İçerik",
  },
];

const durumAlani: BlockFieldDefinition = {
  key: "status",
  label: "Durum tonu",
  type: "select",
  options: [
    { label: "Bilgi", value: "neutral" },
    { label: "Başarılı", value: "good" },
    { label: "Uyarı", value: "alert" },
  ],
};

export const blockPresets: BlockPreset[] = [
  {
    type: "hero",
    name: "Üst Başlık",
    description: "Şablonun ana mesajını taşıyan üst alan.",
    accent: "from-amber-500/25 to-transparent",
    categories: ["shared"],
    props: {
      headline: "Bilgilendirme",
      body: "Şablon içeriği bu alanda özetlenir.",
      align: "left",
      tone: "warm",
    },
    fields: [
      ...metinAlanlari,
      {
        key: "align",
        label: "Hizalama",
        type: "select",
        options: [
          { label: "Sol", value: "left" },
          { label: "Orta", value: "center" },
        ],
      },
      {
        key: "tone",
        label: "Görünüm tonu",
        type: "select",
        options: [
          { label: "Sıcak", value: "warm" },
          { label: "Soğuk", value: "cool" },
        ],
      },
    ],
  },
  {
    type: "richText",
    name: "Metin Alanı",
    description: "Uzun metin, açıklama ve yardım içeriği için kullanılır.",
    accent: "from-slate-500/25 to-transparent",
    categories: ["shared"],
    props: {
      headline: "Açıklama",
      body: "Detayli metin alani",
    },
    fields: [...metinAlanlari],
  },
  {
    type: "cta",
    name: "Takip Bilgisi",
    description: "Yönlendirme butonu veya takip bağlantısı.",
    accent: "from-cyan-500/25 to-transparent",
    categories: ["shared"],
    props: {
      label: "Detayi ac",
      href: "",
      fullWidth: true,
    },
    fields: [
      {
        key: "label",
        label: "Buton metni",
        type: "text",
        bindingTarget: "label",
        placeholder: "Buton metni",
      },
      {
        key: "href",
        label: "Yönlendirme bağlantısı",
        type: "text",
        bindingTarget: "href",
        placeholder: "https://",
      },
      {
        key: "fullWidth",
        label: "Tam genislik",
        type: "toggle",
      },
    ],
  },
  {
    type: "divider",
    name: "Ayirici",
    description: "Bölümler arasında boşluk ve ritim oluşturur.",
    accent: "from-white/10 to-transparent",
    categories: ["shared"],
    props: { label: "" },
    fields: [
      {
        key: "label",
        label: "Etiket",
        type: "text",
        placeholder: "Istege bagli etiket",
      },
    ],
  },
  {
    type: "spacer",
    name: "Bosluk",
    description: "Dikey boşluk kontrolü sağlar.",
    accent: "from-white/10 to-transparent",
    categories: ["shared"],
    props: { height: 32 },
    fields: [
      {
        key: "height",
        label: "Yukseklik",
        type: "number",
        min: 8,
        max: 120,
      },
    ],
  },
  {
    type: "image",
    name: "Görsel",
    description: "Urun veya bilgilendirme gorseli.",
    accent: "from-indigo-500/25 to-transparent",
    categories: ["shared"],
    props: {
      src: "",
      alt: "Görsel",
      width: 600,
    },
    fields: [
      {
        key: "src",
        label: "Görsel bağlantısı",
        type: "text",
        bindingTarget: "image",
      },
      {
        key: "alt",
        label: "Alternatif metin",
        type: "text",
        bindingTarget: "label",
      },
      {
        key: "width",
        label: "Maksimum genislik",
        type: "number",
        min: 120,
        max: 1200,
      },
    ],
  },
  {
    type: "footer",
    name: "Alt Bilgi",
    description: "Sirket bilgileri ve destek notu.",
    accent: "from-slate-400/20 to-transparent",
    categories: ["shared"],
    props: {
      companyName: "",
      address: "",
      unsubscribeText: "Bu bildirimler hakkinda destek alin",
      showSocialLinks: false,
    },
    fields: [
      { key: "companyName", label: "Sirket adi", type: "text" },
      { key: "address", label: "Adres", type: "text" },
      { key: "unsubscribeText", label: "Alt metin", type: "text" },
      { key: "showSocialLinks", label: "Ek simgeler", type: "toggle" },
    ],
  },
  {
    type: "customHtml",
    name: "Özel HTML Bloğu",
    description: "Gercek workbook HTML icerigini birebir saklar.",
    accent: "from-orange-500/20 to-transparent",
    categories: ["shared"],
    props: { html: "" },
    fields: [
      {
        key: "html",
        label: "HTML",
        type: "textarea",
        placeholder: "<table>...</table>",
      },
    ],
  },
  {
    type: "address",
    name: "Adres Bilgisi",
    description: "Fatura, teslimat veya iade adresi.",
    accent: "from-violet-500/25 to-transparent",
    categories: ["order", "invoice", "return", "shipping"],
    props: {
      headline: "Adres",
      body: "",
    },
    fields: [...metinAlanlari],
  },
  {
    type: "customerInfo",
    name: "Müşteri Bilgisi",
    description: "Alici bilgileri ve iletisim verileri.",
    accent: "from-purple-500/25 to-transparent",
    categories: ["shared"],
    props: {
      headline: "Müşteri",
      name: "",
      email: "",
      phone: "",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text", placeholder: "Müşteri" },
      { key: "name", label: "Ad soyad", type: "text", bindingTarget: "label" },
      { key: "email", label: "E-posta", type: "text", bindingTarget: "label" },
      { key: "phone", label: "Telefon", type: "text", bindingTarget: "label" },
    ],
  },
  {
    type: "note",
    name: "Alt Bilgi",
    description: "Operasyon notu veya aciklayici kisa metin.",
    accent: "from-amber-500/20 to-transparent",
    categories: ["shared"],
    props: {
      body: "Bilgilendirme metni",
      muted: true,
    },
    fields: [
      { key: "body", label: "İçerik", type: "textarea", bindingTarget: "text" },
      { key: "muted", label: "Yumusak ton", type: "toggle" },
    ],
  },
  {
    type: "lineItems",
    name: "Urun Listesi",
    description: "Urun, satir veya paket kayitlarini listeler.",
    accent: "from-emerald-500/25 to-transparent",
    categories: ["order", "invoice", "return", "shipping"],
    props: {
      headline: "Kayitlar",
      body: "",
      itemTitle: "",
      itemSubtitle: "",
      itemSku: "",
      itemQuantity: "",
      itemPrice: "",
      itemBadge: "",
      itemImage: "",
      emptyState: "Gösterilecek kayıt bulunamadı.",
      showImages: true,
    },
    fields: [
      ...metinAlanlari,
      { key: "itemTitle", label: "Kayit basligi", type: "text", bindingTarget: "title" },
      { key: "itemSubtitle", label: "Kayit alt metni", type: "text", bindingTarget: "text" },
      { key: "itemSku", label: "Kod", type: "text", bindingTarget: "label" },
      { key: "itemQuantity", label: "Adet", type: "text", bindingTarget: "label" },
      { key: "itemPrice", label: "Tutar", type: "text", bindingTarget: "price" },
      { key: "itemBadge", label: "Rozet", type: "text", bindingTarget: "badge" },
      { key: "itemImage", label: "Görsel", type: "text", bindingTarget: "image" },
      { key: "emptyState", label: "Bos durum metni", type: "text", bindingTarget: "text" },
      { key: "showImages", label: "Görselleri goster", type: "toggle" },
    ],
  },
  {
    type: "totals",
    name: "Fatura Ozeti",
    description: "Toplam tutari vurgulayan ozet blok.",
    accent: "from-cyan-500/25 to-transparent",
    categories: ["invoice"],
    props: {
      headline: "Fatura ozeti",
      body: "",
    },
    fields: [...metinAlanlari],
  },
  {
    type: "summary",
    name: "Toplamlar",
    description: "Ara toplam, vergi, kargo ve genel toplam alani.",
    accent: "from-teal-500/25 to-transparent",
    categories: ["order", "invoice", "return", "shipping"],
    props: {
      headline: "Toplamlar",
      subtotal: "",
      tax: "",
      shipping: "",
      total: "",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text", bindingTarget: "title" },
      { key: "subtotal", label: "Ara toplam", type: "text", bindingTarget: "price" },
      { key: "tax", label: "Vergi", type: "text", bindingTarget: "price" },
      { key: "shipping", label: "Kargo", type: "text", bindingTarget: "price" },
      { key: "total", label: "Genel toplam", type: "text", bindingTarget: "price" },
    ],
  },
  {
    type: "status",
    name: "Durum Bilgisi",
    description: "Ödeme, kargo veya iade durumunu vurgular.",
    accent: "from-rose-500/25 to-transparent",
    categories: ["order", "invoice", "return", "shipping"],
    props: {
      headline: "Durum",
      body: "",
      status: "neutral",
    },
    fields: [...metinAlanlari, durumAlani],
  },
  {
    type: "shippingInfo",
    name: "Teslimat Bilgileri",
    description: "Kargo firmasi, takip ve teslim bilgileri.",
    accent: "from-emerald-400/20 to-transparent",
    categories: ["order", "shipping"],
    props: {
      headline: "Teslimat Bilgileri",
      carrier: "",
      trackingNumber: "",
      estimatedDelivery: "",
      status: "neutral",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "carrier", label: "Kargo firmasi", type: "text", bindingTarget: "label" },
      { key: "trackingNumber", label: "Takip bilgisi", type: "text", bindingTarget: "label" },
      { key: "estimatedDelivery", label: "Tahmini teslim", type: "text", bindingTarget: "text" },
      durumAlani,
    ],
  },
  {
    type: "returnInfo",
    name: "İade Özeti",
    description: "İade kimliği, nedeni ve durum akışı.",
    accent: "from-rose-400/20 to-transparent",
    categories: ["return"],
    props: {
      headline: "İade Özeti",
      rmaNumber: "",
      body: "",
      status: "good",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "rmaNumber", label: "İade numarası", type: "text", bindingTarget: "label" },
      { key: "body", label: "Açıklama", type: "textarea", bindingTarget: "text" },
      durumAlani,
    ],
  },
  // â”€â”€ Order blocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    type: "orderSummary",
    name: "Sipariş Ozeti",
    description: "Sipariş numarasi, tarihi, musteri adi ve durumu.",
    accent: "from-amber-500/25 to-transparent",
    categories: ["order"],
    props: {
      headline: "Sipariş Ozeti",
      orderNumber: "",
      orderDate: "",
      customerName: "",
      status: "neutral",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "orderNumber", label: "Sipariş numarasi", type: "text", bindingTarget: "label" },
      { key: "orderDate", label: "Sipariş tarihi", type: "text", bindingTarget: "text" },
      { key: "customerName", label: "Müşteri adi", type: "text", bindingTarget: "label" },
      durumAlani,
    ],
  },
  {
    type: "paymentInfo",
    name: "Ödeme Bilgisi",
    description: "Ödeme yöntemi, tutarı ve işlem durumu.",
    accent: "from-green-500/25 to-transparent",
    categories: ["order"],
    props: {
      headline: "Ödeme Bilgisi",
      paymentMethod: "",
      amount: "",
      transactionId: "",
      status: "neutral",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "paymentMethod", label: "Ödeme yöntemi", type: "text", bindingTarget: "label" },
      { key: "amount", label: "Tutar", type: "text", bindingTarget: "price" },
      { key: "transactionId", label: "Islem numarasi", type: "text", bindingTarget: "label" },
      durumAlani,
    ],
  },
  {
    type: "supportSection",
    name: "Müşteri Hizmetleri",
    description: "Destek hatti, e-posta ve calisma saatleri.",
    accent: "from-teal-500/25 to-transparent",
    categories: ["order", "invoice", "return", "shipping"],
    props: {
      headline: "Müşteri Hizmetleri",
      body: "Size yardimci olmaktan mutluluk duyariz.",
      phone: "",
      email: "",
      workingHours: "",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "body", label: "Açıklama", type: "textarea", bindingTarget: "text" },
      { key: "phone", label: "Telefon", type: "text", bindingTarget: "label" },
      { key: "email", label: "E-posta", type: "text", bindingTarget: "label" },
      { key: "workingHours", label: "Calisma saatleri", type: "text" },
    ],
  },
  // â”€â”€ Invoice blocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    type: "invoiceSummary",
    name: "Fatura Bilgileri",
    description: "Fatura numarasi, tarihi, vade ve toplam tutar.",
    accent: "from-cyan-500/25 to-transparent",
    categories: ["invoice"],
    props: {
      headline: "Fatura Bilgileri",
      invoiceNumber: "",
      invoiceDate: "",
      dueDate: "",
      totalAmount: "",
      status: "neutral",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "invoiceNumber", label: "Fatura numarasi", type: "text", bindingTarget: "label" },
      { key: "invoiceDate", label: "Fatura tarihi", type: "text", bindingTarget: "text" },
      { key: "dueDate", label: "Vade tarihi", type: "text", bindingTarget: "text" },
      { key: "totalAmount", label: "Toplam tutar", type: "text", bindingTarget: "price" },
      durumAlani,
    ],
  },
  {
    type: "invoiceNotice",
    name: "Fatura Notu",
    description: "Yasal uyari, bilgilendirme veya aciklama kutusu.",
    accent: "from-yellow-500/20 to-transparent",
    categories: ["invoice"],
    props: {
      headline: "Bilgilendirme",
      body: "Bu fatura elektronik olarak olusturulmus olup isleminiz hakkinda bilgilendirme amaclidir.",
      tone: "neutral",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "body", label: "İçerik", type: "textarea", bindingTarget: "text" },
      {
        key: "tone",
        label: "Ton",
        type: "select",
        options: [
          { label: "Bilgi", value: "neutral" },
          { label: "Başarılı", value: "good" },
          { label: "Uyarı", value: "alert" },
        ],
      },
    ],
  },
  // â”€â”€ Shipping blocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    type: "shipmentSummary",
    name: "Kargo Ozeti",
    description: "Kargo kodu, firma, cikis ve hedef bilgileri.",
    accent: "from-sky-500/25 to-transparent",
    categories: ["shipping"],
    props: {
      headline: "Kargo Ozeti",
      shipmentCode: "",
      carrier: "",
      origin: "",
      destination: "",
      status: "neutral",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "shipmentCode", label: "Kargo kodu", type: "text", bindingTarget: "label" },
      { key: "carrier", label: "Kargo firmasi", type: "text", bindingTarget: "label" },
      { key: "origin", label: "Cikis noktasi", type: "text", bindingTarget: "text" },
      { key: "destination", label: "Hedef nokta", type: "text", bindingTarget: "text" },
      durumAlani,
    ],
  },
  {
    type: "trackingTimeline",
    name: "Takip Zaman Cizelgesi",
    description: "Sipariş alindi, kargoya verildi, teslim edildi adimlarini gosterir.",
    accent: "from-indigo-500/25 to-transparent",
    categories: ["shipping", "order"],
    props: {
      headline: "Teslimat Durumu",
      step1: "Sipariş Alindi",
      step1Date: "",
      step2: "Kargoya Verildi",
      step2Date: "",
      step3: "Teslim Edildi",
      step3Date: "",
      currentStep: 1,
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "currentStep", label: "Aktif adim (1-3)", type: "number", min: 1, max: 3 },
      { key: "step1", label: "1. Adim", type: "text" },
      { key: "step1Date", label: "1. Adim tarihi", type: "text", bindingTarget: "text" },
      { key: "step2", label: "2. Adim", type: "text" },
      { key: "step2Date", label: "2. Adim tarihi", type: "text", bindingTarget: "text" },
      { key: "step3", label: "3. Adim", type: "text" },
      { key: "step3Date", label: "3. Adim tarihi", type: "text", bindingTarget: "text" },
    ],
  },
  // â”€â”€ Return blocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    type: "returnReason",
    name: "İade Nedeni",
    description: "İade kodu, nedeni ve musteri aciklamasi.",
    accent: "from-rose-500/25 to-transparent",
    categories: ["return"],
    props: {
      headline: "İade Nedeni",
      returnCode: "",
      reason: "",
      details: "",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "returnCode", label: "İade kodu", type: "text", bindingTarget: "label" },
      { key: "reason", label: "Neden", type: "text", bindingTarget: "text" },
      { key: "details", label: "Açıklama", type: "textarea", bindingTarget: "text" },
    ],
  },
  {
    type: "returnInstructions",
    name: "İade Talimatları",
    description: "Adim adim iade sureci ve paketleme talimatlari.",
    accent: "from-orange-500/25 to-transparent",
    categories: ["return"],
    props: {
      headline: "İade Süreci",
      step1: "Urunu orijinal ambalajinda paketleyin.",
      step2: "Kargo kodunu ambalaj uzerine yapistiriniz.",
      step3: "En yakin kargo subesinden gonderiminizi yapiniz.",
      note: "",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "step1", label: "1. Adim", type: "textarea", bindingTarget: "text" },
      { key: "step2", label: "2. Adim", type: "textarea", bindingTarget: "text" },
      { key: "step3", label: "3. Adim", type: "textarea", bindingTarget: "text" },
      { key: "note", label: "Not", type: "text", bindingTarget: "text" },
    ],
  },
  // ── E-commerce extras ─────────────────────────────────────────────────────
  {
    type: "promotionBanner",
    name: "Promosyon Bandı",
    description: "İndirim kodu, kampanya başlığı ve kullanım talimatı.",
    accent: "from-pink-500/25 to-transparent",
    categories: ["order", "invoice", "shared"],
    props: {
      headline: "Özel Teklif",
      body: "Bir sonraki siparişinizde geçerli.",
      promoCode: "",
      ctaLabel: "Kodu Kopyala",
      ctaHref: "",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text", bindingTarget: "title" },
      { key: "body", label: "Açıklama", type: "textarea", bindingTarget: "text" },
      { key: "promoCode", label: "Promosyon kodu", type: "text", bindingTarget: "label" },
      { key: "ctaLabel", label: "Buton metni", type: "text", bindingTarget: "label" },
      { key: "ctaHref", label: "Yönlendirme bağlantısı", type: "text", bindingTarget: "href" },
    ],
  },
  {
    type: "productCard",
    name: "Ürün Kartı",
    description: "Tek ürün detayı: görsel, ad, fiyat ve sipariş butonu.",
    accent: "from-violet-500/25 to-transparent",
    categories: ["order", "invoice"],
    props: {
      imageSrc: "",
      imageAlt: "Ürün görseli",
      productName: "",
      sku: "",
      price: "",
      ctaLabel: "Ürünü İncele",
      ctaHref: "",
      showBadge: false,
      badge: "",
    },
    fields: [
      { key: "imageSrc", label: "Görsel bağlantısı", type: "text", bindingTarget: "image" },
      { key: "imageAlt", label: "Görsel açıklaması", type: "text", bindingTarget: "label" },
      { key: "productName", label: "Ürün adı", type: "text", bindingTarget: "title" },
      { key: "sku", label: "Ürün kodu (SKU)", type: "text", bindingTarget: "label" },
      { key: "price", label: "Fiyat", type: "text", bindingTarget: "price" },
      { key: "ctaLabel", label: "Buton metni", type: "text", bindingTarget: "label" },
      { key: "ctaHref", label: "Yönlendirme bağlantısı", type: "text", bindingTarget: "href" },
      { key: "showBadge", label: "Rozet göster", type: "toggle" },
      { key: "badge", label: "Rozet metni", type: "text", bindingTarget: "badge" },
    ],
  },
  {
    type: "loyaltyPoints",
    name: "Sadakat Puanı",
    description: "Kazanılan puan, mevcut bakiye ve puan kullanım bilgisi.",
    accent: "from-amber-500/25 to-transparent",
    categories: ["order", "shared"],
    props: {
      headline: "Kazandığınız Puan",
      earnedPoints: "",
      totalBalance: "",
      body: "Puanlarınızı bir sonraki alışverişinizde kullanabilirsiniz.",
      ctaLabel: "Puanlarımı Gör",
      ctaHref: "",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text", bindingTarget: "title" },
      { key: "earnedPoints", label: "Kazanılan puan", type: "text", bindingTarget: "label" },
      { key: "totalBalance", label: "Toplam bakiye", type: "text", bindingTarget: "label" },
      { key: "body", label: "Açıklama", type: "textarea", bindingTarget: "text" },
      { key: "ctaLabel", label: "Buton metni", type: "text", bindingTarget: "label" },
      { key: "ctaHref", label: "Yönlendirme bağlantısı", type: "text", bindingTarget: "href" },
    ],
  },
  {
    type: "ratingRequest",
    name: "Değerlendirme İsteği",
    description: "Sipariş veya ürün değerlendirmesine yönlendirme bloğu.",
    accent: "from-yellow-500/25 to-transparent",
    categories: ["order", "shipping", "shared"],
    props: {
      headline: "Deneyiminizi Paylaşın",
      body: "Siparişinizi değerlendirerek diğer müşterilere yardımcı olun.",
      ctaLabel: "Değerlendirme Yap",
      ctaHref: "",
      showStars: true,
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text", bindingTarget: "title" },
      { key: "body", label: "Açıklama", type: "textarea", bindingTarget: "text" },
      { key: "ctaLabel", label: "Buton metni", type: "text", bindingTarget: "label" },
      { key: "ctaHref", label: "Yönlendirme bağlantısı", type: "text", bindingTarget: "href" },
      { key: "showStars", label: "Yıldız göster", type: "toggle" },
    ],
  },
  // ── Generic ────────────────────────────────────────────────────────────────
  {
    type: "dataTable",
    name: "Veri Tablosu",
    description: "İki sütunlu etiket-değer tablosu. Sipariş özeti, teslimat bilgisi gibi bölümler için.",
    accent: "from-indigo-500/25 to-transparent",
    categories: ["order", "invoice", "return", "shipping"],
    props: {
      headline: "Bölüm Başlığı",
      row1Label: "Alan 1", row1Value: "",
      row2Label: "Alan 2", row2Value: "",
      row3Label: "",       row3Value: "",
      row4Label: "",       row4Value: "",
      row5Label: "",       row5Value: "",
      row6Label: "",       row6Value: "",
    },
    fields: [
      { key: "headline", label: "Başlık", type: "text" },
      { key: "row1Label", label: "Satır 1 — Etiket", type: "text" },
      { key: "row1Value", label: "Satır 1 — Değer", type: "text", bindingTarget: "label", bindingOnly: true },
      { key: "row2Label", label: "Satır 2 — Etiket", type: "text" },
      { key: "row2Value", label: "Satır 2 — Değer", type: "text", bindingTarget: "label", bindingOnly: true },
      { key: "row3Label", label: "Satır 3 — Etiket", type: "text" },
      { key: "row3Value", label: "Satır 3 — Değer", type: "text", bindingTarget: "label", bindingOnly: true },
      { key: "row4Label", label: "Satır 4 — Etiket", type: "text" },
      { key: "row4Value", label: "Satır 4 — Değer", type: "text", bindingTarget: "label", bindingOnly: true },
      { key: "row5Label", label: "Satır 5 — Etiket", type: "text" },
      { key: "row5Value", label: "Satır 5 — Değer", type: "text", bindingTarget: "label", bindingOnly: true },
      { key: "row6Label", label: "Satır 6 — Etiket", type: "text" },
      { key: "row6Value", label: "Satır 6 — Değer", type: "text", bindingTarget: "label", bindingOnly: true },
    ],
  },
];

const presetMap = Object.fromEntries(
  blockPresets.map((preset) => [preset.type, preset]),
) as Record<BlockPreset["type"], BlockPreset>;

export function buildBlock(
  type: BlockPreset["type"],
  id: string,
  props: Partial<EditorBlock["props"]> = {},
): EditorBlock {
  const definition = getBlockDefinition(type);
  if (definition) {
    return createBlockInstanceFromDefinition(definition, id, props);
  }

  const preset = presetMap[type];
  const mergedProps: Record<string, BlockValue> = { ...preset.props };

  Object.entries(props).forEach(([key, value]) => {
    if (value !== undefined) {
      mergedProps[key] = value;
    }
  });

  return {
    id,
    type: preset.type,
    name: preset.name,
    description: preset.description,
    fields: preset.fields.map((field) => ({ ...field })),
    props: mergedProps,
  };
}

export function getBlocksForCategory(category: TemplateCategory) {
  const registryTypes = new Set(getRegisteredBlockTypes());
  const registryPresets = getRegisteredBlockTypes()
    .map((type) => {
      const legacyPreset = presetMap[type];
      return getBlockPresetFromDefinition(type, legacyPreset?.accent);
    })
    .filter((preset): preset is BlockPreset => Boolean(preset))
    .filter((preset) => isCategoryAllowed(preset.type, category, preset.categories));

  const legacyPresets = blockPresets.filter(
    (preset) =>
      !registryTypes.has(preset.type) &&
      (preset.categories.includes("shared") || preset.categories.includes(category)),
  );

  return [...registryPresets, ...legacyPresets];
}

export function createCategoryStarterBlocks(
  _category: TemplateCategory,
  html: string,
): { blocks: EditorBlock[]; htmlEnvelope: TemplateHtmlEnvelope | null } {
  return parseScribanHtmlToBlocks(html);
}
