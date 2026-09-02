"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Result, Spin, Tag } from "antd";
import {
  CheckCircleFilled,
  CreditCardOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import {
  PaymentModal,
  type PaymentOption,
  type PaymentResult,
} from "@/components/web/payment/PaymentModal";
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
const PAYMENT_TAG_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "orange",
  FAILED: "red",
  CANCELED: "default",
};

/**
 * Halaman transaksi pembayaran order (target setelah checkout):
 * mengambil opsi pembayaran dari GET /api/web/orders/[id]/pay lalu membuka
 * modal pembayaran (Midtrans Snap / simulator). Order PENDING bisa dibayar
 * di sini kapan saja sampai statusnya final.
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
  const [payOpen, setPayOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  // Ambil opsi pembayaran (token Snap baru bila perlu).
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
        setPayOpen(true); // langsung arahkan ke transaksi pembayaran
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

  const handleSettled = (result: PaymentResult) => {
    setPayOpen(false);
    if (result === "PAID") {
      setStatus("PAID");
      notification.success({
        title: t("notif.success"),
        description: t("payment.success"),
        placement: "bottomRight",
      });
    } else if (result === "CANCELED") {
      // Tetap di halaman — user bisa menekan "Bayar" lagi dari profil/pesan.
      notification.warning({
        title: t("payment.canceled"),
        description: t("payment.pendingHint"),
        placement: "bottomRight",
      });
    }
  };

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
        ) : (
          <div className="mt-6 flex gap-2">
            <Button block onClick={() => router.push("/profile")}>
              {t("success.goToProfile")}
            </Button>
            <Button
              type="primary"
              block
              icon={<CreditCardOutlined />}
              disabled={!option}
              onClick={() => setPayOpen(true)}
            >
              {t("payment.pay")}
            </Button>
          </div>
        )}

        <Alert
          className="mt-4!"
          type="info"
          showIcon
          message={t("payment.pendingHint")}
        />
      </Card>

      <PaymentModal
        open={payOpen}
        order={{
          orderId: order.id,
          totalPrice: order.totalPrice,
          expiresAt,
        }}
        option={option}
        onClose={() => setPayOpen(false)}
        onSettled={handleSettled}
        onCheck={() => {
          setPayOpen(false);
          void loadOption();
        }}
      />
    </div>
  );
}
