import type { Locale } from "@/components/locale/translations";
import { formatDate, formatRupiah } from "@/utils/format";

/**
 * Perakit PDF invoice Midtrans bersama — dipakai halaman profil member
 * (riwayat belanja) dan drawer detail pemesanan admin. jsPDF di-import
 * dinamis agar tidak membebani bundle utama.
 */

/** Fungsi terjemahan dari LocaleProvider (t). */
export type InvoiceTranslate = (
  key: string,
  params?: Record<string, string | number>,
) => string;

/** Data invoice — bentuk respons GET /api/{web,admin}/orders/[id]/invoice. */
export interface InvoicePdfData {
  /** id internal order (uuid). */
  orderId: string;
  /** order_id Midtrans (TOURISM-{uuid}{YYYYMMDD}). */
  midtransOrderId: string;
  transactionId: string | null;
  paymentStatus: string;
  dateOrder: string;
  dateSchedule: string;
  homestay: boolean;
  homestayTime: number | null;
  totalPrice: number;
  paidAt: string | null;
  customer: { name: string; email: string; phone?: string | null };
  items: {
    id: string;
    packageName: string;
    quantity: number;
    price: number;
    /** Jadwal per paket (null untuk data lama — fallback agregat order). */
    dateSchedule?: string | null;
    homestay?: boolean;
    homestayTime?: number | null;
  }[];
  midtrans: {
    transactionStatus: string;
    paymentType?: string;
    statusCode?: string;
  } | null;
}

/** Tambah n hari ke tanggal ISO (untuk tanggal pulang menginap). */
function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/** Rakit & unduh bukti pembayaran (invoice Midtrans + data order) sebagai PDF. */
export async function downloadInvoicePdf(
  data: InvoicePdfData,
  t: InvoiceTranslate,
  locale: Locale,
): Promise<void> {
  // jsPDF di-import dinamis agar tidak membebani bundle utama.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();

  // Kop invoice.
  doc.setFontSize(16);
  doc.setTextColor(13, 122, 95);
  doc.text("Desaku Wisataku", 14, 18);
  doc.setFontSize(9);
  doc.setTextColor(90);
  doc.text(
    locale === "id"
      ? "Bukti Pembayaran (Invoice Midtrans)"
      : "Payment Receipt (Midtrans Invoice)",
    14,
    24,
  );
  doc.setDrawColor(13, 122, 95);
  doc.line(14, 27, 196, 27);

  // Meta pesanan.
  doc.setFontSize(10);
  doc.setTextColor(30);
  let y = 34;
  const metaLines: string[] = [
    `Order: #${data.orderId}  |  Midtrans: ${data.midtransOrderId}`,
    `Status: ${data.paymentStatus}${
      data.midtrans
        ? `  |  ${String(data.midtrans.paymentType ?? "qris").toUpperCase()} (Midtrans: ${data.midtrans.transactionStatus})`
        : ""
    }`,
    `${locale === "id" ? "Pemesan" : "Customer"}: ${data.customer.name} (${data.customer.email})`,
    `${t("profile.orderDate")}: ${formatDate(data.dateOrder, locale, true)}`,
    `${t("profile.departureDate")}: ${formatDate(data.dateSchedule, locale)}`,
  ];
  if (data.homestay) {
    metaLines.push(
      `${t("checkout.homestay")}: ${t("common.yes")} (${data.homestayTime} ${t("checkout.homestayDays")})`,
    );
    metaLines.push(
      `${t("checkout.returnDate")}: ${formatDate(
        addDays(data.dateSchedule, data.homestayTime ?? 1),
        locale,
      )}`,
    );
  }
  if (data.paidAt) {
    metaLines.push(
      `${t("profile.paidAt")}: ${formatDate(data.paidAt, locale, true)}`,
    );
  }
  for (const line of metaLines) {
    doc.text(line, 14, y);
    y += 6;
  }

  // Tabel item.
  y += 4;
  doc.setFillColor(240, 250, 247);
  doc.rect(14, y - 4, 182, 8, "F");
  doc.setFontSize(9);
  doc.text(t("cart.package"), 16, y + 1.5);
  doc.text(t("cart.qty"), 130, y + 1.5, { align: "center" });
  doc.text(t("cart.price"), 194, y + 1.5, { align: "right" });
  y += 10;
  for (const item of data.items) {
    doc.text(String(item.packageName), 16, y);
    doc.text(String(item.quantity), 130, y, { align: "center" });
    doc.text(formatRupiah(item.price), 194, y, { align: "right" });
    y += 5;
    // Jadwal per paket (fallback agregat order untuk data lama).
    const scheduleIso = item.dateSchedule ?? data.dateSchedule;
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(
      `${t("profile.departureDate")}: ${formatDate(scheduleIso, locale)}${
        item.homestay
          ? ` | ${t("checkout.homestay")}: ${item.homestayTime} ${t("checkout.homestayDays")}`
          : ""
      }`,
      16,
      y,
    );
    doc.setFontSize(9);
    doc.setTextColor(30);
    y += 6;
  }
  doc.setDrawColor(13, 122, 95);
  doc.line(14, y - 2, 196, y - 2);
  doc.setFontSize(11);
  doc.text(t("cart.totalPrice"), 16, y + 4);
  doc.setTextColor(13, 122, 95);
  doc.text(formatRupiah(data.totalPrice), 194, y + 4, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Powered by Midtrans QRIS", 14, 285);

  doc.save(`invoice-${data.midtransOrderId}.pdf`);
}
