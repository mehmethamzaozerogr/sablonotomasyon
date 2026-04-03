export type DetectedSectionRole =
  | "header"
  | "logo"
  | "hero"
  | "intro"
  | "status"
  | "summary"
  | "address"
  | "products"
  | "cta"
  | "support"
  | "payment"
  | "tracking"
  | "social"
  | "legal"
  | "footer"
  | "content";

export type DetectedSectionInfo = {
  label: string;
  role: DetectedSectionRole;
  description: string;
  keywords: string[];
};

type SectionRule = {
  role: DetectedSectionRole;
  label: string;
  description: string;
  tokens: string[];
};

const SECTION_RULES: SectionRule[] = [
  {
    role: "logo",
    label: "Logo Area",
    description: "Brand logo or company identity surface.",
    tokens: ["logo", "brand", "companyname", "frmcompanyname"],
  },
  {
    role: "header",
    label: "Header",
    description: "Top framing section introducing the template.",
    tokens: ["header", "ust baslik", "title bar", "masthead"],
  },
  {
    role: "hero",
    label: "Hero",
    description: "Primary headline or lead message section.",
    tokens: [
      "hero",
      "headline",
      "baslik",
      "siparisiniz hazirlaniyor",
      "your order",
      "shipment",
      "invoice",
    ],
  },
  {
    role: "intro",
    label: "Intro Text",
    description: "Opening explanation or customer-facing summary.",
    tokens: [
      "intro",
      "tesekkur",
      "teşekkür",
      "hazirlik",
      "prepared",
      "thanks",
      "hello",
      "merhaba",
    ],
  },
  {
    role: "status",
    label: "Status Update",
    description: "Dynamic status, state, or journey information.",
    tokens: ["status", "state", "durum", "paymentstate", "statusdesc"],
  },
  {
    role: "summary",
    label: "Order Summary",
    description: "Totals, summary values, or financial recap.",
    tokens: [
      "summary",
      "order summary",
      "siparis ozeti",
      "sipariş özeti",
      "totalprice",
      "grandtotal",
      "toplam",
      "subtotal",
      "tax",
    ],
  },
  {
    role: "address",
    label: "Address Block",
    description: "Shipping, billing, or contact address information.",
    tokens: [
      "address",
      "delivery",
      "shipping address",
      "billing",
      "invoice address",
      "teslimat",
      "fatura adresi",
      "shipfull",
    ],
  },
  {
    role: "products",
    label: "Product List",
    description: "Repeated product, package, or line-item content.",
    tokens: [
      "{{ for",
      "orderitems",
      "orderpackagedetails",
      "product",
      "urun",
      "ürün",
      "line item",
      "toplanacak",
    ],
  },
  {
    role: "cta",
    label: "Action Area",
    description: "Button, call to action, or next-step link.",
    tokens: [
      "cta",
      "button",
      "href=",
      "v:roundrect",
      "goruntule",
      "görüntüle",
      "track",
      "view order",
    ],
  },
  {
    role: "payment",
    label: "Payment Details",
    description: "Payment, invoice, or billing-specific details.",
    tokens: ["payment", "odeme", "ödeme", "invoice", "fatura", "due date"],
  },
  {
    role: "tracking",
    label: "Tracking Details",
    description: "Shipment carrier, tracking number, or ETA section.",
    tokens: ["tracking", "kargo", "carrier", "estimated delivery", "shipment"],
  },
  {
    role: "support",
    label: "Support Info",
    description: "Help, support, or customer service contact area.",
    tokens: [
      "support",
      "destek",
      "musteri hizmetleri",
      "müşteri hizmetleri",
      "yardim",
      "help",
    ],
  },
  {
    role: "social",
    label: "Social Links",
    description: "Social account or community link cluster.",
    tokens: ["facebook", "instagram", "linkedin", "twitter", "youtube", "social"],
  },
  {
    role: "legal",
    label: "Legal / Disclaimer",
    description: "Legal copy, compliance, or disclaimer content.",
    tokens: [
      "legal",
      "kvkk",
      "disclaimer",
      "yasal",
      "mesafeli satis",
      "mesafeli satış",
      "privacy",
      "terms",
    ],
  },
  {
    role: "footer",
    label: "Footer",
    description: "Closing company information and low-priority actions.",
    tokens: [
      "footer",
      "alt bilgi",
      "unsubscribe",
      "companyphone",
      "infomail",
      "copyright",
    ],
  },
];

function normalizeSignals(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/&nbsp;/g, " ")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ç]/g, "c")
    .replace(/[ğ]/g, "g")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ş]/g, "s")
    .replace(/[ü]/g, "u")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeText(html: string) {
  return normalizeSignals(html);
}

export function detectTemplateSectionInfo(html: string): DetectedSectionInfo {
  const text = tokenizeText(html);

  let bestRule: SectionRule | null = null;
  let bestScore = 0;

  for (const rule of SECTION_RULES) {
    const score = rule.tokens.reduce((total, token) => {
      return total + (text.includes(token) ? token.length + 2 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (!bestRule) {
    return {
      role: "content",
      label: "Content Section",
      description: "General content block detected from the template structure.",
      keywords: [],
    };
  }

  return {
    role: bestRule.role,
    label: bestRule.label,
    description: bestRule.description,
    keywords: bestRule.tokens.filter((token) => text.includes(token)),
  };
}
