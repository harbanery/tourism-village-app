"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card, Image, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyBlogs, type BlogPost } from "@/models";
import { formatDate } from "@/utils/format";

export default function ManageBlogPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
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
        <Image src={record.filename} alt={record.title} width={80} height={52} className="rounded object-cover" />
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
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
      <Card extra={<Button type="primary" icon={<PlusOutlined />}>{t("common.add")}</Button>}>
        <Table dataSource={dummyBlogs} columns={columns} rowKey="id" pagination={false} scroll={{ x: 900 }} />
      </Card>
    </div>
  );
}
