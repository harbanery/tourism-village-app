"use client";

import { useMemo, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Input, Select, Space, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyPlaces, dummyVideos, type VideoItem } from "@/models";

export default function VlogPage() {
  const { t } = useT();
  const mounted = useMounted();
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VideoItem | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      dummyVideos.filter((video) =>
        [video.name, video.placeName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  if (!mounted) return null;

  const showForm = (record?: VideoItem) => {
    setEditing(record ?? null);
    setOpen(true);
  };

  const handleDelete = (record: VideoItem) => {
    modal.confirm({
      title: `${t("common.delete")} "${record.name}"?`,
      content: t("admin.deleteConfirm"),
      okText: t("common.delete"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () => message.success(t("common.deleted")),
    });
  };

  const columns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    { title: t("common.name"), dataIndex: "name", key: "name" },
    { title: t("admin.tourism.place"), dataIndex: "placeName", key: "placeName" },
    {
      title: t("admin.vlog.videoCode"),
      dataIndex: "linkCode",
      key: "linkCode",
      render: (code: string) => <code className="text-xs bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">{code}</code>,
    },
    {
      title: t("common.actions"),
      key: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: unknown, record: VideoItem) => (
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
      <h1 className="text-2xl font-bold">{t("admin.vlog.title")}</h1>
      <Card
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
            ? `${t("common.edit")} ${t("admin.vlog.title")}`
            : `${t("common.add")} ${t("admin.vlog.title")}`
        }
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
        initialValues={
          editing
            ? { name: editing.name, placeId: editing.placeId, linkCode: editing.linkCode }
            : undefined
        }
      >
        <Form.Item name="name" label={t("common.name")} rules={[{ required: true }]}>
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
        <Form.Item name="linkCode" label={t("admin.vlog.videoCode")} rules={[{ required: true }]}>
          <Input placeholder="dQw4w9WgXcQ" />
        </Form.Item>
      </FormDrawer>
    </div>
  );
}
