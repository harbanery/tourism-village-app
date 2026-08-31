"use client";

import { useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Image, Input, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyBlogs, type BlogPost } from "@/models";
import { formatDate } from "@/utils/format";

export default function BlogPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  if (!mounted) return null;

  const columns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    { title: t("admin.blog.judul"), dataIndex: "title", key: "title" },
    {
      title: t("common.date"),
      dataIndex: "datetime",
      key: "datetime",
      render: (v: string) => formatDate(v, locale, true),
    },
    {
      title: t("admin.blog.dateChanged"),
      dataIndex: "datetimeAfter",
      key: "datetimeAfter",
      render: (v: string | null) => (v ? formatDate(v, locale, true) : "-"),
    },
    { title: t("admin.blog.author"), dataIndex: "adminName", key: "adminName" },
    {
      title: t("admin.gallery.photo"),
      dataIndex: "filename",
      key: "filename",
      render: (_: unknown, record: BlogPost) => (
        <Image src={record.filename} alt={record.title} width={80} height={52} className="rounded! object-cover!" />
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("admin.blog.title")}</h1>
      <Card
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummyBlogs} columns={columns} rowKey="id" pagination={false} scroll={{ x: "max-content" }} />
      </Card>

      <FormDrawer
        open={open}
        title={`${t("common.add")} ${t("admin.blog.title")}`}
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
      >
        <Form.Item
          name="title"
          label={t("admin.blog.judul")}
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="filename"
          label={t("admin.gallery.photo")}
          rules={[{ required: true }]}
        >
          <Input placeholder="/images/blog/contoh.jpg" />
        </Form.Item>
        <Form.Item
          name="paraHeader"
          label={t("admin.blog.paraHeader")}
          rules={[{ required: true }]}
        >
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
        <Form.Item
          name="paraBody"
          label={t("admin.blog.paraBody")}
          rules={[{ required: true }]}
        >
          <Input.TextArea autoSize={{ minRows: 4, maxRows: 8 }} />
        </Form.Item>
      </FormDrawer>
    </div>
  );
}
