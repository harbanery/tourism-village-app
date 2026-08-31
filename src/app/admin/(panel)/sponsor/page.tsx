"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Image, Input, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummySponsors, type Sponsor } from "@/models";

export default function SponsorPage() {
  const { t } = useT();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  if (!mounted) return null;

  const columns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    { title: t("admin.sponsors.name"), dataIndex: "name", key: "name" },
    {
      title: t("admin.gallery.photo"),
      dataIndex: "filename",
      key: "filename",
      render: (_: unknown, record: Sponsor) => (
        <Image src={record.filename} alt={record.name} width={80} height={40} className="rounded! object-contain! bg-black/5! dark:bg-white/10!" />
      ),
    },
    { title: t("admin.sponsors.desc"), dataIndex: "description", key: "description", render: (v: string | null) => v ?? "-" },
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
      <h1 className="text-2xl font-bold">{t("admin.sponsors.title")}</h1>
      <Card
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummySponsors} columns={columns} rowKey="id" pagination={false} scroll={{ x: "max-content" }} />
      </Card>

      <FormDrawer
        open={open}
        title={`${t("common.add")} ${t("admin.sponsors.title")}`}
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
      >
        <Form.Item
          name="name"
          label={t("admin.sponsors.name")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="filename"
          label={t("admin.gallery.photo")}
          rules={[{ required: true }]}
        >
          <Input placeholder="/images/sponsor/contoh.png" />
        </Form.Item>
        <Form.Item name="description" label={t("admin.sponsors.desc")}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
      </FormDrawer>
    </div>
  );
}
