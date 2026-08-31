"use client";

import { useMemo, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Image, Input, InputNumber, Select, Space, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyPackages, dummyPlaces, type Package, type Place } from "@/models";
import { formatRupiah } from "@/utils/format";

export default function TourismPage() {
  const { t } = useT();
  const mounted = useMounted();
  const { message, modal } = App.useApp();
  const [placeOpen, setPlaceOpen] = useState(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");

  const filteredPlaces = useMemo(
    () =>
      dummyPlaces.filter((place) =>
        place.name.toLowerCase().includes(placeQuery.toLowerCase()),
      ),
    [placeQuery],
  );

  const filteredPackages = useMemo(
    () =>
      dummyPackages.filter((pkg) =>
        [pkg.name, pkg.placeName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(packageQuery.toLowerCase()),
      ),
    [packageQuery],
  );

  if (!mounted) return null;

  const showPlaceForm = (record?: Place) => {
    setEditingPlace(record ?? null);
    setPlaceOpen(true);
  };

  const showPackageForm = (record?: Package) => {
    setEditingPackage(record ?? null);
    setPackageOpen(true);
  };

  const handleDeletePlace = (record: Place) => {
    modal.confirm({
      title: `${t("common.delete")} "${record.name}"?`,
      content: t("admin.deleteConfirm"),
      okText: t("common.delete"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () => message.success(t("common.deleted")),
    });
  };

  const handleDeletePackage = (record: Package) => {
    modal.confirm({
      title: `${t("common.delete")} "${record.name}"?`,
      content: t("admin.deleteConfirm"),
      okText: t("common.delete"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () => message.success(t("common.deleted")),
    });
  };

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
      width: 140,
      render: (_: unknown, record: Place) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => showPlaceForm(record)}>
            {t("common.edit")}
          </Button>
          <Button size="small" danger onClick={() => handleDeletePlace(record)}>
            {t("common.delete")}
          </Button>
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
      width: 140,
      render: (_: unknown, record: Package) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => showPackageForm(record)}>
            {t("common.edit")}
          </Button>
          <Button size="small" danger onClick={() => handleDeletePackage(record)}>
            {t("common.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.tourism.title")}</h1>
      <Card
        title={t("admin.tourism.places")}
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setPlaceQuery(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showPlaceForm()}>
              {t("common.add")}
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredPlaces}
          columns={placeColumns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>
      <Card
        title={t("admin.tourism.packages")}
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setPackageQuery(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showPackageForm()}>
              {t("common.add")}
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredPackages}
          columns={packageColumns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      <FormDrawer
        key={editingPlace?.id ?? "new"}
        open={placeOpen}
        title={
          editingPlace
            ? `${t("common.edit")} ${t("admin.tourism.places")}`
            : `${t("common.add")} ${t("admin.tourism.places")}`
        }
        onClose={() => setPlaceOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
        initialValues={
          editingPlace
            ? { name: editingPlace.name, photo: editingPlace.photo ?? "", active: editingPlace.active }
            : { active: "yes" }
        }
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
        <Form.Item name="active" label={t("common.status")} rules={[{ required: true }]}>
          <Select
            options={[
              { value: "yes", label: t("common.active") },
              { value: "no", label: t("common.inactive") },
            ]}
          />
        </Form.Item>
      </FormDrawer>

      <FormDrawer
        key={editingPackage?.id ?? "new"}
        open={packageOpen}
        title={
          editingPackage
            ? `${t("common.edit")} ${t("admin.tourism.packages")}`
            : `${t("common.add")} ${t("admin.tourism.packages")}`
        }
        onClose={() => setPackageOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
        initialValues={
          editingPackage
            ? {
                name: editingPackage.name,
                placeId: editingPackage.placeId ?? undefined,
                price: editingPackage.price,
                facility1: editingPackage.facilities[0] ?? "",
                facility2: editingPackage.facilities[1] ?? "",
                facility3: editingPackage.facilities[2] ?? "",
                facility4: editingPackage.facilities[3] ?? "",
              }
            : undefined
        }
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
        <Form.Item name="price" label={t("common.price")} rules={[{ required: true }]}>
          <InputNumber
            className="w-full!"
            min={0}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
          />
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
