import type { TemplateCategory } from "@/types/template";

const ORDER_DATA = {
  Order: {
    OrderId: "ORD-2024-00192",
    OrderDate: "15 Mart 2024",
    Status: "shipped",
    ShippingAddress: {
      Name: "Ahmet Yilmaz",
      Line1: "Bogaz Sokak No: 14/3",
      City: "Istanbul",
      State: "Istanbul",
      PostalCode: "34000",
      Country: "TR",
    },
    Customer: {
      Name: "Ahmet Yilmaz",
      Email: "ahmet@example.com",
      Phone: "+90 555 123 4567",
    },
    LineItems: [
      {
        ProductName: "Sony WH-1000XM5 Kulaklik",
        Sku: "SNY-WH1000XM5",
        Quantity: 1,
        UnitPrice: { Amount: 3299.0, Currency: "TRY" },
        Total: { Amount: 3299.0, Currency: "TRY" },
      },
      {
        ProductName: "2 Yillik Bakim Plani",
        Sku: "SVC-CARE-2YR",
        Quantity: 1,
        UnitPrice: { Amount: 299.0, Currency: "TRY" },
        Total: { Amount: 299.0, Currency: "TRY" },
      },
      {
        ProductName: "Standart Kargo",
        Sku: "SHP-STD",
        Quantity: 1,
        UnitPrice: { Amount: 0, Currency: "TRY" },
        Total: { Amount: 0, Currency: "TRY" },
      },
    ],
    Subtotal: { Amount: 3598.0, Currency: "TRY" },
    Tax: { Amount: 647.64, Currency: "TRY" },
    ShippingCost: { Amount: 0, Currency: "TRY" },
    Total: { Amount: 4245.64, Currency: "TRY" },
  },
};

const INVOICE_DATA = {
  Invoice: {
    InvoiceNumber: "INV-2024-00087",
    InvoiceDate: "16 Mart 2024",
    DueDate: "30 Mart 2024",
    Status: "pending",
    BillTo: {
      Name: "Fatma Kaya",
      Company: "Kaya & Ortaklari Ltd.",
      Email: "fatma@kayaortaklari.com",
      Line1: "Istiklal Cad. No: 222",
      City: "Ankara",
      PostalCode: "06100",
      Country: "TR",
    },
    InvoiceDetailItems: [
      {
        Description: "React / Next.js Danismanlik (Saat)",
        Quantity: 12,
        UnitPrice: { Amount: 1200, Currency: "TRY" },
        Amount: { Amount: 14400, Currency: "TRY" },
      },
      {
        Description: "UI Tasarim Sistemi Paketi",
        Quantity: 1,
        UnitPrice: { Amount: 4500, Currency: "TRY" },
        Amount: { Amount: 4500, Currency: "TRY" },
      },
      {
        Description: "Teknik Dokumantasyon",
        Quantity: 1,
        UnitPrice: { Amount: 2000, Currency: "TRY" },
        Amount: { Amount: 2000, Currency: "TRY" },
      },
    ],
    Subtotal: { Amount: 20900, Currency: "TRY" },
    Tax: { Amount: 3762, Currency: "TRY" },
    Total: { Amount: 24662, Currency: "TRY" },
  },
};

const RETURN_DATA = {
  Return: {
    ReturnId: "RMA-2024-00043",
    ReturnDate: "18 Mart 2024",
    Status: "good",
    Customer: {
      Name: "Mehmet Demir",
      Email: "m.demir@example.com",
      Phone: "+90 532 987 6543",
    },
    ShippingAddress: {
      Name: "Mehmet Demir",
      Line1: "Ataturk Bulvari No: 77",
      City: "Izmir",
      PostalCode: "35100",
      Country: "TR",
    },
    OrderReturnItems: [
      {
        ProductName: "Kablosuz Mouse Pro",
        Sku: "MSE-WL-PRO",
        Quantity: 1,
        Reason: "Hasarli urun",
        RefundAmount: { Amount: 850, Currency: "TRY" },
      },
      {
        ProductName: "USB-C Sarj Kablosu",
        Sku: "CBL-USBC-2M",
        Quantity: 2,
        Reason: "Yanlis urun teslim edildi",
        RefundAmount: { Amount: 240, Currency: "TRY" },
      },
    ],
    RefundTotal: { Amount: 1090, Currency: "TRY" },
    RefundMethod: "Kredi karti",
  },
};

const SHIPPING_DATA = {
  Shipping: {
    ShipmentId: "SHP-2024-00278",
    ShipDate: "17 Mart 2024",
    Carrier: "Yurtici Kargo",
    TrackingNumber: "YK-TR-988-2024-EX",
    Status: "good",
    EstimatedDelivery: "20 Mart 2024",
    Customer: {
      Name: "Zeynep Arslan",
      Email: "zeynep@example.com",
      Phone: "+90 544 321 0987",
      Address: {
        Line1: "Cumhuriyet Bulvari No: 5",
        City: "Izmir",
        PostalCode: "35210",
        Country: "TR",
      },
    },
    OrderPackageDetails: [
      {
        PackageNumber: 1,
        Weight: "1.2 kg",
        Dimensions: "30x20x15 cm",
        Contents: "Elektronik urun",
        TrackingBarcode: "YK8882024EX01",
      },
      {
        PackageNumber: 2,
        Weight: "0.5 kg",
        Dimensions: "20x15x10 cm",
        Contents: "Aksesuar",
        TrackingBarcode: "YK8882024EX02",
      },
    ],
  },
};

export function getCategoryData(category: TemplateCategory): unknown {
  switch (category) {
    case "order":
      return ORDER_DATA;
    case "invoice":
      return INVOICE_DATA;
    case "return":
      return RETURN_DATA;
    case "shipping":
      return SHIPPING_DATA;
  }
}
