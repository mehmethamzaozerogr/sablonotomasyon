import { getBlockDefinition } from "@/lib/blocks/registry";
import { resolveBlockPropValue, resolveRepeaterItems } from "@/lib/bindings/runtime";
import { applyDesignSystemToDocument, ensureTemplateDesignSystem } from "@/lib/editor/template-design";
import { evaluateScriban } from "@/lib/preview/scriban-eval";
import type { EditorBlock, PreviewMode, TemplateRecord } from "@/types/template";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function asBoolean(v: unknown): boolean {
  return typeof v === "boolean" ? v : false;
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === "number" ? v : fallback;
}

function stripLeadingHtmlTrivia(html: string): string {
  let next = html.trimStart();

  while (next.startsWith("<!--")) {
    const commentEnd = next.indexOf("-->");
    if (commentEnd === -1) break;
    next = next.slice(commentEnd + 3).trimStart();
  }

  return next;
}

function isTableRowSection(html: string): boolean {
  return /^<tr\b/i.test(stripLeadingHtmlTrivia(html));
}

function wrapFragmentInEmailRow(fragment: string): string {
  const content = fragment.trim();
  if (!content) return "";

  return `<tr>
  <td style="padding:0 16px 16px 16px;">
    ${content}
  </td>
</tr>`;
}

function card(content: string, bg = "#ffffff", border = "#e2e8f0"): string {
  return `<div style="background:${bg};border:1px solid ${border};border-radius:16px;padding:20px 24px;margin-bottom:16px;">${content}</div>`;
}

function pill(text: string, bg: string, color: string): string {
  return `<span style="display:inline-block;background:${bg};color:${color};border-radius:999px;padding:3px 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">${esc(text)}</span>`;
}

type StatusColors = [bg: string, color: string];

function statusColors(status: string): StatusColors {
  if (status === "good") return ["#dcfce7", "#166534"];
  if (status === "alert") return ["#fee2e2", "#991b1b"];
  return ["#fef9c3", "#854d0e"];
}

function infoRow(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
    <span style="font-size:13px;color:#64748b;">${label}</span>
    <span style="font-size:13px;color:#0f172a;">${value}</span>
  </div>`;
}

// ---------------------------------------------------------------------------
// Block compilers
// ---------------------------------------------------------------------------

function compileSpacer(block: EditorBlock, data: unknown): string {
  const h = asNumber(resolveBlockPropValue(block, "height", data), 32);
  return `<div style="height:${h}px;"></div>`;
}

function compileDivider(block: EditorBlock, data: unknown): string {
  const label = asText(resolveBlockPropValue(block, "label", data));
  if (label) {
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="flex:1;height:1px;background:#e2e8f0;"></div>
      <span style="font-size:11px;color:#94a3b8;letter-spacing:0.18em;text-transform:uppercase;">${esc(label)}</span>
      <div style="flex:1;height:1px;background:#e2e8f0;"></div>
    </div>`;
  }
  return `<div style="height:1px;background:#e2e8f0;margin-bottom:16px;"></div>`;
}

function compileHero(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data));
  const body = asText(resolveBlockPropValue(block, "body", data));
  const tone = asText(resolveBlockPropValue(block, "tone", data)) || "warm";
  const align = asText(resolveBlockPropValue(block, "align", data)) || "left";
  const ta = align === "center" ? "center" : "left";

  if (tone === "cool") {
    return card(
      `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;text-align:${ta};">${esc(headline)}</h1>
       <p style="margin:0;font-size:14px;line-height:1.8;color:#94a3b8;text-align:${ta};">${esc(body)}</p>`,
      "#0f172a",
      "#1e293b",
    );
  }

  return card(
    `<h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#0f172a;text-align:${ta};">${esc(headline)}</h1>
     <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;text-align:${ta};">${esc(body)}</p>`,
    "#fffdf7",
    "#fde68a",
  );
}

function compileRichText(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data));
  const body = asText(resolveBlockPropValue(block, "body", data));
  return card(
    `${headline ? `<h2 style="margin:0 0 10px;font-size:18px;font-weight:600;color:#0f172a;">${esc(headline)}</h2>` : ""}
     <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">${esc(body)}</p>`,
  );
}

function compileCta(block: EditorBlock, data: unknown): string {
  const label = asText(resolveBlockPropValue(block, "label", data)) || "Detayi ac";
  const href = asText(resolveBlockPropValue(block, "href", data));
  const fw = asBoolean(resolveBlockPropValue(block, "fullWidth", data));
  const btnStyle = fw
    ? "display:block;width:100%;text-align:center;box-sizing:border-box;"
    : "display:inline-block;";

  return card(
    `<div>
       <a href="${esc(href) || "#"}" style="${btnStyle}background:#0f172a;color:#ffffff;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:600;text-decoration:none;">${esc(label)}</a>
       ${href ? `<p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">${esc(href)}</p>` : ""}
     </div>`,
  );
}

function compileImage(block: EditorBlock, data: unknown): string {
  const src = asText(resolveBlockPropValue(block, "src", data));
  const alt = asText(resolveBlockPropValue(block, "alt", data)) || "Görsel";
  const width = asNumber(resolveBlockPropValue(block, "width", data), 600);

  if (!src) {
    return card(
      `<div style="height:80px;background:#f1f5f9;border-radius:12px;display:flex;align-items:center;justify-content:center;">
         <span style="color:#94a3b8;font-size:13px;">Görsel bağlantısı eklenmedi</span>
       </div>`,
    );
  }

  return card(
    `<img src="${esc(src)}" alt="${esc(alt)}" width="${width}" style="max-width:${width}px;width:100%;border-radius:12px;display:block;" />`,
  );
}

function compileNote(block: EditorBlock, data: unknown): string {
  const body = asText(resolveBlockPropValue(block, "body", data));
  const muted = asBoolean(resolveBlockPropValue(block, "muted", data));
  return card(
    `<p style="margin:0;font-size:14px;line-height:1.8;color:${muted ? "#94a3b8" : "#475569"};">${esc(body)}</p>`,
    muted ? "#f8fafc" : "#ffffff",
  );
}

function compileAddress(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Adres";
  const body = asText(resolveBlockPropValue(block, "body", data));
  return card(
    `<p style="margin:0 0 12px;font-size:11px;color:#94a3b8;letter-spacing:0.18em;text-transform:uppercase;">${esc(headline)}</p>
     <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;white-space:pre-line;">${esc(body) || "Adres bilgisi bulunamadi."}</p>`,
  );
}

function compileCustomerInfo(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Müşteri";
  const name = asText(resolveBlockPropValue(block, "name", data));
  const email = asText(resolveBlockPropValue(block, "email", data));
  const phone = asText(resolveBlockPropValue(block, "phone", data));

  const rows = [
    name && `<div style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:6px;">${esc(name)}</div>`,
    email && `<div style="font-size:13px;color:#475569;margin-bottom:4px;">${esc(email)}</div>`,
    phone && `<div style="font-size:13px;color:#475569;">${esc(phone)}</div>`,
  ]
    .filter(Boolean)
    .join("");

  return card(
    `<p style="margin:0 0 12px;font-size:11px;color:#94a3b8;letter-spacing:0.18em;text-transform:uppercase;">${esc(headline)}</p>
     ${rows || '<p style="font-size:13px;color:#94a3b8;">Müşteri verisi bulunamadi.</p>'}`,
  );
}

function compileStatus(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data));
  const body = asText(resolveBlockPropValue(block, "body", data));
  const status = asText(resolveBlockPropValue(block, "status", data));
  const [sbg, scolor] = statusColors(status || "neutral");

  return card(
    `${pill(status || "durum", sbg, scolor)}
     ${headline ? `<h2 style="margin:16px 0 8px;font-size:20px;font-weight:600;color:#0f172a;">${esc(headline)}</h2>` : ""}
     ${body ? `<p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">${esc(body)}</p>` : ""}`,
  );
}

function compileLineItems(block: EditorBlock, data: unknown): string {
  const items = resolveRepeaterItems(block, data);
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Urun Listesi";
  const showImages = asBoolean(resolveBlockPropValue(block, "showImages", data));
  const emptyState = asText(resolveBlockPropValue(block, "emptyState", data)) || block.repeater?.emptyFallback || "Gosterilecek kayit bulunamadi.";

  const itemRows = items.length
    ? items
        .map((item, i) => {
          const title = asText(resolveBlockPropValue(block, "itemTitle", data, item)) || `Kayit ${i + 1}`;
          const subtitle = asText(resolveBlockPropValue(block, "itemSubtitle", data, item));
          const sku = asText(resolveBlockPropValue(block, "itemSku", data, item));
          const qty = asText(resolveBlockPropValue(block, "itemQuantity", data, item));
          const price = asText(resolveBlockPropValue(block, "itemPrice", data, item));
          const imgSrc = showImages ? asText(resolveBlockPropValue(block, "itemImage", data, item)) : "";

          const badges = [
            sku && `<span style="font-size:11px;background:#ffffff;border:1px solid #e2e8f0;border-radius:999px;padding:2px 8px;color:#64748b;">${esc(sku)}</span>`,
            qty && `<span style="font-size:11px;background:#ffffff;border:1px solid #e2e8f0;border-radius:999px;padding:2px 8px;color:#64748b;">x${esc(qty)}</span>`,
          ]
            .filter(Boolean)
            .join("");

          return `<div style="display:flex;gap:12px;align-items:flex-start;background:#f8fafc;border-radius:12px;padding:12px 16px;margin-bottom:8px;">
            ${imgSrc ? `<img src="${esc(imgSrc)}" alt="${esc(title)}" width="48" height="48" style="width:48px;height:48px;border-radius:8px;object-fit:cover;flex-shrink:0;" />` : ""}
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                <div>
                  <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0f172a;">${esc(title)}</p>
                  ${subtitle ? `<p style="margin:0;font-size:13px;color:#64748b;">${esc(subtitle)}</p>` : ""}
                </div>
                ${price ? `<span style="font-size:14px;font-weight:600;color:#0f172a;white-space:nowrap;flex-shrink:0;">${esc(price)}</span>` : ""}
              </div>
              ${badges ? `<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">${badges}</div>` : ""}
            </div>
          </div>`;
        })
        .join("")
    : `<p style="font-size:13px;color:#94a3b8;">${esc(emptyState)}</p>`;

  return card(
    `<p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>${itemRows}`,
  );
}

function compileTotals(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Toplam";
  const body = asText(resolveBlockPropValue(block, "body", data)) || "-";

  return card(
    `<p style="margin:0 0 4px;font-size:11px;color:#94a3b8;letter-spacing:0.18em;text-transform:uppercase;">Fatura ozeti</p>
     <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:12px;">
       <div>
         <p style="margin:0 0 4px;font-size:13px;color:#e2e8f0;">${esc(headline)}</p>
         <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">${esc(body)}</p>
       </div>
       <span style="background:rgba(255,255,255,0.12);color:#ffffff;border-radius:999px;padding:3px 10px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">Sabit</span>
     </div>`,
    "#0f172a",
    "#1e293b",
  );
}

function compileSummary(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Toplamlar";
  const subtotal = asText(resolveBlockPropValue(block, "subtotal", data)) || "-";
  const tax = asText(resolveBlockPropValue(block, "tax", data)) || "-";
  const shipping = asText(resolveBlockPropValue(block, "shipping", data)) || "-";
  const total = asText(resolveBlockPropValue(block, "total", data)) || "-";

  return card(
    `<p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
     <div style="border-bottom:1px solid #e2e8f0;padding-bottom:8px;">
       ${infoRow("Ara toplam", subtotal)}
       ${infoRow("Vergi", tax)}
       ${infoRow("Kargo", shipping)}
     </div>
     <div style="padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
       <span style="font-size:15px;font-weight:700;color:#0f172a;">Genel toplam</span>
       <span style="font-size:20px;font-weight:700;color:#0f172a;">${esc(total)}</span>
     </div>`,
  );
}

function compileShippingInfo(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Teslimat Bilgileri";
  const carrier = asText(resolveBlockPropValue(block, "carrier", data));
  const tracking = asText(resolveBlockPropValue(block, "trackingNumber", data));
  const eta = asText(resolveBlockPropValue(block, "estimatedDelivery", data));
  const status = asText(resolveBlockPropValue(block, "status", data)) || "neutral";
  const [sbg, scolor] = statusColors(status);

  const details = [
    carrier && `<div style="margin-bottom:8px;font-size:13px;color:#475569;">&#x1F4E6; ${esc(carrier)}</div>`,
    tracking && `<div style="margin-bottom:8px;font-family:monospace;font-size:13px;color:#475569;"># ${esc(tracking)}</div>`,
    eta && `<div style="font-size:13px;color:#475569;">&#x1F4C5; ${esc(eta)}</div>`,
  ]
    .filter(Boolean)
    .join("");

  return card(
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
       <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
       ${pill(status, sbg, scolor)}
     </div>
     ${details || '<p style="font-size:13px;color:#94a3b8;">Teslimat bilgisi bulunamadi.</p>'}`,
  );
}

function compileReturnInfo(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "İade Özeti";
  const rmaNumber = asText(resolveBlockPropValue(block, "rmaNumber", data));
  const body = asText(resolveBlockPropValue(block, "body", data));
  const status = asText(resolveBlockPropValue(block, "status", data)) || "good";
  const [sbg, scolor] = statusColors(status);

  return card(
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
       <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
       ${pill(status, sbg, scolor)}
     </div>
     ${rmaNumber ? `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
       <span style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.18em;">İade No</span>
       <span style="font-size:14px;font-family:monospace;font-weight:600;color:#0f172a;">${esc(rmaNumber)}</span>
     </div>` : ""}
     ${body ? `<p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">${esc(body)}</p>` : ""}`,
  );
}

function compileFooter(block: EditorBlock, data: unknown): string {
  const companyName = asText(resolveBlockPropValue(block, "companyName", data)) || "Sirket";
  const address = asText(resolveBlockPropValue(block, "address", data));
  const unsubscribeText = asText(resolveBlockPropValue(block, "unsubscribeText", data)) || "Destek bilgisi";
  const showSocialLinks = asBoolean(resolveBlockPropValue(block, "showSocialLinks", data));

  const socials = showSocialLinks
    ? `<div style="display:flex;justify-content:center;gap:8px;margin:12px 0;">
         ${["T", "L", "I"]
           .map(
             (s) =>
               `<div style="width:28px;height:28px;background:rgba(255,255,255,0.1);border-radius:999px;display:inline-flex;align-items:center;justify-content:center;color:#94a3b8;font-size:11px;font-weight:700;">${s}</div>`,
           )
           .join("")}
       </div>`
    : "";

  return card(
    `<div style="text-align:center;">
       <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#94a3b8;">${esc(companyName)}</p>
       ${address ? `<p style="margin:0 0 8px;font-size:11px;color:#64748b;white-space:pre-line;">${esc(address)}</p>` : ""}
       ${socials}
       <p style="margin:0;font-size:11px;color:#64748b;text-decoration:underline;">${esc(unsubscribeText)}</p>
     </div>`,
    "#0f172a",
    "#1e293b",
  );
}

function compileOrderSummary(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Siparis Ozeti";
  const orderNumber = asText(resolveBlockPropValue(block, "orderNumber", data));
  const orderDate = asText(resolveBlockPropValue(block, "orderDate", data));
  const customerName = asText(resolveBlockPropValue(block, "customerName", data));
  const status = asText(resolveBlockPropValue(block, "status", data)) || "neutral";
  const [sbg, scolor] = statusColors(status);

  return card(
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
       <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
       ${pill(status, sbg, scolor)}
     </div>
     ${orderNumber ? infoRow("Siparis No", orderNumber) : ""}
     ${orderDate ? infoRow("Tarih", orderDate) : ""}
     ${customerName ? infoRow("Müşteri", customerName) : ""}`,
  );
}

function compilePaymentInfo(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Ödeme Bilgisi";
  const paymentMethod = asText(resolveBlockPropValue(block, "paymentMethod", data));
  const amount = asText(resolveBlockPropValue(block, "amount", data));
  const transactionId = asText(resolveBlockPropValue(block, "transactionId", data));
  const status = asText(resolveBlockPropValue(block, "status", data)) || "neutral";
  const [sbg, scolor] = statusColors(status);

  return card(
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
       <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
       ${pill(status, sbg, scolor)}
     </div>
     ${paymentMethod ? infoRow("Ödeme yöntemi", paymentMethod) : ""}
     ${amount ? `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
       <span style="font-size:13px;color:#64748b;">Tutar</span>
       <span style="font-size:18px;font-weight:700;color:#0f172a;">${esc(amount)}</span>
     </div>` : ""}
     ${transactionId ? infoRow("Islem No", transactionId) : ""}`,
  );
}

function compileSupportSection(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Müşteri Hizmetleri";
  const body = asText(resolveBlockPropValue(block, "body", data));
  const phone = asText(resolveBlockPropValue(block, "phone", data));
  const email = asText(resolveBlockPropValue(block, "email", data));
  const workingHours = asText(resolveBlockPropValue(block, "workingHours", data));

  return card(
    `<p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
     ${body ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569;">${esc(body)}</p>` : ""}
     ${phone ? `<div style="margin-bottom:6px;font-size:13px;color:#475569;">&#x260E; ${esc(phone)}</div>` : ""}
     ${email ? `<div style="margin-bottom:6px;font-size:13px;color:#475569;">&#x2709; ${esc(email)}</div>` : ""}
     ${workingHours ? `<div style="margin-top:6px;font-size:12px;color:#94a3b8;">${esc(workingHours)}</div>` : ""}`,
    "#f0fdf4",
    "#bbf7d0",
  );
}

function compileInvoiceSummary(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Fatura Bilgileri";
  const invoiceNumber = asText(resolveBlockPropValue(block, "invoiceNumber", data));
  const invoiceDate = asText(resolveBlockPropValue(block, "invoiceDate", data));
  const dueDate = asText(resolveBlockPropValue(block, "dueDate", data));
  const totalAmount = asText(resolveBlockPropValue(block, "totalAmount", data));
  const status = asText(resolveBlockPropValue(block, "status", data)) || "neutral";
  const [sbg, scolor] = statusColors(status);

  return card(
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
       <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
       ${pill(status, sbg, scolor)}
     </div>
     ${invoiceNumber ? infoRow("Fatura No", invoiceNumber) : ""}
     ${invoiceDate ? infoRow("Fatura Tarihi", invoiceDate) : ""}
     ${dueDate ? infoRow("Vade Tarihi", dueDate) : ""}
     ${totalAmount ? `<div style="border-top:1px solid #e2e8f0;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
       <span style="font-size:14px;font-weight:700;color:#0f172a;">Toplam Tutar</span>
       <span style="font-size:22px;font-weight:700;color:#0f172a;">${esc(totalAmount)}</span>
     </div>` : ""}`,
  );
}

function compileInvoiceNotice(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Bilgilendirme";
  const body = asText(resolveBlockPropValue(block, "body", data));
  const tone = asText(resolveBlockPropValue(block, "tone", data)) || "neutral";

  const toneMap: Record<string, [bg: string, border: string, headingColor: string]> = {
    good: ["#f0fdf4", "#bbf7d0", "#166534"],
    alert: ["#fff1f2", "#fecdd3", "#991b1b"],
    neutral: ["#fffbeb", "#fde68a", "#92400e"],
  };
  const [bg, border, headingColor] = toneMap[tone] ?? toneMap.neutral;

  return `<div style="background:${bg};border:1px solid ${border};border-radius:16px;padding:16px 20px;margin-bottom:16px;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${headingColor};">${esc(headline)}</p>
    ${body ? `<p style="margin:0;font-size:13px;line-height:1.8;color:#475569;">${esc(body)}</p>` : ""}
  </div>`;
}

function compileShipmentSummary(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Kargo Ozeti";
  const shipmentCode = asText(resolveBlockPropValue(block, "shipmentCode", data));
  const carrier = asText(resolveBlockPropValue(block, "carrier", data));
  const origin = asText(resolveBlockPropValue(block, "origin", data));
  const destination = asText(resolveBlockPropValue(block, "destination", data));
  const status = asText(resolveBlockPropValue(block, "status", data)) || "neutral";
  const [sbg, scolor] = statusColors(status);

  return card(
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
       <p style="margin:0;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
       ${pill(status, sbg, scolor)}
     </div>
     ${shipmentCode ? infoRow("Kargo Kodu", shipmentCode) : ""}
     ${carrier ? infoRow("Kargo Firmasi", carrier) : ""}
     ${(origin || destination) ? `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;">
       ${origin ? `<span style="font-size:13px;color:#0f172a;">${esc(origin)}</span>` : ""}
       ${origin && destination ? `<span style="font-size:18px;color:#94a3b8;">&#x2192;</span>` : ""}
       ${destination ? `<span style="font-size:13px;font-weight:600;color:#0f172a;">${esc(destination)}</span>` : ""}
     </div>` : ""}`,
  );
}

function compileTrackingTimeline(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "Teslimat Durumu";
  const step1 = asText(resolveBlockPropValue(block, "step1", data)) || "Siparis Alindi";
  const step1Date = asText(resolveBlockPropValue(block, "step1Date", data));
  const step2 = asText(resolveBlockPropValue(block, "step2", data)) || "Kargoya Verildi";
  const step2Date = asText(resolveBlockPropValue(block, "step2Date", data));
  const step3 = asText(resolveBlockPropValue(block, "step3", data)) || "Teslim Edildi";
  const step3Date = asText(resolveBlockPropValue(block, "step3Date", data));
  const currentStep = asNumber(resolveBlockPropValue(block, "currentStep", data), 1);

  const steps = [
    { label: step1, date: step1Date, index: 1 },
    { label: step2, date: step2Date, index: 2 },
    { label: step3, date: step3Date, index: 3 },
  ];

  const stepsHtml = steps
    .map((step, i) => {
      const done = step.index <= currentStep;
      const active = step.index === currentStep;
      const isLast = i === steps.length - 1;
      const dotColor = done ? "#22c55e" : "#e2e8f0";
      const lineColor = done ? "#22c55e" : "#e2e8f0";

      return `<div style="display:flex;gap:14px;${isLast ? "" : ""}">
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
          <div style="width:16px;height:16px;border-radius:999px;background:${dotColor};${active ? "box-shadow:0 0 0 3px rgba(34,197,94,0.2);" : ""}flex-shrink:0;"></div>
          ${!isLast ? `<div style="width:2px;min-height:28px;background:${lineColor};margin:4px 0;flex:1;"></div>` : ""}
        </div>
        <div style="padding-bottom:${isLast ? "0" : "16px"};">
          <p style="margin:0 0 2px;font-size:14px;font-weight:${active ? "700" : "400"};color:${done ? "#0f172a" : "#94a3b8"};">${esc(step.label)}</p>
          ${step.date ? `<p style="margin:0;font-size:12px;color:#94a3b8;">${esc(step.date)}</p>` : ""}
        </div>
      </div>`;
    })
    .join("");

  return card(
    `<p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>${stepsHtml}`,
  );
}

function compileReturnReason(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "İade Nedeni";
  const returnCode = asText(resolveBlockPropValue(block, "returnCode", data));
  const reason = asText(resolveBlockPropValue(block, "reason", data));
  const details = asText(resolveBlockPropValue(block, "details", data));

  return card(
    `<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
     ${returnCode ? `<div style="display:inline-block;background:#f1f5f9;border-radius:8px;padding:4px 10px;font-size:12px;font-family:monospace;color:#475569;margin-bottom:12px;">${esc(returnCode)}</div>` : ""}
     ${reason ? `<p style="margin:0 0 8px;font-size:14px;font-weight:500;color:#0f172a;">${esc(reason)}</p>` : ""}
     ${details ? `<p style="margin:0;font-size:13px;line-height:1.8;color:#475569;">${esc(details)}</p>` : ""}`,
    "#fff1f2",
    "#fecdd3",
  );
}

function compileReturnInstructions(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data)) || "İade Talimatları";
  const step1 = asText(resolveBlockPropValue(block, "step1", data));
  const step2 = asText(resolveBlockPropValue(block, "step2", data));
  const step3 = asText(resolveBlockPropValue(block, "step3", data));
  const note = asText(resolveBlockPropValue(block, "note", data));

  const steps = [step1, step2, step3].filter(Boolean);
  const stepsHtml = steps
    .map(
      (s, i) => `<div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;">
        <div style="width:24px;height:24px;border-radius:999px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:700;color:#475569;">${i + 1}</div>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#475569;padding-top:3px;">${esc(s)}</p>
      </div>`,
    )
    .join("");

  return card(
    `<p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#0f172a;">${esc(headline)}</p>
     ${stepsHtml}
     ${note ? `<div style="margin-top:12px;padding:10px 14px;background:#f8fafc;border-radius:10px;font-size:12px;color:#64748b;">${esc(note)}</div>` : ""}`,
  );
}

function compileCustomHtml(block: EditorBlock, data: unknown): string {
  const html = asText(resolveBlockPropValue(block, "html", data));
  // Evaluate Scriban template variables against source data
  const evaluated = evaluateScriban(html, data);
  return `<div style="margin-bottom:16px;">${evaluated}</div>`;
}

function compileDataTable(block: EditorBlock, data: unknown): string {
  const headline = asText(resolveBlockPropValue(block, "headline", data));
  const rows: Array<{ label: string; value: string }> = [];

  for (let n = 1; n <= 6; n++) {
    const label = asText(resolveBlockPropValue(block, "row" + n + "Label", data));
    const rawValue = asText(resolveBlockPropValue(block, "row" + n + "Value", data));
    // Evaluate any residual Scriban expressions in props (e.g. legacy blocks without bindings)
    const value = rawValue.includes("{{") ? evaluateScriban(rawValue, data) : rawValue;
    if (label || value) rows.push({ label, value });
  }

  if (rows.length === 0) return "";

  const rowParts: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const bg = i % 2 === 0 ? "#f8fafc" : "#ffffff";
    const valHtml = r.value ? esc(r.value) : '<span style="color:#94a3b8">\u2014</span>';
    rowParts.push(
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:' + bg + ';border-bottom:1px solid #e2e8f0;">' +
      '<span style="font-size:13px;color:#64748b;">' + esc(r.label) + '</span>' +
      '<span style="font-size:13px;font-weight:500;color:#0f172a;text-align:right;max-width:60%;">' + valHtml + '</span>' +
      '</div>',
    );
  }

  const headlineHtml = headline
    ? '<p style="margin:0 0 12px;font-size:11px;color:#94a3b8;letter-spacing:0.18em;text-transform:uppercase;">' + esc(headline) + "</p>"
    : "";

  return card(headlineHtml + '<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">' + rowParts.join("") + "</div>");
}

// ---------------------------------------------------------------------------
// Block dispatcher
// ---------------------------------------------------------------------------

function compileBlock(block: EditorBlock, data: unknown): string {
  const definition = getBlockDefinition(block.type);
  if (definition?.compile) {
    return definition.compile({
      block,
      sourceData: data,
    });
  }

  switch (block.type) {
    case "spacer":
      return compileSpacer(block, data);
    case "divider":
      return compileDivider(block, data);
    case "hero":
      return compileHero(block, data);
    case "richText":
      return compileRichText(block, data);
    case "cta":
      return compileCta(block, data);
    case "image":
      return compileImage(block, data);
    case "note":
      return compileNote(block, data);
    case "address":
      return compileAddress(block, data);
    case "customerInfo":
      return compileCustomerInfo(block, data);
    case "status":
      return compileStatus(block, data);
    case "lineItems":
      return compileLineItems(block, data);
    case "totals":
      return compileTotals(block, data);
    case "summary":
      return compileSummary(block, data);
    case "shippingInfo":
      return compileShippingInfo(block, data);
    case "returnInfo":
      return compileReturnInfo(block, data);
    case "orderSummary":
      return compileOrderSummary(block, data);
    case "paymentInfo":
      return compilePaymentInfo(block, data);
    case "supportSection":
      return compileSupportSection(block, data);
    case "invoiceSummary":
      return compileInvoiceSummary(block, data);
    case "invoiceNotice":
      return compileInvoiceNotice(block, data);
    case "shipmentSummary":
      return compileShipmentSummary(block, data);
    case "trackingTimeline":
      return compileTrackingTimeline(block, data);
    case "returnReason":
      return compileReturnReason(block, data);
    case "returnInstructions":
      return compileReturnInstructions(block, data);
    case "footer":
      return compileFooter(block, data);
    case "customHtml":
      return compileCustomHtml(block, data);
    case "dataTable":
      return compileDataTable(block, data);
    default:
      return card(`<p style="font-size:13px;color:#94a3b8;">Bilinmeyen blok tipi: ${esc((block as EditorBlock).type)}</p>`);
  }
}

// ---------------------------------------------------------------------------
// Document wrapper
// ---------------------------------------------------------------------------

function getMaxWidth(mode: PreviewMode): string {
  if (mode === "mobile") return "390px";
  if (mode === "print") return "210mm";
  return "600px";
}

function getBodyPadding(mode: PreviewMode): string {
  if (mode === "print") return "20mm";
  if (mode === "mobile") return "8px";
  return "20px 16px";
}

function getPrintStyles(): string {
  return `
    @media print {
      body { background: #ffffff !important; padding: 0 !important; }
      .email-container { background: #ffffff !important; box-shadow: none !important; border-radius: 0 !important; }
    }
    @page { margin: 20mm; }`;
}

export function compileToHtml(
  template: TemplateRecord,
  sourceData: unknown,
  mode: PreviewMode,
): string {
  const designSystem = ensureTemplateDesignSystem(template);
  const blocksHtml = template.blocks.map((block) => compileBlock(block, sourceData)).join("\n");
  const maxWidth =
    typeof designSystem.layout.contentWidth === "number"
      ? `${designSystem.layout.contentWidth}px`
      : getMaxWidth(mode);
  const bodyPadding = getBodyPadding(mode);
  const isPrint = mode === "print";

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${esc(template.name)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: ${bodyPadding};
      background: ${isPrint ? "#ffffff" : "#f1f5f9"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    ${isPrint ? getPrintStyles() : ""}
    img { max-width: 100%; height: auto; }
    a { color: inherit; }
  </style>
</head>
<body>
  <div class="email-container" style="max-width:${maxWidth};margin:0 auto;">
    ${blocksHtml}
  </div>
</body>
</html>`;

  return applyDesignSystemToDocument(html, designSystem);
}

// ---------------------------------------------------------------------------
// Original-HTML preview compiler
//
// Instead of regenerating HTML from typed blocks, this joins all block HTMLs
// (which preserve the original email template structure) and evaluates
// Scriban against real data. The result is pixel-identical to the original
// email template with data injected.
// ---------------------------------------------------------------------------

export function compileOriginalHtml(
  template: TemplateRecord,
  sourceData: unknown,
): string {
  const designSystem = ensureTemplateDesignSystem(template);
  const rowFlowEnvelope = template.htmlEnvelope?.kind === "row-sections";

  const rowFlowHtml = template.blocks
    .map((block) => {
      if (block.type === "customHtml") {
        const rawHtml = asText(block.props["html"] ?? "");
        const sectionKind = asText(block.props["htmlSectionKind"] ?? "");

        if (!rowFlowEnvelope) {
          return rawHtml;
        }

        if (sectionKind === "tbody-row" || isTableRowSection(rawHtml)) {
          return rawHtml;
        }

        return wrapFragmentInEmailRow(rawHtml);
      }

      const compiled = compileBlock(block, sourceData);
      return rowFlowEnvelope ? wrapFragmentInEmailRow(compiled) : compiled;
    })
    .filter(Boolean)
    .join(rowFlowEnvelope ? "" : "\n");

  const reconstructedRowFlowHtml =
    rowFlowEnvelope && template.htmlEnvelope
      ? `${template.htmlEnvelope.envelopeOpen}${rowFlowHtml}${template.htmlEnvelope.envelopeClose}`
      : rowFlowHtml;

  const evaluatedRowFlowHtml = evaluateScriban(reconstructedRowFlowHtml, sourceData);
  const rowFlowHasHtmlTag = /<html[\s>]/i.test(evaluatedRowFlowHtml);
  const rowFlowHasBodyTag = /<body[\s>]/i.test(evaluatedRowFlowHtml);

  if (rowFlowHasHtmlTag && rowFlowHasBodyTag) {
    return applyDesignSystemToDocument(evaluatedRowFlowHtml, designSystem);
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${esc(template.name)}</title>
</head>
<body style="margin:0;padding:0;">
${evaluatedRowFlowHtml}
</body>
</html>`;

  return applyDesignSystemToDocument(html, designSystem);
/*

  // 1. Collect all block HTML in order (preserves original structure)
  const allBlockHtml = template.blocks
    .map((b) => {
      if (b.type === "customHtml") {
        return asText(b.props["html"] ?? "");
      }
      // Legacy typed blocks: compile them normally
      return compileBlock(b, sourceData);
    })
    .join("\n");

  // 2. Evaluate Scriban expressions against real data
  const evaluated = evaluateScriban(allBlockHtml, sourceData);

  // 3. Check if the HTML already has a complete document structure
  const hasHtmlTag = /<html[\s>]/i.test(evaluated);
  const hasBodyTag = /<body[\s>]/i.test(evaluated);

  if (hasHtmlTag && hasBodyTag) {
    // The template is already a complete HTML document — return as-is
    return evaluated;
  }

  // 4. Wrap in a minimal email-safe envelope
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${esc(template.name)}</title>
</head>
<body style="margin:0;padding:0;">
${evaluated}
</body>
</html>`;
*/
}
