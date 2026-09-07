"use client";

import { useState } from "react";
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatDate, formatRupiah } from "@/utils/format";
import { downloadInvoicePdf } from "@/helpers/invoicePdf";
import type { OrderRow } from "./index";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

/** Warna tag status pembayaran. */
const PAYMENT_TAG_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "orange",
  FAILED: "red",
  CANCELED: "default",
};

/** Warna titik timeline log per status tujuan transisi. */
const LOG_DOT_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "orange",
  FAILED: "red",
  CANCELED: "gray",
};

/** Judul seksi kecil drawer (label di atas tiap blok isi). */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography.Text
      type="secondary"
      className="mb-1! block! text-xs! font-semibold! uppercase"
    >
      {children}
    </Typography.Text>
  );
}

/**
 * Drawer detail pemesanan — dibuka saat row tabel pemesanan diklik.
 * Berisi detail order (+ item paket), detail pemesan, log transisi status
 * (OrderLog), QRIS tersimpan, dan tombol unduh invoice (PDF Midtrans).
 */
export default function OrderDetailDrawer({
  order,
  open,
  onClose,
}: {
  order: OrderRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const { notification } = App.useApp();
  const [downloading, setDownloading] = useState(false);

  /** Unduh invoice via endpoint admin (data Midtrans otoritatif). */
  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/invoice`);
      const result = await res.json();
      if (!result.success) {
        notification.error({
          title: t("notif.error"),
          description: t("notif.fetchFailed"),
          placement: "bottomRight",
        });
        return;
      }
      await downloadInvoicePdf(result.data, t, locale);
    } catch {
      notification.error({
        title: t("notif.error"),
        description: t("notif.fetchFailed"),
        placement: "bottomRight",
      });
    } finally {
      setDownloading(false);
    }
  };

  const statusTag = (status: PaymentStatus) => (
    <Tag color={PAYMENT_TAG_COLORS[status] ?? "default"}>
      {t(`payment.status.${status}`)}
    </Tag>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="min(92vw, 480px)"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t("admin.orders.detail")}
          {order && (
            <Typography.Text
              copyable
              className="font-mono text-xs! font-normal! text-foreground/60!"
            >
              {order.orderId}
            </Typography.Text>
          )}
        </span>
      }
      footer={
        <div className="flex justify-end">
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownloadInvoice}
          >
            {t("admin.orders.downloadInvoice")}
          </Button>
        </div>
      }
    >
      {order && (
        <div className="flex flex-col gap-6">
          {/* Detail pesanan: identitas, tanggal, status, total. */}
          <section>
            <SectionTitle>{t("admin.orders.detailOrder")}</SectionTitle>
            <Descriptions size="small" column={1} className="text-sm!">
              {/* <Descriptions.Item label={t("admin.orders.orderId")}>
                <Typography.Text copyable className="font-mono text-xs!">
                  {order.orderId}
                </Typography.Text>
              </Descriptions.Item> */}
              {order.transactionId && (
                <Descriptions.Item label={t("admin.orders.transactionId")}>
                  <Typography.Text className="font-mono text-xs!">
                    {order.transactionId}
                  </Typography.Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t("common.date")}>
                {formatDate(order.dateOrder, locale, true)}
              </Descriptions.Item>
              <Descriptions.Item label={t("common.status")}>
                {statusTag(order.paymentStatus)}
              </Descriptions.Item>
              <Descriptions.Item label={t("admin.orders.totalPrice")}>
                <span className="font-medium">
                  {formatRupiah(order.totalPrice)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            {/* Item paket: nama × qty + jadwal & info menginap per paket. */}
            <div className="mt-2 divide-y divide-black/5 dark:divide-white/10">
              {order.items.map((item, index) => {
                // Jadwal per paket; data lama (tanpa jadwal item) fallback
                // ke agregat order — cukup ditampilkan sekali di item pertama.
                const hasOwn = !!item.dateSchedule;
                const showSummary = hasOwn || index === 0;
                const date = hasOwn ? item.dateSchedule! : order.dateSchedule;
                const stay = hasOwn ? !!item.homestay : order.homestay;
                const stayDays = hasOwn
                  ? (item.homestayTime ?? 1)
                  : order.homestayTime;
                return (
                  <div
                    key={item.id}
                    className="flex justify-between gap-3 py-2 text-sm"
                  >
                    <span>
                      {item.package.name} × {item.quantity}
                      {showSummary && (
                        <span className="block text-[11px] text-foreground/50">
                          {formatDate(date, locale)}
                          {stay
                            ? ` — ${t("admin.orders.stay")}: ${t("common.yes")} (${stayDays})`
                            : ""}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0">{formatRupiah(item.price)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Detail pemesan. */}
          <section>
            <SectionTitle>{t("admin.orders.detailCustomer")}</SectionTitle>
            <Descriptions size="small" column={1} className="text-sm!">
              <Descriptions.Item label={t("common.name")}>
                {order.user.name}
              </Descriptions.Item>
              <Descriptions.Item label={t("common.email")}>
                {order.user.email}
              </Descriptions.Item>
              <Descriptions.Item label={t("common.phone")}>
                {order.user.phone || "—"}
              </Descriptions.Item>
            </Descriptions>
          </section>

          {/* Log pesanan: transisi status pembayaran (OrderLog). */}
          <section>
            <SectionTitle>{t("admin.orders.logTitle")}</SectionTitle>
            {order.logs.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-xs text-foreground/50">
                    {t("admin.orders.noLogs")}
                  </span>
                }
                className="my-4!"
              />
            ) : (
              <Timeline
                className="mt-3!"
                items={order.logs.map((log) => ({
                  color: LOG_DOT_COLORS[log.toStatus] ?? "gray",
                  content: (
                    <div key={log.id} className="flex flex-col">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {statusTag(log.fromStatus)}
                        <span className="text-xs text-foreground/50">→</span>
                        {statusTag(log.toStatus)}
                      </span>
                      <span className="text-xs text-foreground/50">
                        {formatDate(log.createdAt, locale, true)}
                      </span>
                    </div>
                  ),
                }))}
              />
            )}
          </section>

          {/* QRIS tersimpan saat order dibuat (Core API Midtrans). */}
          <section>
            <SectionTitle>{t("admin.orders.qrisTitle")}</SectionTitle>
            {order.qrisImageUrl ? (
              // Gambar QR dari host eksternal (Midtrans/CDN) — bukan aset
              // lokal yang bisa dioptimasi next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="QRIS"
                src={order.qrisImageUrl}
                className="w-40 rounded-lg border border-black/10 dark:border-white/15"
              />
            ) : (
              <div className="text-xs text-foreground/50">
                {t("admin.orders.qrisEmpty")}
              </div>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
