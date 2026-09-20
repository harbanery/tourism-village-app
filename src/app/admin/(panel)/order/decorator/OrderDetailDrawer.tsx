"use client";

import { useState } from "react";
import {
  App,
  Button,
  Drawer,
  Empty,
  Image,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  MailOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import {
  formatDate,
  formatRupiah,
  maskEmail,
  maskPhone,
} from "@/utils/helpers";
import { downloadInvoicePdf } from "@/utils/pdf/invoicePdf";
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
 * Baris info ala ProfileInfoSection — label di kiri (foreground/60),
 * value rata kanan (font-medium) dengan garis pemisah antar-baris.
 */
function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-foreground/60">{label}</span>
      <span className="min-w-0 text-right font-medium break-words">
        {children}
      </span>
    </div>
  );
}

/**
 * Drawer detail pemesanan — dibuka saat row tabel pemesanan diklik.
 * Judul memuat tag status di kanan; isi: detail pesanan (order id,
 * deskripsi + daftar paket & total bergaya checkout), tab informasi
 * pemesan & log pesanan (OrderLog). Opsi di footer hanya: tombol QRIS
 * (lightbox Image antd, pola lihat foto blog), kirim ulang email
 * invoice/receipt (disembunyikan — bukan disabled — saat order
 * dibatalkan/gagal karena hanya relevan untuk PENDING/PAID), dan unduh
 * invoice. Aksi batalkan order & sinkron status Midtrans ada di kolom
 * opsi tabel (khusus MASTER).
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
  const [resending, setResending] = useState(false);
  /** QRIS yang sedang dipreview di lightbox (bukan ditampilkan inline). */
  const [qrisPreview, setQrisPreview] = useState<string | null>(null);

  /**
   * Kirim ulang email hanya relevan untuk order PENDING (invoice) /
   * PAID (receipt) — untuk status lain tombolnya tidak dimunculkan
   * (bukan disabled).
   */
  const canResend =
    order?.paymentStatus === "PENDING" || order?.paymentStatus === "PAID";

  /** Pesan error standar untuk aksi drawer (kode error API → locale). */
  const actionError = (error: unknown): string => {
    switch (error) {
      case "INVALID_STATUS":
        return t("admin.orders.resendInvalidStatus");
      case "EMAIL_UNAVAILABLE":
        return t("admin.orders.emailUnavailable");
      default:
        return t("notif.fetchFailed");
    }
  };

  const notifyError = (description: string) =>
    notification.error({
      title: t("notif.error"),
      description,
      placement: "bottomRight",
    });

  /** Unduh invoice via endpoint admin (data Midtrans otoritatif). */
  const handleDownloadInvoice = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/invoice`);
      const result = await res.json();
      if (!result.success) {
        notifyError(t("notif.fetchFailed"));
        return;
      }
      await downloadInvoicePdf(result.data, t, locale);
    } catch {
      notifyError(t("notif.fetchFailed"));
    } finally {
      setDownloading(false);
    }
  };

  /** Kirim ulang email invoice (PENDING) / receipt (PAID) ke pemesan. */
  const handleResend = async () => {
    if (!order) return;
    setResending(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/resend-email`, {
        method: "POST",
      });
      const result = await res.json();
      if (!result.success) {
        notifyError(actionError(result.error));
        return;
      }
      notification.success({
        title: t("notif.success"),
        description: t("admin.orders.resendSuccess", {
          email: maskEmail(result.data.recipient as string),
        }),
        placement: "bottomRight",
      });
    } catch {
      notifyError(t("admin.orders.resendFailed"));
    } finally {
      setResending(false);
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
        <div className="flex flex-wrap justify-end gap-2">
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
          {/* Kirim ulang email invoice (PENDING) / receipt (PAID) —
              disembunyikan (bukan disabled) saat dibatalkan/gagal. */}
          {canResend && (
            <Button
              icon={<MailOutlined />}
              loading={resending}
              onClick={handleResend}
            >
              {t("admin.orders.resendEmail")}
            </Button>
          )}
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
              di daftar paket) — value rata kanan ala profile info. */}
          <section>
            <SectionTitle>{t("admin.orders.detailOrder")}</SectionTitle>
            <div className="divide-y divide-black/5 dark:divide-white/10">
              <InfoRow label={t("admin.orders.orderId")}>
                <span className="font-mono">{order.orderId}</span>
              </InfoRow>
              {order.transactionId && (
                <InfoRow label={t("admin.orders.transactionId")}>
                  <span className="font-mono">{order.transactionId}</span>
                </InfoRow>
              )}
              <InfoRow label={t("common.date")}>
                {formatDate(order.dateOrder, locale, true)}
              </InfoRow>
            </div>

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
                  <div className="divide-y divide-black/5 dark:divide-white/10">
                    <InfoRow label={t("common.name")}>
                      {order.user.name}
                    </InfoRow>
                    <InfoRow label={t("common.email")}>
                      {maskEmail(order.user.email)}
                    </InfoRow>
                    <InfoRow label={t("common.phone")}>
                      {order.user.phone ? maskPhone(order.user.phone) : "—"}
                    </InfoRow>
                  </div>
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
                          // Tags di kiri, tanggal transisi di kanannya.
                          <div
                            key={log.id}
                            className="flex flex-wrap items-center justify-between gap-2"
                          >
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
