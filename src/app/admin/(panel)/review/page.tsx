"use client";

import { useMemo, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { App, Button, Card, Form, Input, InputNumber, Rate, Select, Table, Tag } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { FormDrawer } from "@/components/admin/FormDrawer";
import { dummyTestimonials, type Testimonial } from "@/models";
import { formatDate } from "@/utils/format";

export default function ReviewPage() {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { message, modal } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      dummyTestimonials.filter((r) =>
        [r.userName, r.userEmail, r.comment]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );

  if (!mounted) return null;

  const showForm = (record?: Testimonial) => {
    setEditing(record ?? null);
    setOpen(true);
  };

  const handleDelete = (record: Testimonial) => {
    modal.confirm({
      title: `${t("common.delete")} "${record.userName}"?`,
      content: t("admin.deleteConfirm"),
      okText: t("common.delete"),
      okButtonProps: { danger: true },
      cancelText: t("common.cancel"),
      onOk: () => message.success(t("common.deleted")),
    });
  };

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
      fixed: "right" as const,
      render: (_: unknown, record: Testimonial) => (
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
      <h1 className="text-2xl font-bold">{t("admin.reviews.title")}</h1>
      <Card
        extra={
          <Input.Search
            allowClear
            className="w-full! sm:w-44!"
            placeholder={t("common.search")}
            onChange={(e) => setQuery(e.target.value)}
          />
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
            ? `${t("common.edit")} ${t("admin.reviews.title")}`
            : `${t("common.add")} ${t("admin.reviews.title")}`
        }
        onClose={() => setOpen(false)}
        onFinish={() => message.success(t("common.saved"))}
        initialValues={
          editing
            ? {
                rating: editing.rating,
                active: editing.active,
                note: editing.note ?? "",
              }
            : { active: "yes" }
        }
      >
        <Form.Item name="rating" label={t("admin.reviews.rating")} rules={[{ required: true }]}>
          <InputNumber min={1} max={5} className="w-full!" />
        </Form.Item>
        <Form.Item name="active" label={t("common.status")} rules={[{ required: true }]}>
          <Select
            options={[
              { value: "yes", label: t("common.active") },
              { value: "no", label: t("common.inactive") },
            ]}
          />
        </Form.Item>
        <Form.Item name="note" label={t("admin.reviews.note")}>
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
      </FormDrawer>
    </div>
  );
}
