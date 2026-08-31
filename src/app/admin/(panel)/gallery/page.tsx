"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Image, Input, Select, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyGalleries, dummyPlaces, type GalleryItem } from "@/models";

export default function GalleryPage() {
  const { t } = useT();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  if (!mounted) return null;

  const columns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    { title: t("common.name"), dataIndex: "title", key: "title" },
    { title: t("admin.tourism.place"), dataIndex: "placeName", key: "placeName" },
    {
      title: t("admin.gallery.photo"),
      dataIndex: "filename",
      key: "filename",
      render: (_: unknown, record: GalleryItem) => (
        <Image src={record.filename} alt={record.title} width={80} height={52} className="rounded! object-cover!" />
      ),
    },
    {
      title: t("common.status"),
      dataIndex: "locked",
      key: "locked",
      render: (locked: GalleryItem["locked"]) =>
        locked === "yes" ? <Tag color="orange">Cover</Tag> : <Tag>{t("common.active")}</Tag>,
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
      <h1 className="text-2xl font-bold">{t("admin.gallery.title")}</h1>
      <Card
        title={t("admin.gallery.title")}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummyGalleries} columns={columns} rowKey="id" pagination={false} scroll={{ x: "max-content" }} />
      </Card>

      <FormDrawer
        open={open}
        title={`${t("common.add")} ${t("admin.gallery.title")}`}
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
      >
        <Form.Item
          name="title"
          label={t("common.name")}
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
          name="filename"
          label={t("admin.gallery.photo")}
          rules={[{ required: true }]}
        >
          <Input placeholder="/images/galeri/contoh.jpg" />
        </Form.Item>
        <Form.Item
          name="locked"
          label={t("common.status")}
          initialValue="no"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: "no", label: t("common.active") },
              { value: "yes", label: "Cover" },
            ]}
          />
        </Form.Item>
      </FormDrawer>
    </div>
  );
}
