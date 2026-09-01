"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Card,
  Input,
  Rate,
  Space,
  Tag,
  Tooltip,
} from "antd";
import { CheckOutlined, SearchOutlined, StarFilled, StopOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { useAdminSession } from "@/components/admin/session";
import LoaderPage from "@/components/admin/loader";
import {
  AdminTable,
  RowActions,
  useAdminColumns,
} from "@/components/admin/table";
import { asAppError } from "@/helpers/error";
import { formatDate } from "@/utils/format";

interface TestimonialRow {
  id: number;
  date: string;
  comment: string;
  rating: number;
  status: "ACTIVE" | "NONACTIVE";
  featured: boolean;
  note: string | null;
  user: { id: number; name: string; email: string };
}

const ReviewDecorator = () => {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { session, loading: sessionLoading } = useAdminSession();
  const { notification, modal } = App.useApp();

  // Aturan role: MASTER bisa akses opsi; VIEWER hidden.
  const isMaster = session?.role === "MASTER";

  // Kolom global (id, status, opsi) untuk tabel ulasan.
  const cols = useAdminColumns<TestimonialRow>();

  const [fetching, setFetching] = useState(true);
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [query, setQuery] = useState("");

  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/testimonials");
      const result = await res.json();
      if (result.success) setTestimonials(result.data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      notification.error({
        title: t("notif.error"),
        description: t("notif.fetchFailed"),
        placement: "bottomRight",
      });
    } finally {
      setFetching(false);
    }
  }, [notification, t]);

  useEffect(() => {
    void Promise.resolve().then(fetchTestimonials);
  }, [fetchTestimonials]);

  const handleToggleStatus = async (record: TestimonialRow) => {
    const next = record.status === "ACTIVE" ? "NONACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/testimonials/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchTestimonials();
      notification.success({
        title: t("notif.success"),
        description: t("notif.toggleSuccess", {
          entity: t("admin.reviews.title"),
          status: next === "ACTIVE" ? t("common.active") : t("common.inactive"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description:
          err.message ||
          t("notif.toggleFailed", { entity: t("admin.reviews.title") }),
        placement: "bottomRight",
      });
    }
  };

  const handleToggleFeatured = async (record: TestimonialRow) => {
    const next = !record.featured;
    try {
      const res = await fetch(`/api/admin/testimonials/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchTestimonials();
      notification.success({
        title: t("notif.success"),
        description: next
          ? t("notif.featuredSuccess")
          : t("notif.unfeaturedSuccess"),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description: err.message || t("notif.featuredFailed"),
        placement: "bottomRight",
      });
    }
  };

  const columns = [
    {
      title: t("common.date"),
      dataIndex: "date",
      key: "date",
      render: (v: string) => formatDate(v, locale, true),
    },
    {
      title: t("common.name"),
      dataIndex: ["user", "name"],
      key: "userName",
    },
    {
      title: t("common.email"),
      dataIndex: ["user", "email"],
      key: "userEmail",
    },
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
      title: t("admin.reviews.featured"),
      dataIndex: "featured",
      key: "featured",
      render: (featured: boolean) =>
        featured ? (
          <Tag color="gold" icon={<StarFilled />}>
            {t("admin.reviews.main")}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: t("admin.reviews.note"),
      dataIndex: "note",
      key: "note",
      render: (v: string | null) => v ?? "-",
    },
    // Kolom status & opsi: fixed kanan, width statis (global).
    cols.status,
    // Opsi digabung dropdown three-dots; hanya untuk MASTER —
    // viewer hidden, bukan disabled.
    ...(isMaster
      ? [
          cols.actions((record) => (
            <Tooltip
              title={t("admin.reviews.featuredHint", {
                max: 3,
              })}
            >
              <div>
                <RowActions
                  items={[
                    {
                      key: "toggle",
                      icon:
                        record.status === "ACTIVE" ? (
                          <StopOutlined />
                        ) : (
                          <CheckOutlined />
                        ),
                      label:
                        record.status === "ACTIVE"
                          ? t("common.deactivate")
                          : t("common.activate"),
                      onClick: () =>
                        modal.confirm({
                          title: t("notif.confirmToggle", {
                            action:
                              record.status === "ACTIVE"
                                ? t("common.deactivate")
                                : t("common.activate"),
                            entity: t("admin.reviews.title"),
                          }),
                          okText: t("common.yes"),
                          cancelText: t("common.no"),
                          onOk: () => handleToggleStatus(record),
                        }),
                    },
                    {
                      key: "featured",
                      icon: <StarFilled />,
                      label: record.featured
                        ? t("admin.reviews.unmain")
                        : t("admin.reviews.main"),
                      onClick: () => handleToggleFeatured(record),
                    },
                  ]}
                />
              </div>
            </Tooltip>
          )),
        ]
      : []),
  ];

  const filtered = testimonials.filter((r) =>
    [r.user?.name, r.user?.email, r.comment]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  if (!mounted || fetching || sessionLoading) return <LoaderPage />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.reviews.title")}</h1>
      <Card
        extra={
          <Space wrap>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              className="w-full! sm:w-44!"
              placeholder={t("common.search")}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Space>
        }
      >
        <AdminTable dataSource={filtered} columns={columns} />
      </Card>
    </div>
  );
};

export default ReviewDecorator;
