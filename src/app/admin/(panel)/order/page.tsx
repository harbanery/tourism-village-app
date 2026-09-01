"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App, Card, Input, Space, Table, Tag, Typography } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import LoaderPage from "@/components/admin/loader";
import { formatDate, formatRupiah } from "@/utils/format";

interface OrderRow {
  id: number;
  dateOrder: string;
  dateSchedule: string;
  homestay: boolean;
  homestayTime: number | null;
  totalPrice: number;
  status: "ACTIVE" | "NONACTIVE";
  user: { id: number; name: string; email: string; phone: string | null };
  items: {
    id: number;
    quantity: number;
    price: number;
    package: { name: string };
  }[];
}

/** Menu pemesanan — menyesuaikan data dari DB (read-only untuk sementara). */
export default function OrderPage() {
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
      title: t("common.name"),
      dataIndex: ["user", "name"],
      key: "userName",
    },
    {
      title: t("common.email"),
      dataIndex: ["user", "email"],
      key: "userEmail",
    },
    {
      title: t("common.phone"),
      dataIndex: ["user", "phone"],
      key: "userPhone",
      render: (v: string | null) => v ?? "-",
    },
    {
      title: t("admin.orders.departureDate"),
      dataIndex: "dateSchedule",
      key: "dateSchedule",
      render: (v: string) => formatDate(v, locale),
    },
    {
      title: t("admin.orders.stay"),
      dataIndex: "homestay",
      key: "homestay",
      render: (_: unknown, record: OrderRow) =>
        record.homestay ? (
          <Tag color="green">
            {t("common.yes")} ({record.homestayTime} hari)
          </Tag>
        ) : (
          <Tag>{t("common.no")}</Tag>
        ),
    },
    {
      title: t("checkout.orders"),
      key: "items",
      render: (_: unknown, record: OrderRow) => (
        <div className="flex flex-col">
          {record.items.map((item) => (
            <Typography.Text key={item.id} className="text-xs!">
              {item.package.name} × {item.quantity} = {formatRupiah(item.price)}
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
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.orders.title")}</h1>
      <Card
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Space>
        }
      >
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </div>
  );
}
