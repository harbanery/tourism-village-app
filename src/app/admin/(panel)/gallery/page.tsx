"use client";

import { useMemo, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Image, Input, Select, Space, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyGalleries, dummyPlaces, type GalleryItem } from "@/models";

export default function GalleryPage() {
  const { t } = useT();
  const mounted = useMounted();
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      dummyGalleries.filter((item) =>
        [item.title, item.placeName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  if (!mounted) return null;

  const showForm = (record?: GalleryItem) => {
    setEditing(record ?? null);
    setOpen(true);
  };

  const handleDelete = (record: GalleryItem) => {
    modal.confirm({
      title: `${t("common.delete")} "${record.title}"?`,
      content: t("admin.deleteConfirm"),
      okText: t("common.delete"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () => message.success(t("common.deleted")),
    });
  };

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
      render: (_: unknown, record: GalleryItem) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => showForm(record)}>
            {t("common.edit")}
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record)}>
            {t("common.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.gallery.title")}</h1>
      <Card
        title={t("admin.gallery.title")}
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => showForm()}>
              {t("common.add")}
            </Button>
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

      <FormDrawer
        key={editing?.id ?? "new"}
        open={open}
        title={
          editing
            ? `${t("common.edit")} ${t("admin.gallery.title")}`
            : `${t("common.add")} ${t("admin.gallery.title")}`
        }
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
        initialValues={
          editing
            ? {
                title: editing.title,
                placeId: editing.placeId,
                filename: editing.filename,
                locked: editing.locked,
              }
            : { locked: "no" }
        }
      >
        <Form.Item name="title" label={t("common.name")} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="placeId" label={t("admin.tourism.place")} rules={[{ required: true }]}>
          <Select
            options={dummyPlaces.map((place) => ({
              value: place.id,
              label: place.name,
            }))}
          />
        </Form.Item>
        <Form.Item name="filename" label={t("admin.gallery.photo")} rules={[{ required: true }]}>
          <Input placeholder="/images/galeri/contoh.jpg" />
        </Form.Item>
        <Form.Item name="locked" label={t("common.status")} rules={[{ required: true }]}>
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
