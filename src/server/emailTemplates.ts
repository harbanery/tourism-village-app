import { BASE_URL, NOTIFICATION_LOCALE } from "@/config/variables";

/**
 * Template email transaksional (pola progress-self): HTML sederhana
 * inline-style agar aman untuk klien email, plus versi teks polos.
 * Bahasa mengikuti NOTIFICATION_LOCALE (server-side, id default).
 */

const BRAND = "Desaku Wisataku";
const BRAND_PRIMARY = "#0d7a5f";

/** Data order yang dipakai semua template email order. */
export interface OrderEmailData {
  orderId: number;
  userName: string;
  totalPrice: number;
  /** Format ISO — batas waktu pembayaran (email konfirmasi). */
  paymentExpiresAt?: Date | null;
  paidAt?: Date | null;
  items: {
    packageName: string;
    quantity: number;
    price: number;
    dateSchedule: Date | null;
    homestay: boolean;
    homestayTime: number | null;
  }[];
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat(
    NOTIFICATION_LOCALE === "id" ? "id-ID" : "en-US",
    { dateStyle: "full" },
  ).format(date);
}

function formatDateTime(date: Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat(
    NOTIFICATION_LOCALE === "id" ? "id-ID" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  ).format(date);
}

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

/** Kerangka HTML bersama (header brand + isi + footer). */
function emailLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:${BRAND_PRIMARY};padding:20px 24px;">
        <span style="font-size:18px;font-weight:bold;color:#ffffff;">Desaku</span><span style="font-size:18px;font-weight:bold;color:#c9f0e4;"> Wisataku</span>
      </div>
      <div style="padding:24px;color:#1f2937;">
        <h2 style="margin:0 0 16px;font-size:18px;color:${BRAND_PRIMARY};">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;">
        ${NOTIFICATION_LOCALE === "id"
          ? `Email otomatis dari ${BRAND} — tidak perlu dibalas.`
          : `Automated email from ${BRAND} — no reply needed.`}
      </div>
    </div>
  </body>
</html>`;
}

/** Tabel rincian item order (dipakai email konfirmasi + receipt). */
function itemsTable(order: OrderEmailData): string {
  const head =
    NOTIFICATION_LOCALE === "id"
      ? ["Paket", "Jadwal", "Jumlah", "Subtotal"]
      : ["Package", "Schedule", "Qty", "Subtotal"];
  const stay = (homestay: boolean, nights: number | null) =>
    homestay
      ? NOTIFICATION_LOCALE === "id"
        ? ` (menginap ${nights ?? 1} hari)`
        : ` (${nights ?? 1}-day stay)`
      : "";

  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${item.packageName}${stay(item.homestay, item.homestayTime)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${formatDate(item.dateSchedule)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatRupiah(item.price)}</td>
      </tr>`,
    )
    .join("");

  const totalLabel = NOTIFICATION_LOCALE === "id" ? "Total" : "Total";
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead><tr style="color:#6b7280;text-align:left;">
      <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;">${head[0]}</th>
      <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;">${head[1]}</th>
      <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;text-align:center;">${head[2]}</th>
      <th style="padding:8px 0;border-bottom:2px solid #e5e7eb;text-align:right;">${head[3]}</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="3" style="padding:12px 0;font-weight:bold;text-align:right;">${totalLabel}</td>
      <td style="padding:12px 0;font-weight:bold;text-align:right;color:${BRAND_PRIMARY};">${formatRupiah(order.totalPrice)}</td>
    </tr></tfoot>
  </table>`;
}

function orderLink(orderId: number): { url: string; label: string } {
  return {
    url: `${BASE_URL}/payment/${orderId}`,
    label:
      NOTIFICATION_LOCALE === "id"
        ? "Lihat Pesanan & Bayar"
        : "View Order & Pay",
  };
}

function button(url: string, label: string): string {
  return `<p style="margin:20px 0 4px;">
    <a href="${url}" style="display:inline-block;background:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;">${label}</a>
  </p>`;
}

/** Email konfirmasi pesanan baru (checkout sukses, status PENDING). */
export function orderConfirmationEmail(order: OrderEmailData): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const link = orderLink(order.orderId);
  const title = isId ? "Pesanan Dibuat" : "Order Created";
  const greeting = isId
    ? `Halo ${order.userName}, pesanan Anda berhasil dibuat.`
    : `Hello ${order.userName}, your order has been created.`;
  const deadline = isId
    ? `Selesaikan pembayaran QRIS sebelum <b>${formatDateTime(order.paymentExpiresAt)}</b> — setelah batas waktu, pesanan dibatalkan otomatis.`
    : `Please complete the QRIS payment before <b>${formatDateTime(order.paymentExpiresAt)}</b> — after the deadline the order is canceled automatically.`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 12px;color:#6b7280;">#${order.orderId}</p>
    ${itemsTable(order)}
    <p style="margin:16px 0 4px;">${deadline}</p>
    ${button(link.url, link.label)}`;

  const text = `${greeting} (#${order.orderId})
${order.items
  .map(
    (item) =>
      `- ${item.packageName} × ${item.quantity}: ${formatRupiah(item.price)} (${formatDate(item.dateSchedule)})`,
  )
  .join("\n")}
${isId ? "Total" : "Total"}: ${formatRupiah(order.totalPrice)}
${deadline.replace(/<[^>]+>/g, "")}
${link.url}`;

  return {
    subject: isId
      ? `[${BRAND}] Pesanan #${order.orderId} menunggu pembayaran`
      : `[${BRAND}] Order #${order.orderId} awaiting payment`,
    text,
    html: emailLayout(title, bodyHtml),
  };
}

/** Email konfirmasi pembayaran (receipt) setelah status PAID. */
export function orderPaidEmail(order: OrderEmailData): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const link = orderLink(order.orderId);
  const title = isId ? "Pembayaran Berhasil" : "Payment Successful";
  const greeting = isId
    ? `Halo ${order.userName}, pembayaran pesanan #${order.orderId} telah kami terima.`
    : `Hello ${order.userName}, we received your payment for order #${order.orderId}.`;
  const paid = isId
    ? `Dibayar pada <b>${formatDateTime(order.paidAt ?? new Date())}</b>. Simpan email ini sebagai bukti pemesanan.`
    : `Paid on <b>${formatDateTime(order.paidAt ?? new Date())}</b>. Keep this email as your booking proof.`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    ${itemsTable(order)}
    <p style="margin:16px 0 4px;">${paid}</p>
    ${button(link.url, isId ? "Lihat Pesanan" : "View Order")}`;

  const text = `${greeting}
${order.items
  .map(
    (item) =>
      `- ${item.packageName} × ${item.quantity}: ${formatRupiah(item.price)} (${formatDate(item.dateSchedule)})`,
  )
  .join("\n")}
${isId ? "Total" : "Total"}: ${formatRupiah(order.totalPrice)}
${paid.replace(/<[^>]+>/g, "")}
${link.url}`;

  return {
    subject: isId
      ? `[${BRAND}] Pembayaran pesanan #${order.orderId} berhasil`
      : `[${BRAND}] Payment for order #${order.orderId} received`,
    text,
    html: emailLayout(title, bodyHtml),
  };
}

/** Email pesanan kedaluwarsa/dibatalkan (melewati batas pembayaran). */
export function orderCanceledEmail(order: OrderEmailData): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const title = isId ? "Pesanan Dibatalkan" : "Order Canceled";
  const greeting = isId
    ? `Halo ${order.userName}, pesanan #${order.orderId} dibatalkan karena melewati batas waktu pembayaran.`
    : `Hello ${order.userName}, order #${order.orderId} was canceled because the payment deadline passed.`;
  const cta = isId
    ? `Ingin mencoba lagi? Silakan buat pesanan baru kapan saja.`
    : `Want to try again? You can create a new order anytime.`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    ${itemsTable(order)}
    <p style="margin:16px 0 4px;">${cta}</p>
    ${button(`${BASE_URL}/package`, isId ? "Pesan Ulang Paket" : "Book Again")}`;

  const text = `${greeting}
${order.items
  .map((item) => `- ${item.packageName} × ${item.quantity}`)
  .join("\n")}
${cta}`;

  return {
    subject: isId
      ? `[${BRAND}] Pesanan #${order.orderId} dibatalkan`
      : `[${BRAND}] Order #${order.orderId} canceled`,
    text,
    html: emailLayout(title, bodyHtml),
  };
}

/** Data pengingat jadwal (H-1 sebelum keberangkatan). */
export interface TripReminderData {
  orderId: number;
  userName: string;
  /** Item yang berangkat besok (bisa sebagian dari order). */
  items: OrderEmailData["items"];
}

/** Email pengingat jadwal keberangkatan H-1. */
export function tripReminderEmail(data: TripReminderData): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const title = isId ? "Pengingat Jadwal Wisata" : "Trip Reminder";
  const greeting = isId
    ? `Halo ${data.userName}, jadwal wisata Anda dimulai besok:`
    : `Hello ${data.userName}, your trip starts tomorrow:`;

  const rows = data.items
    .map(
      (item) =>
        `<li style="margin:4px 0;"><b>${item.packageName}</b> × ${item.quantity} — ${formatDate(item.dateSchedule)}${item.homestay ? (isId ? ` (menginak ${item.homestayTime ?? 1} hari)` : ` (${item.homestayTime ?? 1}-day stay)`) : ""}</li>`,
    )
    .join("");

  const tips = isId
    ? "Mohon hadir 15 menit sebelum jadwal. Jangan lupa membawa bukti pemesanan (email ini)."
    : "Please arrive 15 minutes early. Don't forget your booking proof (this email).";

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <ul style="margin:0 0 12px;padding-left:20px;">${rows}</ul>
    <p style="margin:0 0 4px;">${tips}</p>`;

  return {
    subject: isId
      ? `[${BRAND}] Jadwal wisata Anda besok (pesanan #${data.orderId})`
      : `[${BRAND}] Your trip is tomorrow (order #${data.orderId})`,
    text: `${greeting}
${data.items
  .map(
    (item) =>
      `- ${item.packageName} × ${item.quantity} — ${formatDate(item.dateSchedule)}`,
  )
  .join("\n")}
${tips}`,
    html: emailLayout(title, bodyHtml),
  };
}

/** Data ringkasan harian untuk admin. */
export interface DailySummaryData {
  date: Date;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  revenue: number;
  /** Opsional — AuthUser tidak mencatat waktu registrasi. */
  newUsers?: number;
}

/** Email ringkasan harian untuk admin (dikirim cron malam hari). */
export function dailySummaryEmail(data: DailySummaryData): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const title = isId ? "Ringkasan Harian" : "Daily Summary";
  const rows = isId
    ? [
        ["Order baru", String(data.totalOrders)],
        ["Dibayar (PAID)", String(data.paidOrders)],
        ["Menunggu (PENDING)", String(data.pendingOrders)],
        ["Dibatalkan", String(data.canceledOrders)],
        ["Pendapatan", formatRupiah(data.revenue)],
        ...(data.newUsers !== undefined
          ? [["User baru", String(data.newUsers)] as [string, string]]
          : []),
      ]
    : [
        ["New orders", String(data.totalOrders)],
        ["Paid", String(data.paidOrders)],
        ["Pending", String(data.pendingOrders)],
        ["Canceled", String(data.canceledOrders)],
        ["Revenue", formatRupiah(data.revenue)],
        ...(data.newUsers !== undefined
          ? [["New users", String(data.newUsers)] as [string, string]]
          : []),
      ];

  const bodyHtml = `<p style="margin:0 0 12px;">${formatDate(data.date)}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    ${rows
      .map(
        ([label, value]) => `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">${label}</td>
          <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${value}</td>
        </tr>`,
      )
      .join("")}
  </table>
  ${button(`${BASE_URL}/admin`, isId ? "Buka Dashboard" : "Open Dashboard")}`;

  return {
    subject: isId
      ? `[${BRAND}] Ringkasan harian — ${data.paidOrders} order dibayar, ${formatRupiah(data.revenue)}`
      : `[${BRAND}] Daily summary — ${data.paidOrders} paid orders, ${formatRupiah(data.revenue)}`,
    text: rows.map(([label, value]) => `${label}: ${value}`).join("\n"),
    html: emailLayout(title, bodyHtml),
  };
}
