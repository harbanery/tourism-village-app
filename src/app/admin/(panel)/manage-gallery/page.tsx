"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card, Image, Table, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyGalleries, type GalleryItem } from "@/models";

export default function ManageGalleryPage() {
  const { t } = useT();
  const mounted = useMounted();
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
        <Image src={record.filename} alt={record.title} width={80} height={52} className="rounded object-cover" />
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
        extra={<Button type="primary" icon={<PlusOutlined />}>{t("common.add")}</Button>}
      >
        <Table dataSource={dummyGalleries} columns={columns} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
