export type VariableMeta = {
  label: string;
  description: string;
  group: string;
};

export const variableLabels: Record<string, VariableMeta> = {
  // ── Sipariş ──
  "Order.OrderID": { label: "Sipariş ID", description: "Sistemdeki dahili sipariş kimliği", group: "Sipariş" },
  "Order.OrderCode": { label: "Sipariş Kodu", description: "Platformda gösterilen sipariş numarası", group: "Sipariş" },
  "Order.OrderDate": { label: "Sipariş Tarihi", description: "Siparişin oluşturulduğu tarih ve saat", group: "Sipariş" },
  "Order.OrderSource": { label: "Sipariş Kaynağı", description: "Siparişin geldiği satış kanalı (web, mobil vb.)", group: "Sipariş" },
  "Order.OrderType": { label: "Sipariş Tipi", description: "Siparişin türü (normal, hızlı, toplu vb.)", group: "Sipariş" },
  "Order.StatusDesc": { label: "Durum Açıklaması", description: "Siparişin mevcut durumunun açıklaması", group: "Sipariş" },
  "Order.Status": { label: "Durum Kodu", description: "Siparişin sayısal durum kodu", group: "Sipariş" },
  "Order.WithPayment": { label: "Ödeme Durumu", description: "Ödemenin alınıp alınmadığını gösterir", group: "Sipariş" },
  "Order.PackageNumber": { label: "Paket Numarası", description: "Siparişin paket numarası", group: "Sipariş" },
  "Order.PackageBarcode": { label: "Paket Barkodu", description: "Paketin barkod değeri", group: "Sipariş" },

  // ── Müşteri ──
  "Order.FullName": { label: "Müşteri Adı Soyadı", description: "Siparişi veren müşterinin tam adı", group: "Müşteri" },
  "Order.Email": { label: "E-posta", description: "Müşterinin e-posta adresi", group: "Müşteri" },

  // ── Teslimat Adresi ──
  "Order.ShipFullName": { label: "Alıcı Adı Soyadı", description: "Teslimat alıcısının tam adı", group: "Teslimat Adresi" },
  "Order.ShipName": { label: "Alıcı Adı", description: "Teslimat alıcısının adı", group: "Teslimat Adresi" },
  "Order.ShipLastName": { label: "Alıcı Soyadı", description: "Teslimat alıcısının soyadı", group: "Teslimat Adresi" },
  "Order.ShipAddress": { label: "Teslimat Adresi", description: "Paketin teslim edileceği açık adres", group: "Teslimat Adresi" },
  "Order.ShipDistrict": { label: "Teslimat İlçesi", description: "Teslimat adresinin ilçesi", group: "Teslimat Adresi" },
  "Order.ShipTown": { label: "Teslimat Mahallesi", description: "Teslimat adresinin mahallesi veya beldesi", group: "Teslimat Adresi" },
  "Order.ShipCity": { label: "Teslimat Şehri", description: "Teslimat adresinin şehri", group: "Teslimat Adresi" },
  "Order.ShipCountry": { label: "Teslimat Ülkesi", description: "Teslimat adresinin ülkesi", group: "Teslimat Adresi" },
  "Order.ShipPostalCode": { label: "Teslimat Posta Kodu", description: "Teslimat adresinin posta kodu", group: "Teslimat Adresi" },
  "Order.ShipPhone": { label: "Teslimat Sabit Telefonu", description: "Alıcının sabit telefon numarası", group: "Teslimat Adresi" },
  "Order.ShipMobilePhone": { label: "Teslimat Cep Telefonu", description: "Alıcının cep telefonu numarası", group: "Teslimat Adresi" },
  "Order.ShipGiftNote": { label: "Hediye Notu", description: "Alıcıya iletilecek hediye mesajı", group: "Teslimat Adresi" },

  // ── Kargo ──
  "Order.ShipperName": { label: "Kargo Firması", description: "Siparişi taşıyan kargo firmasının adı", group: "Kargo" },
  "Order.ShipperID": { label: "Kargo Firma ID", description: "Kargo firmasının sistemdeki kimliği", group: "Kargo" },
  "Order.ShippingRefCode": { label: "Kargo Takip Kodu", description: "Kargo firmasının takip numarası", group: "Kargo" },
  "Order.ShippingTrackingUrl": { label: "Kargo Takip Linki", description: "Kargoyu takip etmek için URL", group: "Kargo" },
  "Order.ShippingDeadline": { label: "Teslimat Son Tarihi", description: "Kargonun teslim edilmesi gereken son tarih", group: "Kargo" },
  "Order.ShippingDate": { label: "Kargo Tarihi", description: "Paketin kargoya verildiği tarih", group: "Kargo" },

  // ── Finansal ──
  "Order.OrderSubTotal": { label: "Sipariş Ara Toplamı", description: "Siparişin KDV hariç ara toplamı", group: "Finansal" },
  "Order.InvoiceSubTotal": { label: "Fatura Ara Toplamı", description: "Faturanın KDV hariç ara toplamı", group: "Finansal" },

  // ── Fatura ──
  "Order.InvoiceCode": { label: "Fatura Kodu", description: "İlişkili faturanın kodu", group: "Fatura" },
  "Order.InvoiceID": { label: "Fatura ID", description: "İlişkili faturanın dahili kimliği", group: "Fatura" },

  // ── Depo / Ambar ──
  "Order.WarehouseName": { label: "Depo Adı", description: "Siparişin işlendiği deponun adı", group: "Sipariş" },
  "Order.WarehouseCode": { label: "Depo Kodu", description: "Siparişin işlendiği deponun kodu", group: "Sipariş" },
  "Order.CreatedDate": { label: "Oluşturma Tarihi", description: "Kaydın sisteme girildiği tarih", group: "Sipariş" },
  "Order.StatusDate": { label: "Durum Tarihi", description: "Son durum değişikliğinin tarihi", group: "Sipariş" },
  "Order.ParsedStatus": { label: "İşlenmiş Durum", description: "Dahili durum kodu (sayısal)", group: "Sipariş" },
  "Order.ShippingID": { label: "Kargo Sevkiyat ID", description: "Kargo işleminin dahili kimliği", group: "Kargo" },
  "Order.PackageID": { label: "Paket ID", description: "Paketin dahili kimliği", group: "Kargo" },
  "Order.EntPosted": { label: "Muhasebe Aktarıldı", description: "Muhasebeye aktarılıp aktarılmadığı", group: "Fatura" },
  "Order.PostedID": { label: "Aktarma Referansı", description: "Muhasebe aktarma referans numarası", group: "Fatura" },
  "Order.IsPrinted": { label: "Yazdırıldı", description: "Siparişin yazdırılıp yazdırılmadığı", group: "Sipariş" },
  "Order.SenderPaid": { label: "Gönderici Ödedi", description: "Kargo ücretini gönderici mi ödedi", group: "Kargo" },
  "Order.InvoicedShippingCost": { label: "Faturalanan Kargo Ücreti", description: "Faturaya yansıtılan kargo bedeli", group: "Finansal" },
  "Order.ShipperCost": { label: "Kargo Bedeli", description: "Kargo firmasına ödenen ücret", group: "Finansal" },
  "Order.ShipperVolume": { label: "Kargo Hacmi", description: "Paketin hacimsel ağırlığı", group: "Kargo" },
  "Order.ShipAddressID": { label: "Adres ID", description: "Teslimat adresinin dahili kimliği", group: "Teslimat Adresi" },
  "Order.ShipCityCode": { label: "Şehir Kodu", description: "Teslimat şehrinin sayısal kodu", group: "Teslimat Adresi" },
  "Order.ShipDistrictCode": { label: "İlçe Kodu", description: "Teslimat ilçesinin sayısal kodu", group: "Teslimat Adresi" },
  "Order.ShipCountryCode": { label: "Ülke Kodu", description: "Teslimat ülkesinin ISO kodu (TR)", group: "Teslimat Adresi" },
  "Order.ShipperNote": { label: "Kargo Notu", description: "Kargo firmasına iletilen özel not", group: "Kargo" },
  "Order.ShipFullNameOther": { label: "Alternatif Alıcı Adı", description: "Alternatif alıcı adı (varsa)", group: "Teslimat Adresi" },
  "Order.StoreID": { label: "Mağaza ID", description: "Siparişin ait olduğu mağazanın kimliği", group: "Sipariş" },
  "Order.OrderSourceBarcode": { label: "Platform Barkodu", description: "Satış platformunun kendi barkod değeri", group: "Sipariş" },
  "Order.ShippingTemplateID": { label: "Kargo Şablonu ID", description: "Kullanılan kargo şablonunun kimliği", group: "Kargo" },
  "Order.StatusCheckCount": { label: "Durum Kontrol Sayısı", description: "Durum kaç kez kontrol edildi", group: "Sipariş" },

  // ──────────────────────────────────────────────
  // INVOICE fields
  // ──────────────────────────────────────────────

  // ── Fatura Kimlik ──
  "Invoice.InvoiceID": { label: "Fatura ID", description: "Sistemdeki dahili fatura kimliği", group: "Fatura" },
  "Invoice.InvoiceCode": { label: "Fatura Kodu", description: "Faturanın kod numarası", group: "Fatura" },
  "Invoice.EInvoiceCode": { label: "e-Fatura Kodu", description: "Elektronik faturanın kodu", group: "Fatura" },
  "Invoice.ErpRefCode": { label: "ERP Referans Kodu", description: "ERP sistemindeki referans kodu", group: "Fatura" },
  "Invoice.InvoiceDate": { label: "Fatura Tarihi", description: "Faturanın düzenlendiği tarih", group: "Fatura" },
  "Invoice.InvoiceNote": { label: "Fatura Notu", description: "Faturaya eklenen açıklama notu", group: "Fatura" },
  "Invoice.EInvoiceUrl": { label: "e-Fatura Linki", description: "Elektronik faturanın görüntülenebileceği URL", group: "Fatura" },
  "Invoice.InvoiceStatus": { label: "Fatura Durumu", description: "Faturanın mevcut durumu", group: "Fatura" },
  "Invoice.TotalItems": { label: "Toplam Ürün Adedi", description: "Faturadaki toplam ürün adedi", group: "Fatura" },

  // ── Fatura Finansal ──
  "Invoice.InvoiceSubTotal": { label: "Fatura Ara Toplamı", description: "Faturanın KDV hariç ara toplamı", group: "Finansal" },
  "Invoice.InvoiceTotalVat": { label: "Toplam KDV", description: "Faturadaki toplam KDV tutarı", group: "Finansal" },
  "Invoice.InvoiceSubTotalText": { label: "Fatura Ara Toplamı (Yazı)", description: "Fatura ara toplamı yazılı olarak", group: "Finansal" },
  "Invoice.InvoiceTotalVatText": { label: "Toplam KDV (Yazı)", description: "Toplam KDV tutarı yazılı olarak", group: "Finansal" },
  "Invoice.OrderSubTotalText": { label: "Sipariş Ara Toplamı (Yazı)", description: "Sipariş ara toplamı yazılı olarak", group: "Finansal" },
  "Invoice.OrderPaymentTotalText": { label: "Ödeme Toplamı (Yazı)", description: "Toplam ödeme tutarı yazılı olarak", group: "Finansal" },
  "Invoice.OrderSubTotal": { label: "Sipariş Ara Toplamı", description: "Siparişin KDV hariç ara toplamı", group: "Finansal" },
  "Invoice.ShippingCost": { label: "Kargo Ücreti", description: "Faturadaki kargo bedeli", group: "Finansal" },
  "Invoice.DurationAfterOrder": { label: "Sipariş Sonrası Süre", description: "Sipariş verilmesinden bu yana geçen süre", group: "Fatura" },

  // ── Fatura Müşteri ──
  "Invoice.FullName": { label: "Müşteri Adı Soyadı", description: "Faturadaki müşterinin tam adı", group: "Müşteri" },
  "Invoice.Name": { label: "Müşteri Adı", description: "Müşterinin adı", group: "Müşteri" },
  "Invoice.LastName": { label: "Müşteri Soyadı", description: "Müşterinin soyadı", group: "Müşteri" },
  "Invoice.Email": { label: "E-posta", description: "Müşterinin e-posta adresi", group: "Müşteri" },

  // ── Fatura Teslimat Adresi ──
  "Invoice.ShipFullName": { label: "Alıcı Adı Soyadı", description: "Teslimat alıcısının tam adı", group: "Teslimat Adresi" },
  "Invoice.ShipAddress": { label: "Teslimat Adresi", description: "Paketin teslim edileceği açık adres", group: "Teslimat Adresi" },
  "Invoice.ShipDistrict": { label: "Teslimat İlçesi", description: "Teslimat adresinin ilçesi", group: "Teslimat Adresi" },
  "Invoice.ShipTown": { label: "Teslimat Mahallesi", description: "Teslimat adresinin mahallesi veya beldesi", group: "Teslimat Adresi" },
  "Invoice.ShipCity": { label: "Teslimat Şehri", description: "Teslimat adresinin şehri", group: "Teslimat Adresi" },
  "Invoice.ShipCountry": { label: "Teslimat Ülkesi", description: "Teslimat adresinin ülkesi", group: "Teslimat Adresi" },
  "Invoice.ShipPostalCode": { label: "Teslimat Posta Kodu", description: "Teslimat adresinin posta kodu", group: "Teslimat Adresi" },

  // ── Fatura Adresi ──
  "Invoice.BillFullName": { label: "Fatura Ad Soyadı", description: "Fatura alıcısının tam adı", group: "Fatura Adresi" },
  "Invoice.BillAddress": { label: "Fatura Adresi", description: "Fatura kesilen adres", group: "Fatura Adresi" },
  "Invoice.BillDistrict": { label: "Fatura İlçesi", description: "Fatura adresinin ilçesi", group: "Fatura Adresi" },
  "Invoice.BillTown": { label: "Fatura Mahallesi", description: "Fatura adresinin mahallesi", group: "Fatura Adresi" },
  "Invoice.BillCity": { label: "Fatura Şehri", description: "Fatura adresinin şehri", group: "Fatura Adresi" },

  // ── Fatura Vergi / Şirket ──
  "Invoice.TaxNumber": { label: "Vergi/TC Kimlik No", description: "Kurumsal faturalar için vergi numarası veya TC kimlik", group: "Fatura Adresi" },
  "Invoice.TaxOffice": { label: "Vergi Dairesi", description: "Vergi dairesinin adı", group: "Fatura Adresi" },
  "Invoice.CompanyName": { label: "Şirket Adı", description: "Kurumsal faturada şirket adı", group: "Fatura Adresi" },

  // ── Fatura Sipariş Bilgileri ──
  "Invoice.OrderCode": { label: "Sipariş Kodu", description: "Faturanın bağlı olduğu siparişin kodu", group: "Sipariş" },
  "Invoice.OrderDate": { label: "Sipariş Tarihi", description: "Siparişin oluşturulduğu tarih", group: "Sipariş" },
  "Invoice.OrderSource": { label: "Sipariş Kaynağı", description: "Siparişin geldiği satış kanalı", group: "Sipariş" },
  "Invoice.OrderStatus": { label: "Sipariş Durum Kodu", description: "Siparişin sayısal durum kodu", group: "Sipariş" },
  "Invoice.OrderStateName": { label: "Sipariş Durum Adı", description: "Siparişin durum adı", group: "Sipariş" },

  // ── Fatura Kargo ──
  "Invoice.ShipperName": { label: "Kargo Firması", description: "Faturadaki kargo firmasının adı", group: "Kargo" },
  "Invoice.ShipperID": { label: "Kargo Firma ID", description: "Kargo firmasının sistemdeki kimliği", group: "Kargo" },

  // ── Ödeme ──
  "Invoice.PaymentTypeName": { label: "Ödeme Yöntemi", description: "Kullanılan ödeme yönteminin adı", group: "Ödeme" },
  "Invoice.PaymentState": { label: "Ödeme Durumu", description: "Ödemenin mevcut durumu", group: "Ödeme" },
  "Invoice.PaymentDescription": { label: "Ödeme Açıklaması", description: "Ödeme işlemine ait açıklama", group: "Ödeme" },
  "Invoice.PaymentTotal": { label: "Ödeme Toplamı", description: "Ödenen toplam tutar", group: "Ödeme" },

  // ── Fatura Depo ──
  "Invoice.WarehouseName": { label: "Depo Adı", description: "Faturanın işlendiği deponun adı", group: "Fatura" },
  "Invoice.WarehouseCode": { label: "Depo Kodu", description: "Faturanın işlendiği deponun kodu", group: "Fatura" },

  // ── OResult ──
  "OResult.GrandTotal": { label: "Genel Toplam", description: "Siparişin tüm vergiler dahil genel toplamı", group: "Finansal" },
  "OResult.GrandTotalText": { label: "Genel Toplam (Yazı)", description: "Genel toplam tutarı yazılı olarak", group: "Finansal" },
  "OResult.CartTotalWithTax": { label: "Sepet Toplamı (KDV Dahil)", description: "KDV dahil sepet toplamı", group: "Finansal" },
  "OResult.CartTotalWithTaxText": { label: "Sepet Toplamı KDV Dahil (Yazı)", description: "KDV dahil sepet toplamı yazılı olarak", group: "Finansal" },
  "OResult.TotalDiscount": { label: "Toplam İndirim", description: "Uygulanan toplam indirim tutarı", group: "Finansal" },
  "OResult.TotalDiscountText": { label: "Toplam İndirim (Yazı)", description: "Toplam indirim tutarı yazılı olarak", group: "Finansal" },
  "OResult.TotalSurcharge": { label: "Toplam Ek Ücret", description: "Uygulanan toplam ek ücret", group: "Finansal" },
  "OResult.TotalSurchargeText": { label: "Toplam Ek Ücret (Yazı)", description: "Toplam ek ücret yazılı olarak", group: "Finansal" },
  "OResult.TotalTaxAmount": { label: "Toplam Vergi", description: "Siparişin toplam vergi tutarı", group: "Finansal" },
  "OResult.TotalTaxAmountText": { label: "Toplam Vergi (Yazı)", description: "Toplam vergi tutarı yazılı olarak", group: "Finansal" },
  "OResult.ShippingCost": { label: "Kargo Ücreti", description: "Sipariş toplamındaki kargo bedeli", group: "Finansal" },
  "OResult.ShippingCostText": { label: "Kargo Ücreti (Yazı)", description: "Kargo bedeli yazılı olarak", group: "Finansal" },

  // ──────────────────────────────────────────────
  // RETURN fields
  // ──────────────────────────────────────────────

  // ── İade Kimlik ──
  "Return.ReturnID": { label: "İade ID", description: "Sistemdeki dahili iade kimliği", group: "İade" },
  "Return.OrderID": { label: "Sipariş ID", description: "İadeye konu olan siparişin dahili kimliği", group: "İade" },
  "Return.OrderCode": { label: "Sipariş Kodu", description: "İadeye konu olan siparişin kodu", group: "İade" },
  "Return.OrderDate": { label: "Sipariş Tarihi", description: "İadeye konu olan siparişin tarihi", group: "İade" },
  "Return.OrderSource": { label: "Sipariş Kaynağı", description: "İadeye konu siparişin geldiği satış kanalı", group: "İade" },

  // ── İade Durum ──
  "Return.ReturnStatus": { label: "İade Durum Kodu", description: "İademin sayısal durum kodu", group: "İade" },
  "Return.ReturnStatusDesc": { label: "İade Durum Açıklaması", description: "İadenin mevcut durumunun açıklaması", group: "İade" },
  "Return.StatusDetail": { label: "Durum Detay Kodu", description: "İade durumunun detay kodu", group: "İade" },
  "Return.StatusDetailDesc": { label: "Durum Detay Açıklaması", description: "İade durumunun detaylı açıklaması", group: "İade" },
  "Return.MPStatus": { label: "Pazar Yeri Durum Kodu", description: "Pazar yerindeki iade durum kodu", group: "İade" },
  "Return.MPStatusDesc": { label: "Pazar Yeri Durum Açıklaması", description: "Pazar yerindeki iade durumunun açıklaması", group: "İade" },

  // ── İade Kargo ──
  "Return.ShippingStatus": { label: "İade Kargo Durum Kodu", description: "İade kargosunun durum kodu", group: "Kargo" },
  "Return.ShippingStatusDesc": { label: "İade Kargo Durum Açıklaması", description: "İade kargosunun durum açıklaması", group: "Kargo" },
  "Return.ShippingRefCode": { label: "İade Kargo Takip Kodu", description: "İade kargosunun takip numarası", group: "Kargo" },
  "Return.ShippingDate": { label: "İade Kargo Tarihi", description: "İade kargosnun alındığı tarih", group: "Kargo" },
  "Return.ShipperID": { label: "İade Kargo Firma ID", description: "İade kargosunu taşıyan firmanın kimliği", group: "Kargo" },
  "Return.ShipperCost": { label: "İade Kargo Ücreti", description: "İade kargo bedeli", group: "Kargo" },

  // ── İade Müşteri ──
  "Return.UserName": { label: "Müşteri Adı", description: "İade talebinde bulunan müşterinin adı", group: "Müşteri" },
  "Return.Email": { label: "E-posta", description: "Müşterinin e-posta adresi", group: "Müşteri" },
  "Return.MobilePhone": { label: "Cep Telefonu", description: "Müşterinin cep telefonu numarası", group: "Müşteri" },

  // ── İade Adres ──
  "Return.City": { label: "Şehir", description: "İade adresinin şehri", group: "Teslimat Adresi" },
  "Return.District": { label: "İlçe", description: "İade adresinin ilçesi", group: "Teslimat Adresi" },
  "Return.Country": { label: "Ülke", description: "İade adresinin ülkesi", group: "Teslimat Adresi" },
  "Return.ShippingAddress": { label: "İade Kargo Adresi", description: "Müşterinin iadesi için kargo adresi", group: "Teslimat Adresi" },
  "Return.WareHouseAddress": { label: "Depo Adresi", description: "İadenin teslim edileceği depo adresi", group: "Teslimat Adresi" },

  // ── İade Depo ──
  "Return.WareHouseName": { label: "Depo Adı", description: "İadenin kabul edileceği deponun adı", group: "İade" },
  "Return.WareHouseCode": { label: "Depo Kodu", description: "İadenin kabul edileceği deponun kodu", group: "İade" },

  // ── İade Tarihler ──
  "Return.CreatedDate": { label: "İade Oluşturma Tarihi", description: "İade talebinin oluşturulduğu tarih", group: "İade" },
  "Return.ModifiedDate": { label: "İade Güncelleme Tarihi", description: "İade talebinin son güncellendiği tarih", group: "İade" },

  // ──────────────────────────────────────────────
  // SHIPPING fields
  // ──────────────────────────────────────────────

  "Shipping.ShippingID": { label: "Kargo ID", description: "Sistemdeki dahili kargo kimliği", group: "Kargo" },
  "Shipping.PackageID": { label: "Paket ID", description: "Paketin dahili kimliği", group: "Kargo" },
  "Shipping.ShipperID": { label: "Kargo Firma ID", description: "Kargo firmasının sistemdeki kimliği", group: "Kargo" },
  "Shipping.ShipperName": { label: "Kargo Firması", description: "Siparişi taşıyan kargo firmasının adı", group: "Kargo" },
  "Shipping.ShippingDate": { label: "Kargo Tarihi", description: "Paketin kargoya verildiği tarih", group: "Kargo" },
  "Shipping.ShippingRefCode": { label: "Kargo Takip Kodu", description: "Kargo firmasının takip numarası", group: "Kargo" },
  "Shipping.ShippingTrackingUrl": { label: "Kargo Takip Linki", description: "Kargoyu takip etmek için URL", group: "Kargo" },
  "Shipping.Status": { label: "Kargo Durum Kodu", description: "Kargonun sayısal durum kodu", group: "Kargo" },
  "Shipping.StatusDesc": { label: "Kargo Durum Açıklaması", description: "Kargonun mevcut durumunun açıklaması", group: "Kargo" },
  "Shipping.PackageNumber": { label: "Paket Numarası", description: "Kargo paket numarası", group: "Kargo" },
  "Shipping.PackageBarcode": { label: "Paket Barkodu", description: "Paketin barkod değeri", group: "Kargo" },
  "Shipping.InvoiceCode": { label: "Fatura Kodu", description: "İlişkili faturanın kodu", group: "Fatura" },
  "Shipping.InvoiceID": { label: "Fatura ID", description: "İlişkili faturanın dahili kimliği", group: "Fatura" },
  "Shipping.OrderID": { label: "Sipariş ID", description: "İlişkili siparişin dahili kimliği", group: "Sipariş" },
  "Shipping.OrderCode": { label: "Sipariş Kodu", description: "İlişkili siparişin kodu", group: "Sipariş" },
  "Shipping.OrderDate": { label: "Sipariş Tarihi", description: "Siparişin oluşturulduğu tarih", group: "Sipariş" },
  "Shipping.OrderSource": { label: "Sipariş Kaynağı", description: "Siparişin geldiği satış kanalı", group: "Sipariş" },
  "Shipping.FullName": { label: "Müşteri Adı Soyadı", description: "Siparişi veren müşterinin tam adı", group: "Müşteri" },
  "Shipping.Email": { label: "E-posta", description: "Müşterinin e-posta adresi", group: "Müşteri" },
  "Shipping.ShipFullName": { label: "Alıcı Adı Soyadı", description: "Teslimat alıcısının tam adı", group: "Teslimat Adresi" },
  "Shipping.ShipAddress": { label: "Teslimat Adresi", description: "Paketin teslim edileceği açık adres", group: "Teslimat Adresi" },
  "Shipping.ShipDistrict": { label: "Teslimat İlçesi", description: "Teslimat adresinin ilçesi", group: "Teslimat Adresi" },
  "Shipping.ShipTown": { label: "Teslimat Mahallesi", description: "Teslimat adresinin mahallesi", group: "Teslimat Adresi" },
  "Shipping.ShipCity": { label: "Teslimat Şehri", description: "Teslimat adresinin şehri", group: "Teslimat Adresi" },
  "Shipping.OrderSubTotal": { label: "Sipariş Ara Toplamı", description: "Siparişin KDV hariç ara toplamı", group: "Finansal" },
  "Shipping.InvoiceSubTotal": { label: "Fatura Ara Toplamı", description: "Faturanın KDV hariç ara toplamı", group: "Finansal" },
  "Shipping.WarehouseName": { label: "Depo Adı", description: "Siparişin işlendiği deponun adı", group: "Kargo" },
  "Shipping.ShippingDeadline": { label: "Teslimat Son Tarihi", description: "Kargonun teslim edilmesi gereken son tarih", group: "Kargo" },

  // ──────────────────────────────────────────────
  // GLOBAL fields (appear in all sources)
  // ──────────────────────────────────────────────

  "Global.FrmCompanyName": { label: "Firma Adı", description: "Platformun veya firmanın adı", group: "Firma" },
  "Global.FrmCompanyAddress": { label: "Firma Adresi", description: "Firmanın açık adresi", group: "Firma" },
  "Global.FrmCompanyPhone": { label: "Firma Telefonu", description: "Firmanın iletişim telefon numarası", group: "Firma" },
  "Global.FrmInfoEmail": { label: "Firma E-postası", description: "Firmanın bilgi e-posta adresi", group: "Firma" },
  "Global.FrmSiteBaseURL": { label: "Site URL", description: "Firmanın web sitesi ana adresi", group: "Firma" },

  // ──────────────────────────────────────────────
  // ITEM fields (loop array items — all sources)
  // ──────────────────────────────────────────────

  "ItemName": { label: "Ürün Adı", description: "Sipariş kaleminin ürün adı", group: "Ürün Kalemi" },
  "SKU": { label: "Stok Kodu (SKU)", description: "Ürünün stok kodu", group: "Ürün Kalemi" },
  "VariantSKU": { label: "Varyant SKU", description: "Ürün varyantının stok kodu", group: "Ürün Kalemi" },
  "Barcode": { label: "Barkod", description: "Ürünün barkod değeri", group: "Ürün Kalemi" },
  "Quantity": { label: "Adet", description: "Sipariş edilen ürün adedi", group: "Ürün Kalemi" },
  "UnitPiece": { label: "Birim", description: "Ürünün birim türü (adet, kg vb.)", group: "Ürün Kalemi" },
  "Price": { label: "Satış Fiyatı", description: "Müşteriye uygulanan birim satış fiyatı", group: "Ürün Kalemi" },
  "ListPrice": { label: "Liste Fiyatı", description: "Ürünün katalog / liste fiyatı", group: "Ürün Kalemi" },
  "UnitCost": { label: "Birim Maliyet", description: "Ürünün birim maliyeti", group: "Ürün Kalemi" },
  "UnitCostText": { label: "Birim Maliyet (Yazı)", description: "Birim maliyet tutarı yazılı olarak", group: "Ürün Kalemi" },
  "UnitCostWithVat": { label: "Birim Maliyet (KDV Dahil)", description: "KDV dahil birim maliyeti", group: "Ürün Kalemi" },
  "UnitCostWithVatText": { label: "Birim Maliyet KDV Dahil (Yazı)", description: "KDV dahil birim maliyet yazılı olarak", group: "Ürün Kalemi" },
  "Discount": { label: "İndirim", description: "Kaleme uygulanan indirim tutarı", group: "Ürün Kalemi" },
  "DiscountText": { label: "İndirim (Yazı)", description: "İndirim tutarı yazılı olarak", group: "Ürün Kalemi" },
  "DiscountedCost": { label: "İndirimli Tutar", description: "İndirim uygulanmış birim fiyatı", group: "Ürün Kalemi" },
  "DiscountedCostText": { label: "İndirimli Tutar (Yazı)", description: "İndirimli tutar yazılı olarak", group: "Ürün Kalemi" },
  "LineTotal": { label: "Satır Toplamı", description: "Kalem için toplam tutar (adet × fiyat)", group: "Ürün Kalemi" },
  "LineTotalText": { label: "Satır Toplamı (Yazı)", description: "Satır toplamı yazılı olarak", group: "Ürün Kalemi" },
  "LineTotalWithVat": { label: "Satır Toplamı (KDV Dahil)", description: "KDV dahil satır toplamı", group: "Ürün Kalemi" },
  "LineTotalWithVatText": { label: "Satır Toplamı KDV Dahil (Yazı)", description: "KDV dahil satır toplamı yazılı olarak", group: "Ürün Kalemi" },
  "VatText": { label: "KDV (Yazı)", description: "KDV tutarı yazılı olarak", group: "Ürün Kalemi" },
  "TaxRate": { label: "KDV Oranı", description: "Ürüne uygulanan KDV oranı (%)", group: "Ürün Kalemi" },
  "Currency": { label: "Para Birimi", description: "İşlem para birimi kodu (örn. TRY, USD)", group: "Ürün Kalemi" },
  "ProductImageUrl": { label: "Ürün Görsel URL", description: "Ürün görselinin tam URL adresi", group: "Ürün Kalemi" },
  "ProductImage": { label: "Ürün Görseli", description: "Ürün görseli (alternatif alan)", group: "Ürün Kalemi" },
  "ProductUrl": { label: "Ürün Sayfası URL", description: "Ürünün satış sayfasına ait URL", group: "Ürün Kalemi" },
  "LineType": { label: "Satır Tipi", description: "Sipariş kaleminin türü", group: "Ürün Kalemi" },
  "LineStatus": { label: "Satır Durumu", description: "Sipariş kaleminin durumu", group: "Ürün Kalemi" },
  "WareHouseName": { label: "Depo Adı", description: "Kalemin işlendiği deponun adı", group: "Ürün Kalemi" },
  "WareHouseCode": { label: "Depo Kodu", description: "Kalemin işlendiği deponun kodu", group: "Ürün Kalemi" },
  "DeliveryTime": { label: "Teslimat Süresi", description: "Kalemin tahmini teslimat süresi", group: "Ürün Kalemi" },
  "ItemNote": { label: "Kalem Notu", description: "Sipariş kalemine eklenen not", group: "Ürün Kalemi" },
  "Description": { label: "Ürün Açıklaması", description: "İade kalemine ait açıklama (iade formlarında)", group: "Ürün Kalemi" },
  "ReturnProductStatus": { label: "İade Ürün Durum Kodu", description: "İade edilen ürünün durum kodu", group: "Ürün Kalemi" },
  "ReturnProductStatusDesc": { label: "İade Ürün Durum Açıklaması", description: "İade edilen ürünün durum açıklaması", group: "Ürün Kalemi" },
};
