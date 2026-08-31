"use client";

import { useMemo, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Image, Input, Space, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummySponsors, type Sponsor } from "@/models";

export default function SponsorPage() {
  const { t } = useT();
  const mounted = useMounted();
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      dummySponsors.filter((s) =>
        [s.name, s.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  if (!mounted) return null;

  const showForm = (record?: Sponsor) => {
    setEditing(record ?? null);
    setOpen(true);
  };

  const handleDelete = (record: Sponsor) => {
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
      width: 140,
      render: (_: unknown, record: Sponsor) => (
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
      <h1 className="text-2xl font-bold">{t("admin.sponsors.title")}</h1>
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
            ? `${t("common.edit")} ${t("admin.sponsors.title")}`
            : `${t("common.add")} ${t("admin.sponsors.title")}`
        }
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
        initialValues={
          editing
            ? { name: editing.name, filename: editing.filename, description: editing.description ?? "" }
            : undefined
        }
      >
        <Form.Item name="name" label={t("admin.sponsors.name")} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="filename" label={t("admin.gallery.photo")} rules={[{ required: true }]}>
          <Input placeholder="/images/sponsor/contoh.png" />
        </Form.Item>
        <Form.Item name="description" label={t("admin.sponsors.desc")}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
      </FormDrawer>
    </div>
  );
}
