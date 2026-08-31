"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Card, Rate, Table, Tag } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyTestimonials, type Testimonial } from "@/models";
import { formatDate } from "@/utils/format";

export default function ManageReviewPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  const columns = [
    {
      title: t("common.date"),
      dataIndex: "date",
      key: "date",
      render: (v: string) => formatDate(v, locale, true),
    },
    { title: t("common.name"), dataIndex: "userName", key: "userName" },
    { title: t("common.email"), dataIndex: "userEmail", key: "userEmail" },
    {
      title: t("admin.reviews.comment"),
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
    },
    {
      title: t("admin.reviews.rating"),
      dataIndex: "rating",
      key: "rating",
      render: (rating: number) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: t("common.status"),
      dataIndex: "active",
      key: "active",
      render: (active: Testimonial["active"]) => (
        <Tag color={active === "yes" ? "green" : "default"}>
          {active === "yes" ? t("common.active") : t("common.inactive")}
        </Tag>
      ),
    },
    {
      title: t("admin.reviews.note"),
      dataIndex: "note",
      key: "note",
      render: (v: string | null) => v ?? "-",
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
      <h1 className="text-2xl font-bold">{t("admin.reviews.title")}</h1>
      <Card>
        <Table dataSource={dummyTestimonials} columns={columns} rowKey="id" pagination={false} scroll={{ x: 1000 }} />
      </Card>
    </div>
  );
}
