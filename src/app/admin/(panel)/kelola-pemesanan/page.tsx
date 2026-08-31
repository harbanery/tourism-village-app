"use client";

import { useMounted } from "@/hooks/useMounted";
import { Card, Table, Tag } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyOrders, type Order } from "@/models";
import { formatDate, formatRupiah } from "@/utils/format";

export default function KelolaPemesananPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.orders.title")}</h1>
      <Card>
        <Table dataSource={dummyOrders} columns={columns} rowKey="id" pagination={false} scroll={{ x: 900 }} />
      </Card>
    </div>
  );
}
