"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Image, Input, InputNumber, Select, Table, Tag, Form } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyPackages, dummyPlaces, type Package, type Place } from "@/models";
import { formatRupiah } from "@/utils/format";

export default function TourismPage() {
  const { t } = useT();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [placeOpen, setPlaceOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
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
      fixed: "right" as const,
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
      fixed: "right" as const,
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
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setPlaceOpen(true)}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummyPlaces} columns={placeColumns} rowKey="id" pagination={false} scroll={{ x: "max-content" }} />
      </Card>
      <Card
        title={t("admin.tourism.packages")}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setPackageOpen(true)}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummyPackages} columns={packageColumns} rowKey="id" pagination={false} scroll={{ x: "max-content" }} />
      </Card>

      <FormDrawer
        open={placeOpen}
        title={`${t("common.add")} ${t("admin.tourism.places")}`}
        onClose={() => setPlaceOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
      >
        <Form.Item
          name="name"
          label={t("admin.tourism.places")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="photo"
          label={t("admin.tourism.photo")}
          rules={[{ required: true }]}
        >
          <Input placeholder="/images/villages/contoh.jpg" />
        </Form.Item>
        <Form.Item
          name="active"
          label={t("common.status")}
          initialValue="yes"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "yes", label: t("common.active") },
              { value: "no", label: t("common.inactive") },
            ]}
          />
        </Form.Item>
      </FormDrawer>

      <FormDrawer
        open={packageOpen}
        title={`${t("common.add")} ${t("admin.tourism.packages")}`}
        onClose={() => setPackageOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
      >
        <Form.Item
          name="name"
          label={t("admin.tourism.packages")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="placeId"
          label={t("admin.tourism.place")}
          rules={[{ required: true }]}
        >
          <Select
            options={dummyPlaces.map((place) => ({
              value: place.id,
              label: place.name,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="price"
          label={t("common.price")}
          rules={[{ required: true }]}
        >
          <InputNumber className="w-full!" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")} />
        </Form.Item>
        {[1, 2, 3, 4].map((n) => (
          <Form.Item
            key={n}
            name={`facility${n}`}
            label={`${t("admin.tourism.facilities")} ${n}`}
            rules={n === 1 ? [{ required: true }] : undefined}
          >
            <Input />
          </Form.Item>
        ))}
      </FormDrawer>
    </div>
  );
}
