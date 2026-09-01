"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Form,
  Image,
  Input,
  Modal,
  Space,
  Table,
  Tag,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import LoaderPage from "@/components/admin/loader";
import FormAdmin from "@/components/admin/form";
import { modalBodyProps } from "@/helpers/modal";
import { asAppError } from "@/helpers/error";
import { getImageString } from "@/helpers/image";
import { formatDate } from "@/utils/format";
import { blogFormLayout } from "../config";

interface BlogRow {
  id: number;
  adminId: number;
  datetime: string;
  datetimeAfter: string | null;
  title: string;
  filename: string;
  para: string;
  status: "ACTIVE" | "NONACTIVE";
  admin: { id: number; username: string; name: string | null };
}

interface BlogFormValues {
  title: string;
  filename?: unknown;
  para?: string;
}

const BlogDecorator = () => {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { notification, modal } = App.useApp();

  const [form] = Form.useForm<BlogFormValues>();

  const [fetching, setFetching] = useState(true);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogRow | null>(null);
  const [viewBlog, setViewBlog] = useState<BlogRow | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBlogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/blogs");
      const result = await res.json();
      if (result.success) setBlogs(result.data);
    } catch (error) {
      console.error("Error fetching blogs:", error);
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
    void Promise.resolve().then(fetchBlogs);
  }, [fetchBlogs]);

  const toPayload = async (values: BlogFormValues) => {
    const filename = await getImageString(values.filename);
    return {
      title: values.title,
      filename,
      para: values.para ?? "",
    };
  };

  const showForm = (record?: BlogRow) => {
    setEditing(record ?? null);
    if (record) {
      form.setFieldsValue({
        title: record.title,
        filename: record.filename
          ? [{ url: record.filename, thumbUrl: record.filename, status: "done" }]
          : undefined,
        para: record.para,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = await toPayload(values);
      const res = editing
        ? await fetch(`/api/admin/blogs/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/blogs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      notification.success({
        title: t("notif.success"),
        description: t("notif.saveSuccess", {
          entity: t("admin.blog.title"),
        }),
        placement: "bottomRight",
      });
      setIsModalOpen(false);
      form.resetFields();
      fetchBlogs();
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: err.errorFields ? t("notif.validationError") : t("notif.error"),
        ...(err.errorFields
          ? {}
          : {
              description:
                err.message ||
                t("notif.saveFailed", { entity: t("admin.blog.title") }),
            }),
        placement: "bottomRight",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (record: BlogRow) => {
    const next = record.status === "ACTIVE" ? "NONACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/blogs/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchBlogs();
      notification.success({
        title: t("notif.success"),
        description: t("notif.toggleSuccess", {
          entity: t("admin.blog.title"),
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
          t("notif.toggleFailed", { entity: t("admin.blog.title") }),
        placement: "bottomRight",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchBlogs();
      notification.success({
        title: t("notif.success"),
        description: t("notif.deleteSuccess", {
          entity: t("admin.blog.title"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description:
          err.message ||
          t("notif.deleteFailed", { entity: t("admin.blog.title") }),
        placement: "bottomRight",
      });
    }
  };

  const columns = [
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    {
      // Kolom judul diperlebar (width 320).
      title: t("admin.blog.judul"),
      dataIndex: "title",
      key: "title",
      width: 320,
    },
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
    {
      title: t("admin.blog.author"),
      dataIndex: ["admin", "name"],
      key: "adminName",
      render: (v: string | null, record: BlogRow) => v ?? record.admin.username,
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (status: BlogRow["status"]) => (
        <Tag color={status === "ACTIVE" ? "green" : "default"}>
          {status === "ACTIVE" ? t("common.active") : t("common.inactive")}
        </Tag>
      ),
    },
    {
      title: t("common.actions"),
      key: "actions",
      fixed: "right" as const,
      width: 280,
      render: (_: unknown, record: BlogRow) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => showForm(record)}
          >
            {t("common.edit")}
          </Button>
          <Button
            size="small"
            icon={record.status === "ACTIVE" ? <StopOutlined /> : <CheckOutlined />}
            onClick={() =>
              modal.confirm({
                title: t("notif.confirmToggle", {
                  action:
                    record.status === "ACTIVE"
                      ? t("common.deactivate")
                      : t("common.activate"),
                  entity: t("admin.blog.title"),
                }),
                okText: t("common.yes"),
                cancelText: t("common.no"),
                onOk: () => handleToggleStatus(record),
              })
            }
          >
            {record.status === "ACTIVE"
              ? t("common.deactivate")
              : t("common.activate")}
          </Button>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setViewBlog(record)}
          >
            {t("common.viewPhoto")}
          </Button>
          {record.status !== "ACTIVE" && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() =>
                modal.confirm({
                  title: `${t("common.delete")} "${record.title}"?`,
                  content: t("admin.deleteConfirm"),
                  okText: t("common.delete"),
                  okButtonProps: { danger: true },
                  cancelText: t("common.cancel"),
                  onOk: () => handleDelete(record.id),
                })
              }
            />
          )}
        </div>
      ),
    },
  ];

  const filtered = blogs.filter((post) =>
    [post.title, post.admin?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  if (!mounted || fetching) return <LoaderPage />;

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
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showForm()}
            >
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

      {/* Modal lihat foto blog */}
      <Modal
        title={`${t("common.viewPhoto")} — ${viewBlog?.title ?? ""}`}
        open={viewBlog !== null}
        footer={null}
        onCancel={() => setViewBlog(null)}
        width={720}
      >
        {viewBlog?.filename ? (
          <Image
            src={viewBlog.filename}
            alt={viewBlog.title}
            className="w-full! rounded!"
          />
        ) : (
          <p className="text-center py-8 text-foreground/60">
            {t("common.noPhoto")}
          </p>
        )}
      </Modal>

      {/* Modal tambah/edit blog */}
      <Modal
        title={
          editing
            ? `${t("common.edit")} ${t("admin.blog.title")}`
            : `${t("common.add")} ${t("admin.blog.title")}`
        }
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => {
          form.resetFields();
          setEditing(null);
          setIsModalOpen(false);
        }}
        okText={t("common.save")}
        cancelText={t("common.cancel")}
        confirmLoading={saving}
        width={680}
        {...modalBodyProps()}
      >
        <FormAdmin
          formProps={{ form }}
          layout={blogFormLayout}
          uploadFolder="blogs"
        />
      </Modal>
    </div>
  );
};

export default BlogDecorator;
