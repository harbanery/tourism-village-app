"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Alert, App, Button, Card, Result, Spin, Tag } from "antd";
import {
  CheckCircleFilled,
  LoadingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { formatRupiah, formatDate } from "@/utils/format";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

interface PaymentOrder {
  id: number;
  dateSchedule: string;
  homestay: boolean;
  homestayTime: number | null;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  items: { id: number; packageName: string; quantity: number; price: number }[];
}

interface QrisInfo {
  qrString: string;
  qrImageUrl: string | null;
}

interface PaymentOption {
  qris?: QrisInfo | null;
}

const PAYMENT_TAG_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "orange",
  FAILED: "red",
  CANCELED: "default",
};

/** Interval auto-poll status (ms) selama menampilkan QR. */
const POLL_INTERVAL_MS = 10_000;

/**
 * Logo QRIS sederhana (inline SVG) — selalu diberi latar terang agar
 * terlihat jelas di dark mode.
 */
function QrisLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-white px-1.5 py-0.5 shadow-sm ${className ?? ""}`}
    >
      <svg width="52" height="18" viewBox="0 0 52 18" role="img" aria-label="QRIS">
        <rect x="0" y="1" width="6" height="6" fill="#0B2C4D" />
        <rect x="1.5" y="2.5" width="3" height="3" fill="#ffffff" />
        <rect x="0" y="11" width="6" height="6" fill="#ED1164" />
        <rect x="8" y="1" width="2" height="16" fill="#0B2C4D" />
        <text
          x="12"
          y="8.5"
          fontFamily="Arial, sans-serif"
          fontSize="7.5"
          fontWeight="700"
          fill="#0B2C4D"
          letterSpacing="0.5"
        >
          QRIS
        </text>
        <rect x="12" y="10.5" width="34" height="2" fill="#ED1164" />
        <text
          x="12"
          y="16.5"
          fontFamily="Arial, sans-serif"
          fontSize="3.2"
          fill="#0B2C4D"
          letterSpacing="0.4"
        >
          BANK INDONESIA
        </text>
      </svg>
    </span>
  );
}

/** Wordmark Midtrans (inline SVG). */
function MidtransLogo({ className }: { className?: string }) {
  return (
    <svg
      width="84"
      height="16"
      viewBox="0 0 84 16"
      role="img"
      aria-label="Midtrans"
      className={className}
    >
      <text
        x="0"
        y="12"
        fontFamily="Arial, sans-serif"
        fontSize="13"
        fontWeight="600"
        fill="currentColor"
        letterSpacing="-0.3"
      >
        midtrans
      </text>
    </svg>
  );
}

/**
 * Halaman transaksi pembayaran order (target setelah checkout).
 *
 * QRIS POS integration (Midtrans Core API): QR ditampilkan langsung di
 * halaman — pindai dengan e-wallet/m-banking; status dicek otomatis
 * berkala ke API Midtrans lewat /api/web/orders/[id]/status dan diperbarui
 * oleh webhook /api/web/orders/notification.
 */
export default function PaymentClientSection({
  order,
}: {
  order: PaymentOrder;
}) {
  const { t, locale } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { notification } = App.useApp();

  const [status, setStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [option, setOption] = useState<PaymentOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Ambil opsi pembayaran (membuat QR QRIS bila belum ada).
  const loadOption = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/web/orders/${order.id}/pay`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      if (json.data.paymentExpiresAt) setExpiresAt(json.data.paymentExpiresAt);
      if (json.data.expired) {
        setExpired(true);
        setStatus(json.data.paymentStatus);
        return;
      }
      if (json.data.payment) {
        setOption(json.data.payment);
      } else {
        setStatus(json.data.paymentStatus);
      }
    } catch {
      notification.error({
        title: t("notif.error"),
        description: t("notif.fetchFailed"),
        placement: "bottomRight",
      });
    } finally {
      setLoading(false);
    }
  }, [order.id, notification, t]);

  useEffect(() => {
    void Promise.resolve().then(loadOption);
  }, [loadOption]);

  /** Periksa status: konfirmasi ke API Midtrans lewat server. */
  const handleCheck = useCallback(
    async (silent = false) => {
      if (!silent) setChecking(true);
      try {
        const res = await fetch(`/api/web/orders/${order.id}/status`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        if (json.data.paymentStatus !== "PENDING") {
          setStatus(json.data.paymentStatus);
          if (json.data.paymentStatus === "PAID") {
            notification.success({
              title: t("notif.success"),
              description: t("payment.success"),
              placement: "bottomRight",
            });
          }
        } else if (!silent) {
          notification.info({
            title: t("payment.status.PENDING"),
            description: t("payment.pendingHint"),
            placement: "bottomRight",
          });
        }
      } catch {
        if (!silent) {
          notification.error({
            title: t("notif.error"),
            description: t("notif.fetchFailed"),
            placement: "bottomRight",
          });
        }
      } finally {
        if (!silent) setChecking(false);
      }
    },
    [order.id, notification, t],
  );

  // Auto-poll ringan selama QR ditampilkan dan status masih PENDING.
  useEffect(() => {
    if (statusRef.current !== "PENDING" || !option?.qris) return;
    const timer = setInterval(() => {
      if (statusRef.current === "PENDING") {
        void handleCheck(true);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [option, handleCheck]);

  // Pembayaran berhasil → langsung diarahkan ke halaman review-confirm.
  useEffect(() => {
    if (status === "PAID") {
      router.replace("/review-confirm");
    }
  }, [status, router]);

  if (!mounted) return null;

  // Status final: bukan lagi halaman pembayaran.
  if (status !== "PENDING") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Result
          status={status === "PAID" ? "success" : "warning"}
          icon={
            status === "PAID" ? (
              <CheckCircleFilled className="text-primary!" />
            ) : undefined
          }
          title={
            status === "PAID"
              ? t("payment.success")
              : t(`payment.status.${status}`)
          }
          subTitle={expired ? t("payment.expired") : t("success.message")}
          extra={
            <Button type="primary" onClick={() => router.push("/profile")}>
              {t("success.goToProfile")}
            </Button>
          }
        />
      </div>
    );
  }

  const qris = option?.qris ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("payment.title")}</h1>

      <Card className="mt-6!">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {t("checkout.orders")} #{order.id}
          </span>
          <Tag color={PAYMENT_TAG_COLORS[status]}>
            {t(`payment.status.${status}`)}
          </Tag>
        </div>

        <div className="mt-4 divide-y divide-black/5 dark:divide-white/10">
          {order.items.map((item) => (
            <div key={item.id} className="py-2 flex justify-between text-sm">
              <span>
                {item.packageName} × {item.quantity}
              </span>
              <span>{formatRupiah(item.price)}</span>
            </div>
          ))}
        </div>

        <p className="mt-2 text-sm text-foreground/70">
          {t("profile.departureDate")}: {formatDate(order.dateSchedule, locale)}
          {order.homestay
            ? ` — ${t("checkout.homestay")}: ${t("common.yes")} (${order.homestayTime} ${t("checkout.homestayDays")})`
            : ""}
        </p>

        {expiresAt && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            {t("payment.deadline")}: {formatDate(expiresAt, locale, true)}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="font-medium">{t("cart.totalPrice")}</span>
          <span className="text-lg font-bold text-primary">
            {formatRupiah(order.totalPrice)}
          </span>
        </div>

        {loading ? (
          <div className="mt-6 flex justify-center">
            <Spin indicator={<LoadingOutlined spin />} />
          </div>
        ) : qris ? (
          // --- QRIS POS: QR tampil langsung di halaman ---
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
              {t("payment.qrisTitle")}
              <QrisLogo />
            </p>
            <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10">
              {qris.qrImageUrl ? (
                // URL gambar QR resmi dari Midtrans bila tersedia.
                <Image
                  src={qris.qrImageUrl}
                  alt={`QRIS ${order.id}`}
                  width={220}
                  height={220}
                  unoptimized
                />
              ) : (
                // Render sendiri dari payload QRIS (tanpa pihak ketiga).
                <QRCodeSVG value={qris.qrString} size={220} />
              )}
            </div>
            <p className="max-w-md text-center text-xs text-foreground/60">
              {t("payment.qrisHint")}
            </p>
            <Button
              block
              icon={<SearchOutlined />}
              loading={checking}
              onClick={() => void handleCheck()}
            >
              {t("payment.checkStatus")}
            </Button>
          </div>
        ) : (
          // Midtrans tidak dikonfigurasi / charge gagal.
          <Alert
            className="mt-6!"
            type="error"
            showIcon
            message={t("payment.unavailable")}
          />
        )}

        {/* Tanda tangan pembayaran di paling bawah kartu. */}
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-black/5 pt-4 text-xs text-foreground/50 dark:border-white/10">
          <span>{t("payment.supportedBy")}</span>
          <MidtransLogo />
        </div>
      </Card>
    </div>
  );
}
