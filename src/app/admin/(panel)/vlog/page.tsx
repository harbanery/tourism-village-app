"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyVideos } from "@/models";

export default function VlogPage() {
  const { t } = useT();
  const mounted = useMounted();
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
      <Card extra={<Button type="primary" icon={<PlusOutlined />}>{t("common.add")}</Button>}>
        <Table dataSource={dummyVideos} columns={columns} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
