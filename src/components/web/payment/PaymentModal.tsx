"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Modal, Radio, Space, Tag } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CreditCardOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatDate, formatRupiah } from "@/utils/format";

export interface PaymentOrderInfo {
  orderId: number;
  totalPrice: number;
  /** Batas waktu pembayaran (ISO) — null bila tidak ada. */
  expiresAt?: string | null;
}

export interface PaymentOption {
  /** true = simulator lokal (Midtrans belum dikonfigurasi). */
  simulator: boolean;
  snapToken: string | null;
  snapRedirectUrl: string | null;
  /** URL snap.js + client key (diteruskan server, hanya relevan non-simulator). */
  snapScriptUrl?: string | null;
  clientKey?: string | null;
}

export type PaymentResult = "PAID" | "CANCELED" | "FAILED";

interface MidtransWindow {
  snap?: {
    pay: (
      token: string,
      callbacks: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (result: unknown) => void;
        onClose?: () => void;
      },
    ) => void;
  };
}

/** Status pemuatan snap.js (mode Midtrans). */
type SnapState = "loading" | "ready" | "error";

/** Opsi metode pembayaran simulator (meniru channel Midtrans sandbox). */
const SIMULATOR_METHODS = [
  { value: "qris", label: "QRIS" },
  { value: "bca_va", label: "Virtual Account BCA" },
  { value: "gopay", label: "GoPay" },
];

/**
 * Pembayaran pesanan (modal selalu terlihat):
 * - Midtrans terkonfigurasi → ringkasan + tombol yang MEMBUKA POPUP SNAP
 *   dari klik user (menghindari popup blocker). snap.js dimuat di latar
 *   saat modal dibuka; bila gagal, tampilkan fallback link redirect URL.
 * - Belum dikonfigurasi → simulator lokal dengan alur identik.
 */
export function PaymentModal({
  open,
  order,
  option,
  onClose,
  onSettled,
  onCheck,
}: {
  open: boolean;
  order: PaymentOrderInfo | null;
  option: PaymentOption | null;
  onClose: () => void;
  onSettled: (result: PaymentResult) => void;
  /** Periksa ulang status pembayaran (mis. setelah kembali dari tab Midtrans). */
  onCheck?: () => void;
}) {
  const { t, locale } = useT();
  const { message } = App.useApp();
  const [method, setMethod] = useState("qris");
  const [processing, setProcessing] = useState(false);
  const [snapState, setSnapState] = useState<SnapState>("loading");

  const confirmPay = useCallback(
    async (result: "PAID" | "CANCELED", payMethod?: string) => {
      if (!order) return;
      setProcessing(true);
      try {
        const res = await fetch(`/api/web/orders/${order.orderId}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result, method: payMethod ?? method }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        if (json.data.expired) {
          // Kedaluwarsa di tengah proses — anggap gagal, bukan lunas.
          message.warning(t("payment.expired"));
          onSettled("CANCELED");
          return;
        }
        onSettled(json.data.paymentStatus === "PAID" ? "PAID" : "CANCELED");
      } catch {
        message.error(t("payment.failed"));
        onSettled("FAILED");
      } finally {
        setProcessing(false);
      }
    },
    [order, method, message, t, onSettled],
  );

  // Muat snap.js di latar saat modal terbuka (mode Midtrans saja).
  // Reset status loading dilakukan saat modal ditutup (lihat handleClose)
  // agar tidak ada setState sinkron di body effect.
  useEffect(() => {
    if (!open || !option || option.simulator) {
      return;
    }

    let cancelled = false;
    const markReady = () => {
      if (!cancelled) setSnapState("ready");
    };

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-midtrans-snap]",
    );
    if (existing) {
      if ((window as unknown as MidtransWindow).snap) markReady();
      else {
        existing.addEventListener("load", markReady, { once: true });
        existing.addEventListener(
          "error",
          () => {
            if (!cancelled) setSnapState("error");
          },
          { once: true },
        );
        // Script lama yang menggantung tanpa event → anggap error.
        const guard = setTimeout(() => {
          if (!cancelled && !(window as unknown as MidtransWindow).snap) {
            setSnapState("error");
          }
        }, 10_000);
        return () => {
          cancelled = true;
          clearTimeout(guard);
        };
      }
      return;
    }

    const script = document.createElement("script");
    script.src = option.snapScriptUrl ?? "";
    script.setAttribute("data-midtrans-snap", "true");
    script.setAttribute("data-client-key", option.clientKey ?? "");
    script.onload = markReady;
    script.onerror = () => {
      if (!cancelled) setSnapState("error");
    };
    document.body.appendChild(script);
    return () => {
      cancelled = true;
    };
  }, [open, option]);

  // Popup Snap dibuka dari klik user — aman dari popup blocker.
  const payWithSnap = () => {
    const win = window as unknown as MidtransWindow;
    if (!win.snap || !option?.snapToken) {
      setSnapState("error");
      message.error(t("payment.failed"));
      return;
    }
    win.snap.pay(option.snapToken, {
      onSuccess: () => void confirmPay("PAID", "midtrans"),
      onPending: () => message.info(t("payment.status.PENDING")),
      onError: () => message.error(t("payment.failed")),
      onClose: () => message.info(t("payment.reopenHint")),
    });
  };

  /**
   * Jalur pembayaran utama — selalu berfungsi:
   * 1. snap.js siap → popup Snap (UX terbaik).
   * 2. snap.js gagal dimuat/belum siap → buka halaman pembayaran hosted
   *    Midtrans (snapRedirectUrl) di tab baru; TIDAK bergantung snap.js.
   */
  const startPayment = () => {
    if (snapState === "ready") {
      payWithSnap();
      return;
    }
    if (option?.snapRedirectUrl) {
      window.open(option.snapRedirectUrl, "_blank", "noopener,noreferrer");
      return;
    }
    message.error(t("payment.failed"));
  };

  if (!order || !option) return null;

  // Tutup modal + reset status pemuatan snap untuk pembukaan berikutnya.
  const handleClose = () => {
    setSnapState("loading");
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={() => handleClose()}
      footer={null}
      title={
        <Space>
          <CreditCardOutlined />
          {t("payment.title")}
        </Space>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/10">
          <span className="text-sm text-foreground/70">
            {t("checkout.orders")} #{order.orderId}
          </span>
          <Tag color="orange">{t("payment.status.PENDING")}</Tag>
        </div>

        {order.expiresAt && (
          <Alert
            type="warning"
            showIcon
            icon={<ClockCircleOutlined />}
            message={`${t("payment.deadline")}: ${formatDate(order.expiresAt, locale, true)}`}
          />
        )}

        <div className="flex items-center justify-between">
          <span className="font-medium">{t("cart.totalPrice")}</span>
          <span className="text-lg! font-bold! text-primary">
            {formatRupiah(order.totalPrice)}
          </span>
        </div>

        {option.simulator ? (
          <>
            <Alert type="info" showIcon message={t("payment.simulatorNote")} />
            <div>
              <p className="mb-2 text-sm font-medium">{t("payment.method")}</p>
              <Radio.Group
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="flex! flex-col! gap-2!"
              >
                {SIMULATOR_METHODS.map((m) => (
                  <Radio key={m.value} value={m.value}>
                    {m.label}
                  </Radio>
                ))}
              </Radio.Group>
            </div>
            <div className="flex gap-2">
              <Button block onClick={() => void confirmPay("CANCELED")}>
                {t("common.cancel")}
              </Button>
              <Button
                type="primary"
                block
                loading={processing}
                icon={<CheckCircleFilled />}
                onClick={() => void confirmPay("PAID")}
              >
                {t("payment.pay")}
              </Button>
            </div>
          </>
        ) : (
          <>
            {snapState === "error" && (
              <Alert type="info" showIcon message={t("payment.snapFallback")} />
            )}
            <Button
              type="primary"
              size="large"
              block
              icon={<CreditCardOutlined />}
              onClick={startPayment}
            >
              {t("payment.pay")}
            </Button>
            {option.snapRedirectUrl && (
              <Button
                block
                type="text"
                icon={<ExportOutlined />}
                href={option.snapRedirectUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("payment.openLink")}
              </Button>
            )}
            {onCheck && (
              <Button block type="dashed" onClick={onCheck}>
                {t("payment.checkStatus")}
              </Button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

export default PaymentModal;
