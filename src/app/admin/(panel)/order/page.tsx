"use client";

import { useMemo, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { Card, Input, Space, Table, Tag } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyOrders, type Order } from "@/models";
import { formatDate, formatRupiah } from "@/utils/format";

export default function OrderPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      dummyOrders.filter((order) =>
        [order.userName, order.userEmail, order.userPhone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  if (!mounted) return null;

  const columns = [
    {
      title: t("common.date"),
      dataIndex: "dateOrder",
      key: "dateOrder",
      render: (v: string) => formatDate(v, locale, true),
    },
    { title: t("common.name"), dataIndex: "userName", key: "userName" },
    { title: t("common.email"), dataIndex: "userEmail", key: "userEmail" },
    { title: t("common.phone"), dataIndex: "userPhone", key: "userPhone", render: (v: string | null) => v ?? "-" },
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
      render: (_: unknown, record: Order) =>
        record.homestay === "yes" ? (
          <Tag color="green">
            {t("common.yes")} ({record.homestayTime} hari)
          </Tag>
        ) : (
          <Tag>{t("common.no")}</Tag>
        ),
    },
    {
      title: t("admin.orders.totalPrice"),
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (v: number) => <span className="font-medium">{formatRupiah(v)}</span>,
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
