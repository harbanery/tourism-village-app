"use client";

import { useMounted } from "@/hooks/useMounted";
import Link from "next/link";
import { Button, Card, List } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import type { Order } from "@/models";
import { formatDate, formatRupiah } from "@/utils/format";

export function OrderHistorySection({ orders }: { orders: Order[] }) {
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
              <Card title={`${t("common.total")}: ${formatRupiah(order.totalPrice)}`}>
                <p className="text-sm text-foreground/70">
                  {t("common.date")}: {formatDate(order.dateOrder, locale, true)}
                </p>
                <p className="text-sm text-foreground/70">
                  {t("profile.departureDate")}: {formatDate(order.dateSchedule, locale)}
                </p>
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
                <Button className="mt-4!">{t("profile.downloadReceipt")}</Button>
              </Card>
            </List.Item>
          )}
        />
      )}
      <Link href="/" className="inline-block mt-6">
        <Button>{t("common.backToHome")}</Button>
      </Link>
    </div>
  );
}
