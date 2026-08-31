"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Input, Select, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyPlaces, dummyVideos } from "@/models";

export default function VlogPage() {
  const { t } = useT();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  if (!mounted) return null;

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
      <h1 className="text-2xl font-bold">{t("admin.vlog.title")}</h1>
      <Card
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummyVideos} columns={columns} rowKey="id" pagination={false} scroll={{ x: "max-content" }} />
      </Card>

      <FormDrawer
        open={open}
        title={`${t("common.add")} ${t("admin.vlog.title")}`}
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
      >
        <Form.Item
          name="name"
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
          name="linkCode"
          label={t("admin.vlog.videoCode")}
          rules={[{ required: true }]}
        >
          <Input placeholder="dQw4w9WgXcQ" />
        </Form.Item>
      </FormDrawer>
    </div>
  );
}
