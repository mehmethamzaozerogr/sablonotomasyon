import {
  Calendar,
  Hash,
  ImageIcon,
  Mail,
  Phone,
  Truck,
  User,
} from "lucide-react";

import { getBlockDefinition } from "@/lib/blocks/registry";
import { CustomHtmlCanvas } from "@/components/editor/custom-html-canvas";
import { IsolatedHtmlFrame } from "@/components/editor/isolated-html-frame";
import {
  resolveBlockPropValue,
  resolveRepeaterItems,
} from "@/lib/bindings/runtime";
import type { HtmlVarOccurrence } from "@/lib/bindings/html-vars";
import type {
  CanvasOccurrencePickerOverlay,
  CanvasToolbarOverlay,
} from "@/lib/editor/canvas-overlay";
import type { HtmlTextRegion } from "@/lib/editor/custom-html-text";
import { evaluateScriban } from "@/lib/preview/scriban-eval";
import { sanitizeCustomHtmlForApp } from "@/lib/security/sanitize-custom-html";
import type { EditorMode } from "@/stores/editor-store";
import { cn } from "@/lib/utils";
import type { EditorBlock } from "@/types/template";

type TemplateBlockRendererProps = {
  block: EditorBlock;
  sourceData: unknown;
  variant?: "canvas" | "preview";
  editorMode?: EditorMode;
  activeHtmlOccurrenceId?: string | null;
  activeTextRegionId?: string | null;
  onSelectHtmlOccurrence?: (occurrence: HtmlVarOccurrence) => void;
  onReplaceHtmlOccurrence?: (occurrenceId: string, newPath: string) => void;
  onSelectTextRegion?: (region: HtmlTextRegion) => void;
  onEditTextRegion?: (region: HtmlTextRegion) => void;
  onInsertVariable?: (path: string) => void;
  onStyleTextRegion?: (region: HtmlTextRegion) => void;
  onToolbarOverlayChange?: (overlay: CanvasToolbarOverlay | null) => void;
  onOccurrencePickerOverlayChange?: (
    overlay: CanvasOccurrencePickerOverlay | null,
  ) => void;
};

function asText(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function stripLeadingHtmlTrivia(html: string) {
  let next = html.trimStart();

  while (next.startsWith("<!--")) {
    const commentEnd = next.indexOf("-->");
    if (commentEnd === -1) break;
    next = next.slice(commentEnd + 3).trimStart();
  }

  return next;
}

function isTableRowSection(html: string) {
  return /^<tr\b/i.test(stripLeadingHtmlTrivia(html));
}

type StatusTone = "good" | "neutral" | "alert";

function statusClass(status: string): string {
  const map: Record<StatusTone, string> = {
    good: "bg-emerald-100 text-emerald-700",
    neutral: "bg-amber-100 text-amber-700",
    alert: "bg-rose-100 text-rose-700",
  };
  return map[status as StatusTone] ?? "bg-slate-100 text-slate-700";
}

export function TemplateBlockRenderer({
  block,
  sourceData,
  variant = "canvas",
  editorMode = "select",
  activeHtmlOccurrenceId,
  activeTextRegionId,
  onSelectHtmlOccurrence,
  onReplaceHtmlOccurrence,
  onSelectTextRegion,
  onEditTextRegion,
  onInsertVariable,
  onStyleTextRegion,
  onToolbarOverlayChange,
  onOccurrencePickerOverlayChange,
}: TemplateBlockRendererProps) {
  const preview = variant === "preview";
  const definition = getBlockDefinition(block.type);

  const headline = asText(resolveBlockPropValue(block, "headline", sourceData));
  const body = asText(resolveBlockPropValue(block, "body", sourceData));
  const label = asText(resolveBlockPropValue(block, "label", sourceData));
  const href = asText(resolveBlockPropValue(block, "href", sourceData));
  const status = asText(resolveBlockPropValue(block, "status", sourceData));
  const muted = asBoolean(resolveBlockPropValue(block, "muted", sourceData));
  const fullWidth = asBoolean(
    resolveBlockPropValue(block, "fullWidth", sourceData),
  );
  const align =
    asText(resolveBlockPropValue(block, "align", sourceData)) || "left";
  const tone =
    asText(resolveBlockPropValue(block, "tone", sourceData)) || "warm";
  const spacerHeight = asNumber(
    resolveBlockPropValue(block, "height", sourceData),
    32,
  );

  const shell =
    "rounded-2xl border border-slate-200/80 bg-white px-6 py-5 text-slate-950 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.06)]";

  if (definition?.render) {
    return definition.render({
      block,
      sourceData,
      variant,
      editorMode,
      activeHtmlOccurrenceId,
      activeTextRegionId,
      onSelectHtmlOccurrence,
      onReplaceHtmlOccurrence,
      onSelectTextRegion,
      onEditTextRegion,
      onInsertVariable,
      onStyleTextRegion,
      onToolbarOverlayChange,
      onOccurrencePickerOverlayChange,
    });
  }

  if (block.type === "spacer") {
    return (
      <div
        className={cn(shell, "flex items-center justify-center")}
        style={{ minHeight: spacerHeight }}
      >
        <p
          className={cn(
            "text-xs uppercase tracking-[0.18em]",
            "text-slate-400",
          )}
        >
          Bosluk {spacerHeight}px
        </p>
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <div className={shell}>
        <div className="flex items-center gap-3">
          <div className={cn("h-px flex-1", "bg-slate-200")} />
          {label ? (
            <span
              className={cn(
                "text-[11px] uppercase tracking-[0.18em]",
                "text-slate-400",
              )}
            >
              {label}
            </span>
          ) : null}
          <div className={cn("h-px flex-1", "bg-slate-200")} />
        </div>
      </div>
    );
  }

  if (block.type === "cta") {
    return (
      <div className={shell}>
        <button
          className={cn(
            "rounded-2xl px-5 py-3 text-sm font-semibold transition",
            fullWidth ? "w-full" : "w-auto",
            "bg-slate-950 text-white shadow-lg",
          )}
          type="button"
        >
          {label || "Detayi ac"}
        </button>
        {href ? (
          <p className={cn("mt-3 truncate text-xs", "text-slate-400")}>
            {href}
          </p>
        ) : null}
      </div>
    );
  }

  if (block.type === "image") {
    const src = asText(resolveBlockPropValue(block, "src", sourceData));
    const alt =
      asText(resolveBlockPropValue(block, "alt", sourceData)) || "Görsel";
    const width = asNumber(
      resolveBlockPropValue(block, "width", sourceData),
      600,
    );

    return (
      <div className={shell}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            style={{ maxWidth: width }}
            className="w-full rounded-2xl object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex h-32 items-center justify-center rounded-2xl",
              "bg-slate-100",
            )}
          >
            <div className="text-center">
              <ImageIcon className={cn("mx-auto h-8 w-8", "text-slate-300")} />
              <p className={cn("mt-2 text-xs", "text-slate-400")}>
                Görsel bağlantısı seçilmedi
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (block.type === "lineItems") {
    const items = resolveRepeaterItems(block, sourceData);
    const itemTitle = (item: unknown) =>
      asText(resolveBlockPropValue(block, "itemTitle", sourceData, item));
    const itemSubtitle = (item: unknown) =>
      asText(resolveBlockPropValue(block, "itemSubtitle", sourceData, item));
    const itemSku = (item: unknown) =>
      asText(resolveBlockPropValue(block, "itemSku", sourceData, item));
    const itemQuantity = (item: unknown) =>
      asText(resolveBlockPropValue(block, "itemQuantity", sourceData, item));
    const itemPrice = (item: unknown) =>
      asText(resolveBlockPropValue(block, "itemPrice", sourceData, item));
    const itemBadge = (item: unknown) =>
      asText(resolveBlockPropValue(block, "itemBadge", sourceData, item));
    const itemImage = (item: unknown) =>
      asText(resolveBlockPropValue(block, "itemImage", sourceData, item));
    const emptyState = asText(
      resolveBlockPropValue(block, "emptyState", sourceData),
    );
    const showImages = asBoolean(
      resolveBlockPropValue(block, "showImages", sourceData),
    );

    return (
      <div className={shell}>
        <p className={cn("text-sm font-semibold", "text-slate-950")}>
          {headline || "Urun Listesi"}
        </p>
        <div className="mt-4 space-y-3">
          {items.length ? (
            items.map((item, index) => (
              <div
                key={`item-${index}`}
                className={cn(
                  "flex items-start gap-3 rounded-2xl px-4 py-3",
                  "bg-slate-50",
                )}
              >
                {showImages && itemImage(item) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={itemImage(item)}
                    alt={itemTitle(item) || "Urun"}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-semibold",
                          "text-slate-900",
                        )}
                      >
                        {itemTitle(item) || `Kayit ${index + 1}`}
                      </p>
                      {itemSubtitle(item) ? (
                        <p
                          className={cn(
                            "mt-1 text-sm leading-6",
                            "text-slate-500",
                          )}
                        >
                          {itemSubtitle(item)}
                        </p>
                      ) : null}
                    </div>
                    {itemPrice(item) ? (
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold",
                          "text-slate-900",
                        )}
                      >
                        {itemPrice(item)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {itemSku(item) ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px]",
                          "bg-white text-slate-500",
                        )}
                      >
                        {itemSku(item)}
                      </span>
                    ) : null}
                    {itemQuantity(item) ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px]",
                          "bg-white text-slate-500",
                        )}
                      >
                        {itemQuantity(item)}
                      </span>
                    ) : null}
                    {itemBadge(item) ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]",
                          "bg-cyan-100 text-cyan-700",
                        )}
                      >
                        {itemBadge(item)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className={cn("text-sm", "text-slate-400")}>
              {emptyState ||
                block.repeater?.emptyFallback ||
                "Gosterilecek kayit bulunamadi."}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (block.type === "totals") {
    return (
      <div className={cn(shell, "bg-slate-950 text-white")}>
        <p
          className={cn(
            "text-xs uppercase tracking-[0.18em]",
            "text-slate-400",
          )}
        >
          Fatura ozeti
        </p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className={cn("text-sm font-medium", "text-slate-300")}>
              {headline || "Toplam"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {body || "-"}
            </p>
          </div>
          <div
            className={cn(
              "rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]",
              "bg-white/10 text-white",
            )}
          >
            Sabit
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "summary") {
    const subtotal =
      asText(resolveBlockPropValue(block, "subtotal", sourceData)) || "-";
    const tax = asText(resolveBlockPropValue(block, "tax", sourceData)) || "-";
    const shipping =
      asText(resolveBlockPropValue(block, "shipping", sourceData)) || "-";
    const total =
      asText(resolveBlockPropValue(block, "total", sourceData)) || "-";
    const rows: Array<[string, string]> = [
      ["Ara toplam", subtotal],
      ["Vergi", tax],
      ["Kargo", shipping],
    ];

    return (
      <div className={shell}>
        <p className={cn("text-sm font-semibold", "text-slate-950")}>
          {headline || "Toplamlar"}
        </p>
        <div className="mt-4 space-y-2">
          {rows.map(([rowLabel, value]) => (
            <div key={rowLabel} className="flex items-center justify-between">
              <span className={cn("text-sm", "text-slate-500")}>
                {rowLabel}
              </span>
              <span className={cn("text-sm", "text-slate-700")}>{value}</span>
            </div>
          ))}
          <div
            className={cn(
              "mt-3 flex items-center justify-between border-t pt-3",
              "border-slate-200",
            )}
          >
            <span className={cn("text-sm font-semibold", "text-slate-950")}>
              Genel toplam
            </span>
            <span className={cn("text-xl font-bold", "text-slate-950")}>
              {total}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "status") {
    return (
      <div className={shell}>
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
            statusClass(status),
          )}
        >
          {status || "durum"}
        </span>
        <p className={cn("mt-4 text-lg font-semibold", "text-slate-950")}>
          {headline}
        </p>
        <p className={cn("mt-2 text-sm leading-6", "text-slate-600")}>{body}</p>
      </div>
    );
  }

  if (block.type === "address") {
    return (
      <div className={shell}>
        <p
          className={cn(
            "text-xs uppercase tracking-[0.18em]",
            "text-slate-400",
          )}
        >
          {headline || "Adres"}
        </p>
        <p
          className={cn(
            "mt-4 whitespace-pre-line text-sm leading-7",
            "text-slate-700",
          )}
        >
          {body || "Adres bilgisi bulunamadi."}
        </p>
      </div>
    );
  }

  if (block.type === "customerInfo") {
    const name = asText(resolveBlockPropValue(block, "name", sourceData));
    const email = asText(resolveBlockPropValue(block, "email", sourceData));
    const phone = asText(resolveBlockPropValue(block, "phone", sourceData));

    return (
      <div className={shell}>
        <p
          className={cn(
            "text-xs uppercase tracking-[0.18em]",
            "text-slate-400",
          )}
        >
          {headline || "Müşteri"}
        </p>
        <div className="mt-4 space-y-2">
          {name ? (
            <div className="flex items-center gap-3">
              <User className={cn("h-4 w-4 shrink-0", "text-slate-400")} />
              <span className={cn("text-sm", "text-slate-700")}>{name}</span>
            </div>
          ) : null}
          {email ? (
            <div className="flex items-center gap-3">
              <Mail className={cn("h-4 w-4 shrink-0", "text-slate-400")} />
              <span className={cn("text-sm", "text-slate-700")}>{email}</span>
            </div>
          ) : null}
          {phone ? (
            <div className="flex items-center gap-3">
              <Phone className={cn("h-4 w-4 shrink-0", "text-slate-400")} />
              <span className={cn("text-sm", "text-slate-700")}>{phone}</span>
            </div>
          ) : null}
          {!name && !email && !phone ? (
            <p className={cn("text-sm", "text-slate-400")}>
              Müşteri verisi bulunamadi.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  if (block.type === "note") {
    return (
      <div className={cn(shell, muted ? "bg-slate-50" : "")}>
        <p
          className={cn(
            "text-sm leading-6",
            muted ? "text-slate-500" : "text-slate-700",
          )}
        >
          {body}
        </p>
      </div>
    );
  }

  if (block.type === "shippingInfo") {
    const carrier = asText(resolveBlockPropValue(block, "carrier", sourceData));
    const tracking = asText(
      resolveBlockPropValue(block, "trackingNumber", sourceData),
    );
    const eta = asText(
      resolveBlockPropValue(block, "estimatedDelivery", sourceData),
    );
    const shippingStatus =
      asText(resolveBlockPropValue(block, "status", sourceData)) || "neutral";

    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-sm font-semibold", "text-slate-950")}>
            {headline || "Teslimat Bilgileri"}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
              statusClass(shippingStatus),
            )}
          >
            {shippingStatus}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {carrier ? (
            <div className="flex items-center gap-3">
              <Truck className={cn("h-4 w-4 shrink-0", "text-slate-400")} />
              <span className={cn("text-sm", "text-slate-700")}>{carrier}</span>
            </div>
          ) : null}
          {tracking ? (
            <div className="flex items-center gap-3">
              <Hash className={cn("h-4 w-4 shrink-0", "text-slate-400")} />
              <span className={cn("truncate text-sm", "text-slate-700")}>
                {tracking}
              </span>
            </div>
          ) : null}
          {eta ? (
            <div className="flex items-center gap-3">
              <Calendar className={cn("h-4 w-4 shrink-0", "text-slate-400")} />
              <span className={cn("text-sm", "text-slate-700")}>{eta}</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (block.type === "returnInfo") {
    const rmaNumber = asText(
      resolveBlockPropValue(block, "rmaNumber", sourceData),
    );
    const returnStatus =
      asText(resolveBlockPropValue(block, "status", sourceData)) || "good";

    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-sm font-semibold", "text-slate-950")}>
            {headline || "İade Özeti"}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
              statusClass(returnStatus),
            )}
          >
            {returnStatus}
          </span>
        </div>
        {rmaNumber ? (
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "text-xs uppercase tracking-[0.18em]",
                "text-slate-400",
              )}
            >
              İade
            </span>
            <span
              className={cn(
                "text-sm font-mono font-semibold",
                "text-slate-800",
              )}
            >
              {rmaNumber}
            </span>
          </div>
        ) : null}
        {body ? (
          <p className={cn("mt-3 text-sm leading-6", "text-slate-600")}>
            {body}
          </p>
        ) : null}
      </div>
    );
  }

  if (block.type === "orderSummary") {
    const orderNumber = asText(
      resolveBlockPropValue(block, "orderNumber", sourceData),
    );
    const orderDate = asText(
      resolveBlockPropValue(block, "orderDate", sourceData),
    );
    const customerName = asText(
      resolveBlockPropValue(block, "customerName", sourceData),
    );

    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-sm font-semibold", "text-slate-950")}>
            {headline || "Siparis Ozeti"}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
              statusClass(status),
            )}
          >
            {status || "durum"}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {orderNumber ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>
                Siparis No
              </span>
              <span
                className={cn(
                  "font-mono text-xs font-semibold",
                  "text-slate-900",
                )}
              >
                {orderNumber}
              </span>
            </div>
          ) : null}
          {orderDate ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>Tarih</span>
              <span className={cn("text-xs", "text-slate-700")}>
                {orderDate}
              </span>
            </div>
          ) : null}
          {customerName ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>Müşteri</span>
              <span className={cn("text-xs", "text-slate-700")}>
                {customerName}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (block.type === "paymentInfo") {
    const paymentMethod = asText(
      resolveBlockPropValue(block, "paymentMethod", sourceData),
    );
    const amount = asText(resolveBlockPropValue(block, "amount", sourceData));
    const transactionId = asText(
      resolveBlockPropValue(block, "transactionId", sourceData),
    );

    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-sm font-semibold", "text-slate-950")}>
            {headline || "Ödeme Bilgisi"}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
              statusClass(status),
            )}
          >
            {status || "durum"}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {paymentMethod ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>
                Ödeme yöntemi
              </span>
              <span className={cn("text-xs", "text-slate-700")}>
                {paymentMethod}
              </span>
            </div>
          ) : null}
          {amount ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>Tutar</span>
              <span className={cn("text-sm font-bold", "text-slate-900")}>
                {amount}
              </span>
            </div>
          ) : null}
          {transactionId ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>Islem No</span>
              <span className={cn("font-mono text-xs", "text-slate-600")}>
                {transactionId}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (block.type === "supportSection") {
    const phone = asText(resolveBlockPropValue(block, "phone", sourceData));
    const email = asText(resolveBlockPropValue(block, "email", sourceData));
    const workingHours = asText(
      resolveBlockPropValue(block, "workingHours", sourceData),
    );

    return (
      <div className={cn(shell, "bg-emerald-50")}>
        <p className={cn("text-sm font-semibold", "text-slate-950")}>
          {headline || "Müşteri Hizmetleri"}
        </p>
        {body ? (
          <p className={cn("mt-2 text-sm leading-6", "text-slate-600")}>
            {body}
          </p>
        ) : null}
        <div className="mt-4 space-y-2">
          {phone ? (
            <div className="flex items-center gap-3">
              <Phone className={cn("h-4 w-4 shrink-0", "text-slate-400")} />
              <span className={cn("text-sm", "text-slate-700")}>{phone}</span>
            </div>
          ) : null}
          {email ? (
            <div className="flex items-center gap-3">
              <Mail className={cn("h-4 w-4 shrink-0", "text-slate-400")} />
              <span className={cn("text-sm", "text-slate-700")}>{email}</span>
            </div>
          ) : null}
          {workingHours ? (
            <p className={cn("text-xs", "text-slate-400")}>{workingHours}</p>
          ) : null}
        </div>
      </div>
    );
  }

  if (block.type === "invoiceSummary") {
    const invoiceNumber = asText(
      resolveBlockPropValue(block, "invoiceNumber", sourceData),
    );
    const invoiceDate = asText(
      resolveBlockPropValue(block, "invoiceDate", sourceData),
    );
    const dueDate = asText(resolveBlockPropValue(block, "dueDate", sourceData));
    const totalAmount = asText(
      resolveBlockPropValue(block, "totalAmount", sourceData),
    );

    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-sm font-semibold", "text-slate-950")}>
            {headline || "Fatura Bilgileri"}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
              statusClass(status),
            )}
          >
            {status || "durum"}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {invoiceNumber ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>Fatura No</span>
              <span
                className={cn(
                  "font-mono text-xs font-semibold",
                  "text-slate-900",
                )}
              >
                {invoiceNumber}
              </span>
            </div>
          ) : null}
          {invoiceDate ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>
                Fatura Tarihi
              </span>
              <span className={cn("text-xs", "text-slate-700")}>
                {invoiceDate}
              </span>
            </div>
          ) : null}
          {dueDate ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>
                Vade Tarihi
              </span>
              <span className={cn("text-xs", "text-slate-700")}>{dueDate}</span>
            </div>
          ) : null}
        </div>
        {totalAmount ? (
          <div
            className={cn(
              "mt-4 flex items-center justify-between border-t pt-4",
              "border-slate-200",
            )}
          >
            <span className={cn("text-sm font-bold", "text-slate-950")}>
              Toplam Tutar
            </span>
            <span className={cn("text-xl font-bold", "text-slate-950")}>
              {totalAmount}
            </span>
          </div>
        ) : null}
      </div>
    );
  }

  if (block.type === "invoiceNotice") {
    const tone =
      asText(resolveBlockPropValue(block, "tone", sourceData)) || "neutral";
    const noticeClass =
      tone === "good"
        ? "border-emerald-200 bg-emerald-50"
        : tone === "alert"
          ? "border-rose-200 bg-rose-50"
          : "border-amber-200 bg-amber-50";
    const headingColor =
      tone === "good"
        ? "text-emerald-700"
        : tone === "alert"
          ? "text-rose-700"
          : "text-amber-700";

    return (
      <div className={cn("rounded-[24px] border px-5 py-4", noticeClass)}>
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.14em]",
            headingColor,
          )}
        >
          {headline || "Bilgilendirme"}
        </p>
        {body ? (
          <p className={cn("mt-2 text-sm leading-6", "text-slate-600")}>
            {body}
          </p>
        ) : null}
      </div>
    );
  }

  if (block.type === "shipmentSummary") {
    const shipmentCode = asText(
      resolveBlockPropValue(block, "shipmentCode", sourceData),
    );
    const carrier = asText(resolveBlockPropValue(block, "carrier", sourceData));
    const origin = asText(resolveBlockPropValue(block, "origin", sourceData));
    const destination = asText(
      resolveBlockPropValue(block, "destination", sourceData),
    );

    return (
      <div className={shell}>
        <div className="flex items-start justify-between gap-3">
          <p className={cn("text-sm font-semibold", "text-slate-950")}>
            {headline || "Kargo Ozeti"}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
              statusClass(status),
            )}
          >
            {status || "durum"}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {shipmentCode ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>
                Kargo Kodu
              </span>
              <span
                className={cn(
                  "font-mono text-xs font-semibold",
                  "text-slate-900",
                )}
              >
                {shipmentCode}
              </span>
            </div>
          ) : null}
          {carrier ? (
            <div className="flex items-center justify-between">
              <span className={cn("text-xs", "text-slate-500")}>
                Kargo Firmasi
              </span>
              <span className={cn("text-xs", "text-slate-700")}>{carrier}</span>
            </div>
          ) : null}
          {origin || destination ? (
            <div className="flex items-center gap-2 pt-1">
              {origin ? (
                <span className={cn("text-xs", "text-slate-600")}>
                  {origin}
                </span>
              ) : null}
              {origin && destination ? (
                <span className={cn("text-base", "text-slate-300")}>â†’</span>
              ) : null}
              {destination ? (
                <span className={cn("text-xs font-semibold", "text-slate-900")}>
                  {destination}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (block.type === "trackingTimeline") {
    const step1 =
      asText(resolveBlockPropValue(block, "step1", sourceData)) ||
      "Siparis Alindi";
    const step1Date = asText(
      resolveBlockPropValue(block, "step1Date", sourceData),
    );
    const step2 =
      asText(resolveBlockPropValue(block, "step2", sourceData)) ||
      "Kargoya Verildi";
    const step2Date = asText(
      resolveBlockPropValue(block, "step2Date", sourceData),
    );
    const step3 =
      asText(resolveBlockPropValue(block, "step3", sourceData)) ||
      "Teslim Edildi";
    const step3Date = asText(
      resolveBlockPropValue(block, "step3Date", sourceData),
    );
    const currentStep = asNumber(
      resolveBlockPropValue(block, "currentStep", sourceData),
      1,
    );

    const steps = [
      { label: step1, date: step1Date, index: 1 },
      { label: step2, date: step2Date, index: 2 },
      { label: step3, date: step3Date, index: 3 },
    ];

    return (
      <div className={shell}>
        <p className={cn("mb-4 text-sm font-semibold", "text-slate-950")}>
          {headline || "Teslimat Durumu"}
        </p>
        <div className="space-y-0">
          {steps.map((step, i) => {
            const done = step.index <= currentStep;
            const active = step.index === currentStep;
            const isLast = i === steps.length - 1;
            return (
              <div key={step.index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-full",
                      done ? "bg-emerald-500" : "bg-slate-200",
                      active && "ring-2 ring-emerald-400/30",
                    )}
                  />
                  {!isLast ? (
                    <div
                      className={cn(
                        "w-0.5 flex-1",
                        done ? "bg-emerald-300" : "bg-slate-200",
                      )}
                      style={{ minHeight: 24 }}
                    />
                  ) : null}
                </div>
                <div className={cn("pb-4", isLast ? "pb-0" : "")}>
                  <p
                    className={cn(
                      "text-sm",
                      done
                        ? active
                          ? "font-bold text-slate-950"
                          : "font-medium text-slate-700"
                        : "text-slate-400",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.date ? (
                    <p className={cn("mt-0.5 text-xs", "text-slate-400")}>
                      {step.date}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (block.type === "returnReason") {
    const returnCode = asText(
      resolveBlockPropValue(block, "returnCode", sourceData),
    );
    const reason = asText(resolveBlockPropValue(block, "reason", sourceData));
    const details = asText(resolveBlockPropValue(block, "details", sourceData));

    return (
      <div className={cn(shell, "border-rose-200 bg-rose-50")}>
        <p className={cn("text-sm font-semibold", "text-slate-950")}>
          {headline || "İade Nedeni"}
        </p>
        {returnCode ? (
          <span
            className={cn(
              "mt-2 inline-block rounded-lg px-2 py-0.5 font-mono text-xs",
              "bg-slate-100 text-slate-600",
            )}
          >
            {returnCode}
          </span>
        ) : null}
        {reason ? (
          <p className={cn("mt-3 text-sm font-medium", "text-slate-800")}>
            {reason}
          </p>
        ) : null}
        {details ? (
          <p className={cn("mt-2 text-sm leading-6", "text-slate-600")}>
            {details}
          </p>
        ) : null}
      </div>
    );
  }

  if (block.type === "returnInstructions") {
    const step1 = asText(resolveBlockPropValue(block, "step1", sourceData));
    const step2 = asText(resolveBlockPropValue(block, "step2", sourceData));
    const step3 = asText(resolveBlockPropValue(block, "step3", sourceData));
    const note = asText(resolveBlockPropValue(block, "note", sourceData));
    const steps = [step1, step2, step3].filter(Boolean);

    return (
      <div className={shell}>
        <p className={cn("mb-4 text-sm font-semibold", "text-slate-950")}>
          {headline || "İade Talimatları"}
        </p>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  "bg-slate-100 text-slate-600",
                )}
              >
                {i + 1}
              </div>
              <p className={cn("pt-0.5 text-sm leading-6", "text-slate-600")}>
                {s}
              </p>
            </div>
          ))}
        </div>
        {note ? (
          <div
            className={cn(
              "mt-4 rounded-xl px-3 py-2 text-xs",
              "bg-slate-100 text-slate-500",
            )}
          >
            {note}
          </div>
        ) : null}
      </div>
    );
  }

  if (block.type === "footer") {
    const companyName =
      asText(resolveBlockPropValue(block, "companyName", sourceData)) ||
      "Sirket";
    const addressLine = asText(
      resolveBlockPropValue(block, "address", sourceData),
    );
    const unsubscribeText =
      asText(resolveBlockPropValue(block, "unsubscribeText", sourceData)) ||
      "Destek bilgisi";
    const showSocialLinks = asBoolean(
      resolveBlockPropValue(block, "showSocialLinks", sourceData),
    );

    return (
      <div className={cn(shell, "text-center", "bg-slate-950")}>
        <p
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.18em]",
            "text-slate-300",
          )}
        >
          {companyName}
        </p>
        {addressLine ? (
          <p
            className={cn("mt-2 whitespace-pre-line text-xs", "text-slate-500")}
          >
            {addressLine}
          </p>
        ) : null}
        {showSocialLinks ? (
          <div className="mt-4 flex justify-center gap-3">
            {["T", "L", "I"].map((symbol) => (
              <div
                key={symbol}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                  "bg-slate-700 text-slate-300",
                )}
              >
                {symbol}
              </div>
            ))}
          </div>
        ) : null}
        <p
          className={cn(
            "mt-4 text-xs underline underline-offset-2",
            "text-slate-500",
          )}
        >
          {unsubscribeText}
        </p>
      </div>
    );
  }

  if (block.type === "customHtml") {
    const rawHtml = asText(resolveBlockPropValue(block, "html", sourceData));
    const safeHtml = sanitizeCustomHtmlForApp(rawHtml);
    const sectionKind = asText(block.props["htmlSectionKind"] ?? "");

    if (preview) {
      // Preview: evaluate Scriban → show real data in original design
      const evaluated = safeHtml.includes("{{")
        ? evaluateScriban(safeHtml, sourceData)
        : safeHtml;
      return (
        <div className={shell}>
          {evaluated ? (
            <IsolatedHtmlFrame
              html={evaluated}
              className="w-full rounded-xl bg-white"
              minHeight={120}
            />
          ) : (
            <p className="text-sm text-slate-400">HTML içeriği bulunamadı.</p>
          )}
        </div>
      );
    }

    // Canvas: render original HTML visually WITHOUT evaluating Scriban.
    // {{ variables }} appear as visible text in the rendered design,
    // preserving both the original layout AND template syntax.
    // No wrapper box — HTML flows as a continuous template.
    if (sectionKind === "tbody-row" || isTableRowSection(rawHtml)) {
      return safeHtml ? (
        <CustomHtmlCanvas
          html={safeHtml}
          rawHtml={rawHtml}
          sourceData={sourceData}
          className="w-full"
          rowMode
          editorMode={editorMode}
          activeOccurrenceId={activeHtmlOccurrenceId}
          activeTextRegionId={activeTextRegionId}
          onSelectOccurrence={onSelectHtmlOccurrence}
          onReplaceOccurrence={onReplaceHtmlOccurrence}
          onSelectTextRegion={onSelectTextRegion}
          onEditTextRegion={onEditTextRegion}
          onInsertVariable={onInsertVariable}
          onStyleTextRegion={onStyleTextRegion}
          onToolbarOverlayChange={onToolbarOverlayChange}
          onOccurrencePickerOverlayChange={onOccurrencePickerOverlayChange}
        />
      ) : (
        <div className="flex items-center gap-3 p-4">
          <div className="rounded-2xl bg-orange-500/10 p-2 text-orange-300">
            {"</>"}
          </div>
          <p className="text-xs text-slate-600">HTML iÃ§eriÄŸi bulunamadÄ±.</p>
        </div>
      );
    }

    return safeHtml ? (
      <CustomHtmlCanvas
        html={safeHtml}
        rawHtml={rawHtml}
        sourceData={sourceData}
        className="w-full overflow-hidden"
        editorMode={editorMode}
        activeOccurrenceId={activeHtmlOccurrenceId}
        activeTextRegionId={activeTextRegionId}
        onSelectOccurrence={onSelectHtmlOccurrence}
        onReplaceOccurrence={onReplaceHtmlOccurrence}
        onSelectTextRegion={onSelectTextRegion}
        onEditTextRegion={onEditTextRegion}
        onInsertVariable={onInsertVariable}
        onStyleTextRegion={onStyleTextRegion}
        onToolbarOverlayChange={onToolbarOverlayChange}
        onOccurrencePickerOverlayChange={onOccurrencePickerOverlayChange}
      />
    ) : (
      <div className="flex items-center gap-3 p-4">
        <div className="rounded-2xl bg-orange-500/10 p-2 text-orange-300">
          {"</>"}
        </div>
        <p className="text-xs text-slate-600">HTML içeriği bulunamadı.</p>
      </div>
    );
  }

  if (block.type === "promotionBanner") {
    const promoCode = asText(
      resolveBlockPropValue(block, "promoCode", sourceData),
    );
    const ctaLabel =
      asText(resolveBlockPropValue(block, "ctaLabel", sourceData)) ||
      "Kodu Kopyala";
    const ctaHref = asText(resolveBlockPropValue(block, "ctaHref", sourceData));

    return (
      <div
        className={cn(
          shell,
          "border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50",
        )}
      >
        <p className={cn("text-sm font-semibold", "text-pink-900")}>
          {headline || "Özel Teklif"}
        </p>
        {body ? (
          <p className={cn("mt-1 text-xs leading-5", "text-pink-700")}>
            {body}
          </p>
        ) : null}
        {promoCode ? (
          <div
            className={cn(
              "mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2",
              "border-pink-200 bg-white",
            )}
          >
            <span
              className={cn(
                "font-mono text-sm font-bold tracking-widest",
                "text-pink-700",
              )}
            >
              {promoCode}
            </span>
          </div>
        ) : null}
        {ctaHref ? (
          <p className={cn("mt-2 text-xs underline", "text-pink-600")}>
            {ctaLabel}
          </p>
        ) : null}
      </div>
    );
  }

  if (block.type === "productCard") {
    const imageSrc = asText(
      resolveBlockPropValue(block, "imageSrc", sourceData),
    );
    const imageAlt =
      asText(resolveBlockPropValue(block, "imageAlt", sourceData)) ||
      "Ürün görseli";
    const productName = asText(
      resolveBlockPropValue(block, "productName", sourceData),
    );
    const sku = asText(resolveBlockPropValue(block, "sku", sourceData));
    const price = asText(resolveBlockPropValue(block, "price", sourceData));
    const badge = asText(resolveBlockPropValue(block, "badge", sourceData));
    const showBadge = asBoolean(
      resolveBlockPropValue(block, "showBadge", sourceData),
    );
    const ctaLabel =
      asText(resolveBlockPropValue(block, "ctaLabel", sourceData)) ||
      "Ürünü İncele";

    return (
      <div className={shell}>
        <div className="flex items-start gap-4">
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={imageAlt}
              className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-20 w-20 shrink-0 items-center justify-center rounded-xl",
                "bg-slate-100",
              )}
            >
              <ImageIcon className={cn("h-8 w-8", "text-slate-300")} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className={cn("text-sm font-semibold", "text-slate-950")}>
                {productName || "Ürün Adı"}
              </p>
              {showBadge && badge ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    statusClass("good"),
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </div>
            {sku ? (
              <p
                className={cn("mt-0.5 font-mono text-[11px]", "text-slate-400")}
              >
                {sku}
              </p>
            ) : null}
            {price ? (
              <p className={cn("mt-1.5 text-base font-bold", "text-slate-900")}>
                {price}
              </p>
            ) : null}
            <p
              className={cn(
                "mt-2 text-xs underline underline-offset-2",
                "text-slate-500",
              )}
            >
              {ctaLabel}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "loyaltyPoints") {
    const earnedPoints = asText(
      resolveBlockPropValue(block, "earnedPoints", sourceData),
    );
    const totalBalance = asText(
      resolveBlockPropValue(block, "totalBalance", sourceData),
    );
    const ctaLabel =
      asText(resolveBlockPropValue(block, "ctaLabel", sourceData)) ||
      "Puanlarımı Gör";

    return (
      <div
        className={cn(
          shell,
          "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50",
        )}
      >
        <p className={cn("text-sm font-semibold", "text-amber-900")}>
          {headline || "Kazandığınız Puan"}
        </p>
        <div className="mt-3 flex items-end gap-6">
          {earnedPoints ? (
            <div>
              <p
                className={cn(
                  "text-[10px] uppercase tracking-[0.1em]",
                  "text-amber-600",
                )}
              >
                Kazanılan
              </p>
              <p className={cn("text-3xl font-bold", "text-amber-800")}>
                {earnedPoints}
              </p>
            </div>
          ) : null}
          {totalBalance ? (
            <div>
              <p
                className={cn(
                  "text-[10px] uppercase tracking-[0.1em]",
                  "text-amber-600",
                )}
              >
                Toplam
              </p>
              <p className={cn("text-xl font-semibold", "text-amber-700")}>
                {totalBalance}
              </p>
            </div>
          ) : null}
        </div>
        {body ? (
          <p className={cn("mt-2 text-xs leading-5", "text-amber-700")}>
            {body}
          </p>
        ) : null}
        <p
          className={cn(
            "mt-3 text-xs underline underline-offset-2",
            "text-amber-600",
          )}
        >
          {ctaLabel}
        </p>
      </div>
    );
  }

  if (block.type === "dataTable") {
    const rows = [1, 2, 3, 4, 5, 6]
      .map((n) => {
        const label = asText(
          resolveBlockPropValue(block, `row${n}Label`, sourceData),
        );
        const valueKey = `row${n}Value`;
        const rawValue = asText(
          resolveBlockPropValue(block, valueKey, sourceData),
        );
        // In preview: evaluate Scriban for real data; in canvas: show raw template syntax
        const value =
          preview && rawValue.includes("{{")
            ? evaluateScriban(rawValue, sourceData)
            : rawValue;
        return { label, value };
      })
      .filter((r) => r.label || r.value);

    return (
      <div className={cn(shell, "border-indigo-100 bg-white")}>
        {headline ? (
          <p className={cn("mb-3 text-sm font-semibold", "text-slate-950")}>
            {headline}
          </p>
        ) : null}
        <div
          className={cn(
            "divide-y overflow-hidden rounded-lg border",
            "divide-slate-100 border-slate-200",
          )}
        >
          {rows.length > 0 ? (
            rows.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-baseline justify-between gap-4 px-3 py-2",
                  "bg-white odd:bg-slate-50/60",
                )}
              >
                <span className={cn("shrink-0 text-xs", "text-slate-500")}>
                  {row.label}
                </span>
                <span
                  className={cn(
                    "min-w-0 text-right text-xs font-medium break-words",
                    "text-slate-800",
                  )}
                >
                  {row.value || (
                    <span className={cn("italic", "text-slate-300")}>—</span>
                  )}
                </span>
              </div>
            ))
          ) : (
            <div
              className={cn("px-3 py-4 text-center text-xs", "text-slate-400")}
            >
              Satır eklenmedi
            </div>
          )}
        </div>
      </div>
    );
  }

  if (block.type === "ratingRequest") {
    const showStars = asBoolean(
      resolveBlockPropValue(block, "showStars", sourceData),
    );
    const ctaLabel =
      asText(resolveBlockPropValue(block, "ctaLabel", sourceData)) ||
      "Değerlendirme Yap";

    return (
      <div
        className={cn(
          shell,
          "border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 text-center",
        )}
      >
        {showStars ? (
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={cn("text-2xl", "text-yellow-400")}>
                ★
              </span>
            ))}
          </div>
        ) : null}
        <p className={cn("text-sm font-semibold", "text-slate-950")}>
          {headline || "Deneyiminizi Paylaşın"}
        </p>
        {body ? (
          <p className={cn("mt-2 text-sm leading-6", "text-slate-600")}>
            {body}
          </p>
        ) : null}
        <button
          type="button"
          className={cn(
            "mt-4 rounded-xl px-4 py-2 text-xs font-semibold",
            "bg-slate-950 text-white",
          )}
        >
          {ctaLabel}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        shell,
        align === "center" && "text-center",
        block.type === "hero" &&
          (tone === "cool"
            ? "bg-slate-950 text-white"
            : "bg-gradient-to-br from-amber-50 via-white to-cyan-50"),
      )}
    >
      <p
        className={cn(
          "text-2xl font-semibold tracking-tight",
          tone === "cool" ? "text-white" : "text-slate-950",
        )}
      >
        {headline}
      </p>
      <p
        className={cn(
          "mt-3 text-sm leading-7",
          tone === "cool" ? "text-slate-300" : "text-slate-600",
        )}
      >
        {body}
      </p>
    </div>
  );
}
