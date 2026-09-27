import { BASE_URL, NOTIFICATION_LOCALE } from "@/utils/config/variables";

/**
 * Template email transaksional (pola progress-self): HTML sederhana
 * inline-style agar aman untuk klien email, plus versi teks polos.
 * Bahasa mengikuti NOTIFICATION_LOCALE (server-side, id default).
 */

const BRAND = "DesakuWisataku";
const BRAND_PRIMARY = "#41644a";

/** Label singkat order (id legacy apa adanya, UUID dipendekkan 8 karakter). */
function orderRef(orderId: string): string {
  return orderId.includes("-") ? orderId.slice(0, 8) : orderId;
}

/** Data order yang dipakai semua template email order. */
export interface OrderEmailData {
  orderId: string;
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
        ${
          NOTIFICATION_LOCALE === "id"
            ? `Email otomatis dari ${BRAND} — tidak perlu dibalas.`
            : `Automated email from ${BRAND} — no reply needed.`
        }
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

function orderLink(orderId: string): { url: string; label: string } {
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

/** Data notifikasi ganti password (security notice). */
export interface PasswordChangedData {
  userName: string;
  email: string;
}

/**
 * Email pemberitahuan password berhasil diganti (dikirim setelah OTP
 * ganti password terverifikasi & semua sesi dicabut) — security notice
 * standar agar pemilik akun sadar bila perubahan tidak dikenal.
 */
export function passwordChangedEmail(
  data: PasswordChangedData,
): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const title = isId ? "Password Diganti" : "Password Changed";
  const greeting = isId
    ? `Halo ${data.userName}, password akun Anda (${data.email}) berhasil diganti.`
    : `Hello ${data.userName}, the password for your account (${data.email}) has been changed.`;
  const notice = isId
    ? `Semua sesi login telah dicabut — Anda perlu masuk kembali dengan password baru. Bila Anda TIDAK melakukan perubahan ini, segera atur ulang password melalui menu "Lupa Password".`
    : `All login sessions have been revoked — you need to sign in again with your new password. If you did NOT make this change, reset your password immediately via "Forgot Password".`;

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <p style="margin:0 0 4px;">${notice}</p>
    ${button(`${BASE_URL}/login`, isId ? "Masuk" : "Sign In")}`;

  const text = `${greeting}
${notice}
${BASE_URL}/login`;

  return {
    subject: isId
      ? `[${BRAND}] Password akun Anda telah diganti`
      : `[${BRAND}] Your password has been changed`,
    text,
    html: emailLayout(title, bodyHtml),
  };
}

/** Data welcome email (onboarding pasca verifikasi registrasi). */
export interface WelcomeEmailData {
  userName: string;
}

/**
 * Email selamat datang — dikirim SEKALI setelah OTP registrasi terverifikasi
 * (bukan saat akun dibuat): onboarding singkat + tautan ke halaman paket
 * (rekomendasi email: registrasi saat ini hanya mengirim OTP).
 */
export function welcomeEmail(data: WelcomeEmailData): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const title = isId ? "Selamat Datang" : "Welcome";
  const greeting = isId
    ? `Halo ${data.userName}, email Anda berhasil diverifikasi — selamat datang di ${BRAND}!`
    : `Hello ${data.userName}, your email is verified — welcome to ${BRAND}!`;

  const steps = isId
    ? [
        "Jelajahi tempat wisata dan paket wisata desa kami.",
        "Pesan paket favorit Anda dan bayar dengan QRIS.",
        "Terima e-tiket, invoice, dan pengingat jadwal otomatis.",
      ]
    : [
        "Explore our village places and travel packages.",
        "Book your favorite package and pay with QRIS.",
        "Receive your e-ticket, invoice, and trip reminders automatically.",
      ];
  const stepsHtml = steps
    .map(
      (step, i) =>
        `<li style="margin:4px 0;"><b>${i + 1}.</b> ${step}</li>`,
    )
    .join("");
  const cta = isId
    ? "Mulai petualangan Anda — lihat paket wisata kami:"
    : "Start your journey — check out our travel packages:";

  const bodyHtml = `
    <p style="margin:0 0 12px;">${greeting}</p>
    <ul style="margin:0 0 12px;padding-left:20px;">${stepsHtml}</ul>
    <p style="margin:0 0 4px;">${cta}</p>
    ${button(`${BASE_URL}/package`, isId ? "Lihat Paket Wisata" : "Browse Packages")}`;

  const text = `${greeting}
${steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}
${cta}
${BASE_URL}/package`;

  return {
    subject: isId
      ? `[${BRAND}] Selamat datang di ${BRAND}, ${data.userName}!`
      : `[${BRAND}] Welcome to ${BRAND}, ${data.userName}!`,
    text,
    html: emailLayout(title, bodyHtml),
  };
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
    <p style="margin:0 0 12px;color:#6b7280;">#${orderRef(order.orderId)}</p>
    ${itemsTable(order)}
    <p style="margin:16px 0 4px;">${deadline}</p>
    ${button(link.url, link.label)}`;

  const text = `${greeting} (#${orderRef(order.orderId)})
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
      ? `[${BRAND}] Pesanan #${orderRef(order.orderId)} menunggu pembayaran`
      : `[${BRAND}] Order #${orderRef(order.orderId)} awaiting payment`,
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
    ? `Halo ${order.userName}, pembayaran pesanan #${orderRef(order.orderId)} telah kami terima.`
    : `Hello ${order.userName}, we received your payment for order #${orderRef(order.orderId)}.`;
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
      ? `[${BRAND}] Pembayaran pesanan #${orderRef(order.orderId)} berhasil`
      : `[${BRAND}] Payment for order #${orderRef(order.orderId)} received`,
    text,
    html: emailLayout(title, bodyHtml),
  };
}

/** Email pesanan kedaluwarsa/dibatalkan (melewati batas pembayaran). */
export function orderCanceledEmail(order: OrderEmailData): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const title = isId ? "Pesanan Dibatalkan" : "Order Canceled";
  const greeting = isId
    ? `Halo ${order.userName}, pesanan #${orderRef(order.orderId)} dibatalkan karena melewati batas waktu pembayaran.`
    : `Hello ${order.userName}, order #${orderRef(order.orderId)} was canceled because the payment deadline passed.`;
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
      ? `[${BRAND}] Pesanan #${orderRef(order.orderId)} dibatalkan`
      : `[${BRAND}] Order #${orderRef(order.orderId)} canceled`,
    text,
    html: emailLayout(title, bodyHtml),
  };
}

/** Data pengingat jadwal (H-1 sebelum keberangkatan). */
export interface TripReminderData {
  orderId: string;
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
      ? `[${BRAND}] Jadwal wisata Anda besok (pesanan #${orderRef(data.orderId)})`
      : `[${BRAND}] Your trip is tomorrow (order #${orderRef(data.orderId)})`,
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

/** Data ringkasan mingguan untuk admin (tren vs minggu sebelumnya). */
export interface WeeklySummaryData {
  /** Awal periode (Senin, eksklusif-akhir Minggu). */
  startDate: Date;
  endDate: Date;
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  revenue: number;
  /** Pembeli unik yang membuat order di periode ini. */
  newBuyers: number;
  /** Angka minggu SEBELUMNYA — pembanding tren. */
  prev: {
    totalOrders: number;
    paidOrders: number;
    revenue: number;
  };
  /** Pendapatan per hari (7 baris, urut Senin→Minggu). */
  revenuePerDay: { date: Date; revenue: number; paidOrders: number }[];
  /** Paket terlaris periode ini (basis PAID, maks 5). */
  topPackages: { name: string; quantity: number; revenue: number }[];
}

/** Delta tren vs periode sebelumnya: teks + warna (hijau naik, merah turun). */
function trend(current: number, previous: number): { text: string; color: string } {
  const isId = NOTIFICATION_LOCALE === "id";
  if (previous === 0) {
    return current > 0
      ? { text: isId ? "baru" : "new", color: "#059669" }
      : { text: "—", color: "#6b7280" };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  return {
    text: `${up ? "▲" : "▼"} ${Math.abs(pct)}%`,
    color: up ? "#059669" : "#dc2626",
  };
}

/**
 * Email ringkasan MINGGUAN admin — lanjutan `dailySummaryEmail`, fokus TREN:
 * perbandingan vs minggu sebelumnya, pendapatan harian sepanjang minggu,
 * dan paket terlaris (rekomendasi email: tren, bukan hanya angka harian).
 */
export function weeklySummaryEmail(data: WeeklySummaryData): EmailContent {
  const isId = NOTIFICATION_LOCALE === "id";
  const title = isId ? "Ringkasan Mingguan" : "Weekly Summary";
  const period = isId
    ? `Minggu ${formatDate(data.startDate)} – ${formatDate(new Date(data.endDate.getTime() - 1))} (vs minggu sebelumnya)`
    : `Week of ${formatDate(data.startDate)} – ${formatDate(new Date(data.endDate.getTime() - 1))} (vs previous week)`;

  const ordersTrend = trend(data.totalOrders, data.prev.totalOrders);
  const paidTrend = trend(data.paidOrders, data.prev.paidOrders);
  const revenueTrend = trend(data.revenue, data.prev.revenue);

  const kpi = isId
    ? [
        ["Order baru", String(data.totalOrders), ordersTrend],
        ["Dibayar (PAID)", String(data.paidOrders), paidTrend],
        ["Menunggu (PENDING)", String(data.pendingOrders), { text: "—", color: "#6b7280" }],
        ["Dibatalkan", String(data.canceledOrders), { text: "—", color: "#6b7280" }],
        ["Pendapatan", formatRupiah(data.revenue), revenueTrend],
        ["Pembeli unik", String(data.newBuyers), { text: "—", color: "#6b7280" }],
      ] as [string, string, { text: string; color: string }][]
    : [
        ["New orders", String(data.totalOrders), ordersTrend],
        ["Paid", String(data.paidOrders), paidTrend],
        ["Pending", String(data.pendingOrders), { text: "—", color: "#6b7280" }],
        ["Canceled", String(data.canceledOrders), { text: "—", color: "#6b7280" }],
        ["Revenue", formatRupiah(data.revenue), revenueTrend],
        ["Unique buyers", String(data.newBuyers), { text: "—", color: "#6b7280" }],
      ] as [string, string, { text: string; color: string }][];

  const kpiRows = kpi
    .map(
      ([label, value, t]) => `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;">${label}</td>
        <td style="padding:6px 0;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:bold;">${value}</td>
        <td style="padding:6px 0 6px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${t.color};font-size:12px;white-space:nowrap;">${t.text}</td>
      </tr>`,
    )
    .join("");

  const dayLabels = isId
    ? ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const barMax = Math.max(1, ...data.revenuePerDay.map((d) => d.revenue));
  const dailyRows = data.revenuePerDay
    .map((d) => {
      const dayIdx = (new Date(d.date).getDay() + 6) % 7;
      const width = Math.round((d.revenue / barMax) * 100);
      return `<tr>
        <td style="padding:3px 8px 3px 0;color:#6b7280;font-size:13px;">${dayLabels[dayIdx]}</td>
        <td style="padding:3px 0;">
          <div style="background:${BRAND_PRIMARY};border-radius:4px;height:12px;width:${Math.max(width, d.revenue > 0 ? 4 : 0)}%;"></div>
        </td>
        <td style="padding:3px 0 3px 12px;text-align:right;font-size:13px;white-space:nowrap;">${formatRupiah(d.revenue)} · ${d.paidOrders}</td>
      </tr>`;
    })
    .join("");

  const topPkgs = data.topPackages.length
    ? data.topPackages
        .map(
          (p, i) => `<li style="margin:4px 0;"><b>${i + 1}. ${p.name}</b> — ${isId ? "terjual" : "sold"} ${p.quantity}× · ${formatRupiah(p.revenue)}</li>`,
        )
        .join("")
    : `<li style="margin:4px 0;color:#6b7280;">${isId ? "Belum ada paket terjual minggu ini." : "No packages sold this week."}</li>`;

  const dailyTitle = isId ? "Pendapatan harian (PAID)" : "Daily revenue (PAID)";
  const topTitle = isId ? "Paket terlaris" : "Top packages";

  const bodyHtml = `
    <p style="margin:0 0 12px;">${period}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${kpiRows}</table>
    <h3 style="margin:20px 0 8px;font-size:15px;color:${BRAND_PRIMARY};">${dailyTitle}</h3>
    <table style="width:100%;border-collapse:collapse;">${dailyRows}</table>
    <h3 style="margin:20px 0 8px;font-size:15px;color:${BRAND_PRIMARY};">${topTitle}</h3>
    <ul style="margin:0 0 8px;padding-left:20px;font-size:14px;">${topPkgs}</ul>
    ${button(`${BASE_URL}/admin`, isId ? "Buka Dashboard" : "Open Dashboard")}`;

  const text = `${period}
${kpi.map(([label, value, t]) => `${label}: ${value} (${t.text})`).join("\n")}
${dailyTitle}:
${data.revenuePerDay
  .map(
    (d) =>
      `- ${formatDate(d.date)}: ${formatRupiah(d.revenue)} · ${d.paidOrders}`,
  )
  .join("\n")}
${topTitle}:
${data.topPackages.map((p) => `- ${p.name}: ${p.quantity}× · ${formatRupiah(p.revenue)}`).join("\n")}`;

  return {
    subject: isId
      ? `[${BRAND}] Ringkasan mingguan — ${data.paidOrders} order dibayar, ${formatRupiah(data.revenue)} (${revenueTrend.text} vs minggu lalu)`
      : `[${BRAND}] Weekly summary — ${data.paidOrders} paid orders, ${formatRupiah(data.revenue)} (${revenueTrend.text} vs last week)`,
    text,
    html: emailLayout(title, bodyHtml),
  };
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
