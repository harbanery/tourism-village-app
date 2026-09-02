"use client";

import { useMounted } from "@/helpers/useMounted";
import Link from "next/link";
import { Button, Card, List, Tag } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
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

export function OrderHistorySection({ orders }: { orders: HistoryOrder[] }) {
  const { t, locale } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div>
      <h2 className="text-xl font-bold">{t("profile.orderHistory")}</h2>
      {orders.length === 0 ? (
        <Card className="mt-4!">
          <p className="text-foreground/60">{t("profile.noOrders")}</p>
        </Card>
      ) : (
        <List
          className="mt-4"
          grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 1, xl: 1 }}
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
                <p className="text-sm text-foreground/70">
                  {t("common.date")}: {formatDate(order.dateOrder, locale, true)}
                </p>
                <p className="text-sm text-foreground/70">
                  {t("profile.departureDate")}: {formatDate(order.dateSchedule, locale)}
                </p>
                {order.paymentStatus === "PENDING" &&
                  order.paymentExpiresAt && (
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {t("payment.deadline")}:{" "}
                      {formatDate(order.paymentExpiresAt, locale, true)}
                    </p>
                  )}
                <p className="text-sm text-foreground/70">
                  {t("checkout.homestay")}:{" "}
                  {order.homestay === "yes"
                    ? `${t("common.yes")} (${order.homestayTime} ${t("checkout.homestayDays")})`
                    : t("common.no")}
                </p>
                <ul className="mt-2 list-disc pl-5 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.packageName} × {item.quantity} — {formatRupiah(item.price)}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.paymentStatus === "PENDING" ? (
                    <Link href={`/payment/${order.id}`}>
                      <Button type="primary" icon={<CreditCardOutlined />}>
                        {t("payment.pay")}
                      </Button>
                    </Link>
                  ) : (
                    <Button>{t("profile.downloadReceipt")}</Button>
                  )}
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
      <Link href="/" className="inline-block! mt-6!">
        <Button>{t("common.backToHome")}</Button>
      </Link>
    </div>
  );
}
