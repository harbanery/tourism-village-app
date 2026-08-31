"use client";

import { useMemo, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Image, Input, Space, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyBlogs, type BlogPost } from "@/models";
import { formatDate } from "@/utils/format";

export default function BlogPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      dummyBlogs.filter((post) =>
        [post.title, post.adminName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  if (!mounted) return null;

  const showForm = (record?: BlogPost) => {
    setEditing(record ?? null);
    setOpen(true);
  };

  const handleDelete = (record: BlogPost) => {
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
      render: (_: unknown, record: BlogPost) => (
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
      <h1 className="text-2xl font-bold">{t("admin.blog.title")}</h1>
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
            ? `${t("common.edit")} ${t("admin.blog.title")}`
            : `${t("common.add")} ${t("admin.blog.title")}`
        }
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
        initialValues={
          editing
            ? {
                title: editing.title,
                filename: editing.filename,
                paraHeader: editing.paraHeader,
                paraBody: editing.paraBody,
              }
            : undefined
        }
      >
        <Form.Item name="title" label={t("admin.blog.judul")} rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="filename" label={t("admin.gallery.photo")} rules={[{ required: true }]}>
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
