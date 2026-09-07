"use client";

import { useState } from "react";
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import { DownloadOutlined, QrcodeOutlined } from "@ant-design/icons";
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
 * Judul memuat tag status di kanan; isi: detail pesanan (order id,
 * deskripsi + daftar paket & total bergaya checkout), tab informasi
 * pemesan & log pesanan (OrderLog), tombol QRIS (lightbox Image antd,
 * pola lihat foto blog) + unduh invoice.
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
  /** QRIS yang sedang dipreview di lightbox (bukan ditampilkan inline). */
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);

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
      size="min(92vw, 600px)"
      title={
        <span className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <span className="font-semibold">{t("admin.orders.detail")}</span>
          {/* Status pembayaran di sisi kanan judul. */}
          {order && statusTag(order.paymentStatus)}
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          {/* QRIS: buka gambar di lightbox Image antd (pola lihat foto
              blog) — tidak ditampilkan di dalam drawer. */}
          <Tooltip
            title={order?.qrisImageUrl ? "" : t("admin.orders.qrisEmpty")}
          >
            <Button
              icon={<QrcodeOutlined />}
              disabled={!order?.qrisImageUrl}
              onClick={() => setQrisPreview(order?.qrisImageUrl ?? null)}
            >
              {t("admin.orders.qrisTitle")}
            </Button>
          </Tooltip>
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
          {/* Detail pesanan: identitas + tanggal (status di judul, total
              di daftar paket). */}
          <section>
            <SectionTitle>{t("admin.orders.detailOrder")}</SectionTitle>
            <Descriptions size="small" column={1} className="text-sm!">
              <Descriptions.Item
                label={t("admin.orders.orderId")}
                className="text-xs!"
              >
                <Typography.Text className="font-mono!">
                  {order.orderId}
                </Typography.Text>
              </Descriptions.Item>
              {order.transactionId && (
                <Descriptions.Item label={t("admin.orders.transactionId")}>
                  <Typography.Text className="font-mono!">
                    {order.transactionId}
                  </Typography.Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label={t("common.date")}>
                {formatDate(order.dateOrder, locale, true)}
              </Descriptions.Item>
            </Descriptions>

            {/* Daftar paket + total — pola halaman checkout (garis pemisah,
                harga per paket, total besar di bawah). */}
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
                  : (order.homestayTime ?? 1);
                return (
                  <div key={item.id} className="py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span>
                        {item.package.name} × {item.quantity}
                        {stay && stayDays > 1 && (
                          <span className="text-foreground/50">
                            {" "}
                            · {stayDays} {t("checkout.homestayDays")}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0">
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                    {showSummary && (
                      <p className="m-0! mt-1 text-foreground/60">
                        {t("checkout.scheduleDate")}:{" "}
                        <span className="font-medium text-primary">
                          {formatDate(date, locale)}
                        </span>
                        {stay && (
                          <>
                            {" — "}
                            {t("checkout.homestay")}:{" "}
                            <span className="font-medium text-primary">
                              {t("common.yes")} ({stayDays}{" "}
                              {t("checkout.homestayDays")})
                            </span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center justify-between py-2">
                <span className="font-medium">{t("cart.totalPrice")}</span>
                <span className="text-lg font-bold text-primary">
                  {formatRupiah(order.totalPrice)}
                </span>
              </div>
            </div>
          </section>

          {/* Tab informasi pemesan & log pesanan di bawah detail pesanan. */}
          <Tabs
            items={[
              {
                key: "customer",
                label: t("admin.orders.customerInfo"),
                children: (
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
                ),
              },
              {
                key: "logs",
                label: t("admin.orders.logTitle"),
                children:
                  order.logs.length === 0 ? (
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
                              <span className="text-xs text-foreground/50">
                                →
                              </span>
                              {statusTag(log.toStatus)}
                            </span>
                            <span className="text-xs text-foreground/50">
                              {formatDate(log.createdAt, locale, true)}
                            </span>
                          </div>
                        ),
                      }))}
                    />
                  ),
              },
            ]}
          />
        </div>
      )}
      {/* Preview QRIS langsung di lightbox Image antd (pola "lihat foto"
          menu blog) — bukan modal, bukan ditampilkan di dalam drawer. */}
      <Image
        src={qrisPreview ?? undefined}
        alt="QRIS"
        style={{ display: "none" }}
        preview={{
          open: qrisPreview !== null,
          src: qrisPreview ?? undefined,
          onOpenChange: (openState) => {
            if (!openState) setQrisPreview(null);
          },
        }}
      />
    </Drawer>
  );
}
