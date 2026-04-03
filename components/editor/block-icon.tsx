import type { ComponentType, SVGProps } from "react";
import {
  Banknote,
  CircleAlert,
  ClipboardList,
  Code2,
  CreditCard,
  FileText,
  Grid3X3,
  GripVertical,
  Headphones,
  Image,
  Info,
  LayoutTemplate,
  ListChecks,
  MapPin,
  Minus,
  Navigation,
  PackageCheck,
  PackageOpen,
  PanelBottom,
  Receipt,
  RotateCcw,
  Rows3,
  ShoppingBag,
  ShoppingCart,
  Star,
  Table2,
  Tag,
  Truck,
  Trophy,
  Type,
  User,
} from "lucide-react";

import { getBlockDefinition } from "@/lib/blocks/registry";
import type { BlockType } from "@/types/template";

const icons: Record<BlockType, ComponentType<SVGProps<SVGSVGElement>>> = {
  // Shared layout
  hero: LayoutTemplate,
  richText: Type,
  cta: CreditCard,
  divider: Minus,
  spacer: GripVertical,
  image: Image,
  footer: PanelBottom,
  customHtml: Code2,
  // Customer & address
  address: MapPin,
  customerInfo: User,
  note: FileText,
  // Commerce
  lineItems: Rows3,
  totals: Receipt,
  summary: Table2,
  status: CircleAlert,
  // Category-specific
  shippingInfo: Truck,
  returnInfo: PackageOpen,
  // Order
  orderSummary: ShoppingBag,
  paymentInfo: Banknote,
  supportSection: Headphones,
  // Invoice
  invoiceSummary: ClipboardList,
  invoiceNotice: Info,
  // Shipping
  shipmentSummary: PackageCheck,
  trackingTimeline: Navigation,
  // Return
  returnReason: RotateCcw,
  returnInstructions: ListChecks,
  // E-commerce extras
  promotionBanner: Tag,
  productCard: ShoppingCart,
  loyaltyPoints: Trophy,
  ratingRequest: Star,
  // Generic
  dataTable: Grid3X3,
};

type BlockIconProps = {
  type: BlockType;
  className?: string;
};

export function BlockIcon({ type, className }: BlockIconProps) {
  const Icon = getBlockDefinition(type)?.icon ?? icons[type] ?? FileText;
  return <Icon className={className} />;
}
