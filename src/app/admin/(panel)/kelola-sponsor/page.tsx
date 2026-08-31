"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card, Image, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummySponsors, type Sponsor } from "@/models";

export default function KelolaSponsorPage() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  const columns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    { title: t("admin.sponsors.name"), dataIndex: "name", key: "name" },
    {
      title: t("admin.gallery.photo"),
      dataIndex: "filename",
      key: "filename",
      render: (_: unknown, record: Sponsor) => (
        <Image src={record.filename} alt={record.name} width={80} height={40} className="rounded object-contain bg-black/5 dark:bg-white/10" />
      ),
    },
    { title: t("admin.sponsors.desc"), dataIndex: "description", key: "description", render: (v: string | null) => v ?? "-" },
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
      <h1 className="text-2xl font-bold">{t("admin.sponsors.title")}</h1>
      <Card extra={<Button type="primary" icon={<PlusOutlined />}>{t("common.add")}</Button>}>
        <Table dataSource={dummySponsors} columns={columns} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
