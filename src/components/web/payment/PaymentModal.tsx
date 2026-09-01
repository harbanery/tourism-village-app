"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, App, Button, Modal, Radio, Space, Tag } from "antd";
import {
  CheckCircleFilled,
  CreditCardOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { formatRupiah } from "@/utils/format";

export interface PaymentOrderInfo {
  orderId: number;
  totalPrice: number;
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

/** Opsi metode pembayaran simulator (meniru channel Midtrans sandbox). */
const SIMULATOR_METHODS = [
  { value: "qris", label: "QRIS" },
  { value: "bca_va", label: "Virtual Account BCA" },
  { value: "gopay", label: "GoPay" },
];

/**
 * Pembayaran pesanan:
 * - Midtrans terkonfigurasi → buka popup Snap (sandbox/production).
 * - Belum dikonfigurasi → modal simulator lokal dengan alur identik
 *   (pilih metode → bayar/batal → status order terbarui di DB).
 */
export function PaymentModal({
  open,
  order,
  option,
  onClose,
  onSettled,
}: {
  open: boolean;
  order: PaymentOrderInfo | null;
  option: PaymentOption | null;
  onClose: () => void;
  onSettled: (result: PaymentResult) => void;
}) {
  const { t } = useT();
  const { message } = App.useApp();
  const [method, setMethod] = useState("qris");
  const [processing, setProcessing] = useState(false);

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

  // Mode Midtrans asli: muat snap.js lalu buka popup Snap.
  useEffect(() => {
    if (!open || !order || !option || option.simulator || !option.snapToken) {
      return;
    }

    const startSnap = () => {
      const win = window as unknown as MidtransWindow;
      win.snap?.pay(option.snapToken!, {
        onSuccess: () => void confirmPay("PAID", "midtrans"),
        onPending: () => message.info(t("payment.status.PENDING")),
        onError: () => onSettled("FAILED"),
        onClose: () => onClose(),
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-midtrans-snap]",
    );
    if (existing) {
      startSnap();
      return;
    }
    const script = document.createElement("script");
    script.src = option.snapScriptUrl ?? "";
    script.setAttribute("data-midtrans-snap", "true");
    script.setAttribute("data-client-key", option.clientKey ?? "");
    script.onload = startSnap;
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order, option]);

  if (!order || !option) return null;

  // Popup Snap menangani pembayaran; modal lokal tidak dirender.
  if (!option.simulator) return null;

  return (
    <Modal
      open={open}
      onCancel={() => onClose()}
      footer={null}
      title={
        <Space>
          <CreditCardOutlined />
          {t("payment.title")}
        </Space>
      }
    >
      <div className="flex flex-col gap-4">
        <Alert
          type="info"
          showIcon
          message={t("payment.simulatorNote")}
        />

        <div className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/10">
          <span className="text-sm text-foreground/70">
            {t("checkout.orders")} #{order.orderId}
          </span>
          <Tag color="orange">{t("payment.status.PENDING")}</Tag>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">{t("cart.totalPrice")}</span>
          <span className="text-lg! font-bold! text-primary">
            {formatRupiah(order.totalPrice)}
          </span>
        </div>

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

        <p className="flex items-center gap-1 text-xs text-foreground/50">
          <CloseCircleOutlined />
          {t("payment.simulatorHint")}
        </p>
      </div>
    </Modal>
  );
}

export default PaymentModal;
