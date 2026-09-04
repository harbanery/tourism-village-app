"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Card, Input, Space, Tag, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { AdminTable } from "@/components/admin/table";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import LoaderPage from "@/components/admin/loader";
import { formatDate, formatRupiah } from "@/utils/format";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

/** Warna tag status pembayaran. */
const PAYMENT_TAG_COLORS: Record<PaymentStatus, string> = {
  PAID: "green",
  PENDING: "orange",
  FAILED: "red",
  CANCELED: "default",
};

interface OrderRow {
  id: number;
  dateOrder: string;
  dateSchedule: string;
  homestay: boolean;
  homestayTime: number | null;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  status: "ACTIVE" | "NONACTIVE";
  user: { id: number; name: string; email: string; phone: string | null };
  items: {
    id: number;
    quantity: number;
    price: number;
    /** Jadwal per paket (null untuk data lama — fallback agregat order). */
    dateSchedule?: string | null;
    homestay?: boolean;
    homestayTime?: number | null;
    package: { name: string };
  }[];
}

/** Menu pemesanan — read-only, kolom ringkas (paket × kuantitas). */
const OrderDecorator = () => {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { notification } = App.useApp();
  const [fetching, setFetching] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const result = await res.json();
      if (result.success) setOrders(result.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      notification.error({
        title: t("notif.error"),
        description: t("notif.fetchFailed"),
        placement: "bottomRight",
      });
    } finally {
      setFetching(false);
    }
  }, [notification, t]);

  useEffect(() => {
    void Promise.resolve().then(fetchOrders);
  }, [fetchOrders]);

  // Pencarian tetap menyertakan email/no. telepon meskipun kolomnya
  // tidak ditampilkan (takeout kolom, bukan takeout fitur cari).
  const filtered = useMemo(
    () =>
      orders.filter((order) =>
        [order.user?.name, order.user?.email, order.user?.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [orders, query],
  );

  if (!mounted || fetching) return <LoaderPage />;

  const columns = [
    {
      title: "Id",
      dataIndex: "id",
      key: "id",
      width: 60,
    },
    {
      title: t("common.date"),
      dataIndex: "dateOrder",
      key: "dateOrder",
      render: (v: string) => formatDate(v, locale, true),
    },
    {
      title: t("admin.orders.departureDate"),
      dataIndex: "dateSchedule",
      key: "dateSchedule",
      render: (v: string) => formatDate(v, locale),
    },
    {
      title: t("common.name"),
      dataIndex: ["user", "name"],
      key: "userName",
    },
    {
      title: t("admin.orders.stay"),
      dataIndex: "homestay",
      key: "homestay",
      render: (_: unknown, record: OrderRow) =>
        record.homestay ? (
          <Tag color="green">
            {t("common.yes")} ({record.homestayTime})
          </Tag>
        ) : (
          <Tag>{t("common.no")}</Tag>
        ),
    },
    {
      // Kolom pesanan dirapihkan: hanya nama paket + kuantitas
      // (tanpa harga per item).
      title: t("checkout.orders"),
      key: "items",
      render: (_: unknown, record: OrderRow) => (
        <div className="flex flex-col">
          {record.items.map((item) => (
            <Typography.Text key={item.id} className="text-xs!">
              {item.package.name} × {item.quantity}
              {item.dateSchedule && (
                <span className="block text-[11px]! text-foreground/50">
                  {formatDate(item.dateSchedule, locale)}
                  {item.homestay
                    ? ` — ${t("common.yes")} (${item.homestayTime})`
                    : ""}
                </span>
              )}
            </Typography.Text>
          ))}
        </div>
      ),
    },
    {
      title: t("admin.orders.totalPrice"),
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (v: number) => (
        <span className="font-medium">{formatRupiah(v)}</span>
      ),
    },
    {
      title: t("admin.orders.payment"),
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (v: PaymentStatus) => (
        <Tag color={PAYMENT_TAG_COLORS[v] ?? "default"}>
          {t(`payment.status.${v}`)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.orders.title")}</h1>
      <Card
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Space>
        }
      >
        <AdminTable dataSource={filtered} columns={columns} />
      </Card>
    </div>
  );
};

export default OrderDecorator;
