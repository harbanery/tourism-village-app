"use client";

import { useRouter } from "next/navigation";
import { useMounted } from "@/helpers/useMounted";
import { App, Button, Card, List, Tag } from "antd";
import {
  CreditCardOutlined,
  DownloadOutlined,
  FieldTimeOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatDate, formatRupiah } from "@/utils/format";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

export interface HistoryOrder {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string | null;
  dateOrder: string;
  dateSchedule: string;
  homestay: "yes" | "no";
  homestayTime: number | null;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  /** Batas waktu pembayaran (ISO) — hanya relevan untuk PENDING. */
  paymentExpiresAt?: string | null;
  items: { id: number; packageName: string; quantity: number; price: number }[];
}

/** Warna tag status pembayaran. */
const PAYMENT_TAG_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "orange",
  FAILED: "red",
  CANCELED: "default",
};

/** Tambah n hari ke tanggal ISO (untuk tanggal pulang menginap). */
function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function OrderHistorySection({ orders }: { orders: HistoryOrder[] }) {
  const { t, locale } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();
  if (!mounted) return null;

  /** Unduh bukti pembayaran (invoice Midtrans + data order). */
  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const res = await fetch(`/api/web/orders/${orderId}/invoice`);
      const result = await res.json();
      if (!result.success) {
        message.error(t("notif.fetchFailed"));
        return;
      }
      const data = result.data;

      // Rakit invoice HTML sederhana (self-contained, siap print ke PDF).
      const rows = data.items
        .map(
          (item: {
            id: number;
            packageName: string;
            quantity: number;
            price: number;
          }) => `
            <tr>
              <td>${item.packageName}</td>
              <td style="text-align:center">${item.quantity}</td>
              <td style="text-align:right">${formatRupiah(item.price)}</td>
            </tr>`,
        )
        .join("");

      // Bagian kondisional dirakit terpisah agar template utama datar.
      const statusDetail = data.midtrans
        ? " &middot; " +
          String(data.midtrans.paymentType ?? "qris").toUpperCase() +
          " (Midtrans: " +
          data.midtrans.transactionStatus +
          ")"
        : "";
      const homestayDetail = data.homestay
        ? " &mdash; " +
          t("checkout.homestay") +
          ": " +
          t("common.yes") +
          " (" +
          data.homestayTime +
          " " +
          t("checkout.homestayDays") +
          ", " +
          t("checkout.returnDate") +
          ": " +
          formatDate(
            addDays(data.dateSchedule, data.homestayTime ?? 1),
            locale,
          ) +
          ")"
        : "";
      const paidLine = data.paidAt
        ? "<p><b>" +
          t("profile.paidAt") +
          ":</b> " +
          formatDate(data.paidAt, locale, true) +
          "</p>"
        : "";

      const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${data.midtransOrderId}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1f2933; margin: 32px; }
    h1 { color: #0d7a5f; margin-bottom: 0; }
    .muted { color: #52606d; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border-bottom: 1px solid #e5e9ec; padding: 8px 6px; font-size: 14px; }
    th { text-align: left; background: #f0faf7; }
    .total td { font-weight: bold; border-top: 2px solid #0d7a5f; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #f0faf7; color: #0d7a5f; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Desaku Wisataku</h1>
  <p class="muted">Bukti Pembayaran / Payment Receipt</p>
  <hr />
  <p><b>Order:</b> #${data.orderId} &middot; Midtrans: ${data.midtransOrderId}</p>
  <p><b>Status:</b> <span class="badge">${data.paymentStatus}</span>${statusDetail}</p>
  <p><b>Pemesan:</b> ${data.customer.name} (${data.customer.email})</p>
  <p><b>${t("profile.orderDate")}:</b> ${formatDate(data.dateOrder, locale, true)}</p>
  <p><b>${t("profile.departureDate")}:</b> ${formatDate(data.dateSchedule, locale)}${homestayDetail}</p>
  ${paidLine}
  <table>
    <thead>
      <tr><th>${t("cart.package")}</th><th style="text-align:center">${t("cart.qty")}</th><th style="text-align:right">${t("cart.price")}</th></tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total">
        <td colspan="2">${t("cart.totalPrice")}</td>
        <td style="text-align:right">${formatRupiah(data.totalPrice)}</td>
      </tr>
    </tbody>
  </table>
  <p class="muted" style="margin-top:24px">Powered by Midtrans QRIS</p>
</body>
</html>`;

      // Unduh sebagai file HTML (buka di browser → print/save PDF).
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${data.midtransOrderId}.html`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      message.error(t("notif.error"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">{t("profile.orderHistory")}</h2>
      {orders.length === 0 ? (
        <Card className="mt-6!">
          <p className="text-foreground/60">{t("profile.noOrders")}</p>
        </Card>
      ) : (
        <List
          className="mt-6"
          grid={{ gutter: 24, xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
          dataSource={orders}
          renderItem={(order) => (
            <List.Item>
              <Card
                title={`${t("common.total")}: ${formatRupiah(order.totalPrice)}`}
                extra={
                  <Tag color={PAYMENT_TAG_COLORS[order.paymentStatus]}>
                    {t(`payment.status.${order.paymentStatus}`)}
                  </Tag>
                }
              >
                {/* Ringkasan tanggal-tanggal penting pesanan. */}
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-foreground/70">
                    <CalendarOutlined className="text-foreground/40" />
                    <span>
                      <span className="text-foreground/50">
                        {t("profile.orderDate")}:
                      </span>{" "}
                      {formatDate(order.dateOrder, locale, true)}
                    </span>
                  </p>
                  {order.paymentStatus === "PENDING" &&
                  order.paymentExpiresAt ? (
                    <p className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <FieldTimeOutlined />
                      <span>
                        {t("payment.deadline")}:{" "}
                        {formatDate(order.paymentExpiresAt, locale, true)}
                      </span>
                    </p>
                  ) : null}
                  <p className="flex items-center gap-2 text-foreground/70">
                    <CalendarOutlined className="text-foreground/40" />
                    <span>
                      <span className="text-foreground/50">
                        {t("profile.departureDate")}:
                      </span>{" "}
                      {formatDate(order.dateSchedule, locale)}
                    </span>
                  </p>
                  <p className="flex items-center gap-2 text-foreground/70">
                    <HomeOutlined className="text-foreground/40" />
                    <span>
                      <span className="text-foreground/50">
                        {t("checkout.homestay")}:
                      </span>{" "}
                      {order.homestay === "yes"
                        ? `${t("common.yes")} — ${order.homestayTime} ${t(
                            "checkout.homestayDays",
                          )} (${t("checkout.returnDate")}: ${formatDate(
                            addDays(
                              order.dateSchedule,
                              order.homestayTime ?? 1,
                            ),
                            locale,
                          )})`
                        : t("common.no")}
                    </span>
                  </p>
                </div>

                {/* List wisata: paket, kuantitas, harga — rapi per baris. */}
                <div className="mt-4 rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-black/[0.03] dark:bg-white/[0.04] px-4 py-2 text-xs font-semibold text-foreground/60">
                    <span>{t("cart.package")}</span>
                    <span className="w-14 text-center">{t("cart.qty")}</span>
                    <span className="w-24 text-right">{t("cart.price")}</span>
                  </div>
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-2.5 text-sm border-t border-black/5 dark:border-white/5"
                    >
                      <span className="font-medium">{item.packageName}</span>
                      <span className="w-14 text-center">
                        × {item.quantity}
                      </span>
                      <span className="w-24 text-right">
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_auto] gap-3 px-4 py-2.5 text-sm border-t border-black/10 dark:border-white/10 font-semibold">
                    <span>{t("cart.totalPrice")}</span>
                    <span className="text-primary">
                      {formatRupiah(order.totalPrice)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.paymentStatus === "PENDING" ? (
                    <Button
                      type="primary"
                      icon={<CreditCardOutlined />}
                      onClick={() => router.push(`/payment/${order.id}`)}
                    >
                      {t("payment.pay")}
                    </Button>
                  ) : order.paymentStatus === "PAID" ? (
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadInvoice(order.id)}
                    >
                      {t("profile.downloadReceipt")}
                    </Button>
                  ) : null}
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
