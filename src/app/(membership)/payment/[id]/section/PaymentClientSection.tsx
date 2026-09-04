"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { Alert, App, Button, Card, Result, Spin, Tag } from "antd";
import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
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
  items: {
    id: number;
    packageName: string;
    quantity: number;
    price: number;
    /** Jadwal per paket — null untuk data lama (fallback agregat order). */
    dateSchedule: string | null;
    homestay: boolean;
    homestayTime: number | null;
  }[];
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
 * Card countdown pembayaran — bg gradient dari default (netral) ke primary.
 * Kiri: tanggal batas pembayaran; kanan: sisa waktu --:--:--.
 * Dipasang di antara judul halaman dan card pembayaran.
 */
function PaymentCountdown({
  expiresAt,
  expired,
}: {
  expiresAt: string | null;
  expired: boolean;
}) {
  const { t, locale } = useT();
  const [remaining, setRemaining] = useState<number | null>(null);

  // Tick tiap detik: hitung sisa waktu dari deadline.
  useEffect(() => {
    if (!expiresAt) return;
    const deadline = new Date(expiresAt).getTime();
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const totalSeconds = remaining === null ? null : Math.floor(remaining / 1000);
  const hh =
    totalSeconds === null
      ? "--"
      : String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm =
    totalSeconds === null
      ? "--"
      : String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss =
    totalSeconds === null ? "--" : String(totalSeconds % 60).padStart(2, "0");
  const timeText = `${hh}:${mm}:${ss}`;
  const isUrgent = totalSeconds !== null && totalSeconds <= 60; // ≤ 1 menit

  return (
    <div
      className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-black/5 p-4 text-white dark:border-white/10"
      style={{
        background:
          "linear-gradient(135deg, #52525b 0%, var(--ant-color-primary, #0d7a5f) 100%)",
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <CalendarOutlined className="shrink-0 text-xl opacity-90" />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide opacity-80">
            {t("payment.countdown.deadline")}
          </p>
          <p className="truncate text-sm font-semibold">
            {expiresAt ? formatDate(expiresAt, locale, true) : "-"}
          </p>
        </div>
      </div>
      <div className="flex flex-row-reverse shrink-0 items-center gap-3">
        <ClockCircleOutlined className="text-xl opacity-90" />
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide opacity-80">
            {t("payment.countdown.timeout")}
          </p>
          <p
            className={`font-mono text-sm font-bold tabular-nums ${
              expired ? "animate-pulse" : isUrgent ? "text-amber-300" : ""
            }`}
          >
            {expired ? "00:00:00" : timeText}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Logo QRIS dari aset partner (/public/images/partners) — selalu diberi
 * latar terang agar terlihat jelas di dark mode.
 */
function QrisLogo({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-white px-1.5 py-0.5 shadow-sm ${className ?? ""}`}
    >
      {/* SVG lokal → unoptimized (image optimizer Next menolak .svg). */}
      <Image
        src="/images/partners/qris.svg"
        alt="QRIS"
        width={48}
        height={18}
        unoptimized
      />
    </span>
  );
}

/** Wordmark Midtrans dari aset partner (/public/images/partners). */
function MidtransLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/images/partners/Midtrans.png"
      alt="Midtrans"
      width={83}
      height={16}
      className={className}
    />
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

      {/* Countdown batas pembayaran: deadline (kiri) + sisa waktu (kanan). */}
      <PaymentCountdown expiresAt={expiresAt} expired={expired} />

      <Card className="mt-4!">
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
            <div key={item.id} className="py-2 text-sm">
              <div className="flex justify-between">
                <span>
                  {item.packageName} × {item.quantity}
                </span>
                <span>{formatRupiah(item.price)}</span>
              </div>
              {/* Jadwal per paket (fallback agregat order untuk data lama). */}
              <p className="mt-1 text-foreground/60">
                {t("profile.departureDate")}:{" "}
                {formatDate(item.dateSchedule ?? order.dateSchedule, locale)}
                {item.homestay
                  ? ` — ${t("checkout.homestay")}: ${t("common.yes")} (${item.homestayTime} ${t("checkout.homestayDays")})`
                  : ""}
              </p>
            </div>
          ))}
        </div>

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
