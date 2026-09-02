"use client";

import { useCallback, useState } from "react";
import { Alert, App, Button, Modal, Radio, Space, Tag } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CreditCardOutlined,
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
  snapScriptUrl?: string | null;
  clientKey?: string | null;
}

export type PaymentResult = "PAID" | "CANCELED" | "FAILED";

/** Opsi metode pembayaran simulator (meniru channel Midtrans sandbox). */
const SIMULATOR_METHODS = [
  { value: "qris", label: "QRIS" },
  { value: "bca_va", label: "Virtual Account BCA" },
  { value: "gopay", label: "GoPay" },
];

/**
 * Simulator pembayaran lokal — hanya dipakai bila Midtrans belum
 * dikonfigurasi (server key kosong). Bila Midtrans aktif, tombol bayar
 * di halaman pembayaran langsung direct ke halaman Midtrans.
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
  const { t, locale } = useT();
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

  if (!order || !option) return null;

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
      </div>
    </Modal>
  );
}

export default PaymentModal;
