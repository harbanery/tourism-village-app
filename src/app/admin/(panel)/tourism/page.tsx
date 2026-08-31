"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card, Image, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPackages, dummyPlaces, type Package, type Place } from "@/models";
import { formatRupiah } from "@/utils/format";

export default function TourismPage() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  const placeColumns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    {
      title: t("admin.tourism.places"),
      dataIndex: "name",
      key: "name",
      render: (_: unknown, record: Place) => (
        <div className="flex items-center gap-3">
          <Image src={record.photo ?? undefined} alt={record.name} width={64} height={40} className="rounded! object-cover!" />
          <span className="font-medium">{record.name}</span>
        </div>
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "active",
      key: "active",
      render: (active: Place["active"]) => (
        <Tag color={active === "yes" ? "green" : "default"}>
          {active === "yes" ? t("common.active") : t("common.inactive")}
        </Tag>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: () => (
        <div className="flex gap-2">
          <Button size="small">{t("common.edit")}</Button>
          <Button size="small" danger>{t("common.delete")}</Button>
        </div>
      ),
    },
  ];

  const packageColumns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    { title: t("admin.tourism.packages"), dataIndex: "name", key: "name" },
    { title: t("admin.tourism.place"), dataIndex: "placeName", key: "placeName", render: (v?: string) => v ?? "-" },
    {
      title: t("admin.tourism.facilities"),
      dataIndex: "facilities",
      key: "facilities",
      render: (facilities: Package["facilities"]) => (
        <span>{facilities.filter(Boolean).join(", ")}</span>
      ),
    },
    {
      title: t("common.price"),
      dataIndex: "price",
      key: "price",
      render: (price: number) => <span className="font-medium">{formatRupiah(price)}</span>,
    },
    {
      title: t("common.actions"),
      key: "actions",
      render: () => (
        <div className="flex gap-2">
          <Button size="small">{t("common.edit")}</Button>
          <Button size="small" danger>{t("common.delete")}</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.tourism.title")}</h1>
      <Card
        title={t("admin.tourism.places")}
        extra={<Button type="primary" icon={<PlusOutlined />}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummyPlaces} columns={placeColumns} rowKey="id" pagination={false} />
      </Card>
      <Card
        title={t("admin.tourism.packages")}
        extra={<Button type="primary" icon={<PlusOutlined />}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummyPackages} columns={packageColumns} rowKey="id" pagination={false} scroll={{ x: 800 }} />
      </Card>
    </div>
  );
}
