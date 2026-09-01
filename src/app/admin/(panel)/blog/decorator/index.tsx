"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Button,
  Card,
  Drawer,
  Form,
  Image,
  Input,
  Space,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import { useAdminSession } from "@/components/admin/session";
import LoaderPage from "@/components/admin/loader";
import FormAdmin from "@/components/admin/form";
import {
  AdminTable,
  RowActions,
  useAdminColumns,
} from "@/components/admin/table";
import { drawerBodyProps } from "@/helpers/drawer";
import { asAppError } from "@/helpers/error";
import { getImageString } from "@/helpers/image";
import { formatDate } from "@/utils/format";
import { blogFormLayout } from "../config";

interface BlogRow {
  id: number;
  adminId: number;
  placeId: number | null;
  datetime: string;
  datetimeAfter: string | null;
  title: string;
  filename: string;
  para: string;
  status: "ACTIVE" | "NONACTIVE";
  admin: { id: number; username: string; name: string | null };
  place: { id: number; name: string } | null;
}

interface PlaceOption {
  id: number;
  name: string;
}

interface BlogFormValues {
  title: string;
  placeId?: number | null;
  filename?: unknown;
  para?: string;
}

const BlogDecorator = () => {
  const { t, locale } = useT();
  const mounted = useMounted();
  const { session, loading: sessionLoading } = useAdminSession();
  const { notification, modal, message } = App.useApp();

  const [form] = Form.useForm<BlogFormValues>();

  // Aturan role blog: MASTER semua opsi; AUTHOR hanya edit + tambah;
  // VIEWER tanpa opsi dan tombol tambah (hidden, bukan disabled).
  const isMaster = session?.role === "MASTER";
  const canWriteBlog = isMaster || session?.role === "AUTHOR";

  // Kolom global (id, status, opsi) untuk tabel blog.
  const cols = useAdminColumns<BlogRow>();

  const [fetching, setFetching] = useState(true);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogRow | null>(null);
  /** Foto yang sedang dipreview langsung (lightbox, bukan modal). */
  const [preview, setPreview] = useState<{
    src: string;
    name: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  /** Buka foto langsung di image preview. */
  const openPhoto = (src: string | null, name: string) => {
    if (!src) {
      message.info(t("common.noPhoto"));
      return;
    }
    setPreview({ src, name });
  };

  const fetchBlogs = useCallback(async () => {
    try {
      const [blogsRes, placesRes] = await Promise.all([
        fetch("/api/admin/blogs"),
        fetch("/api/admin/places"),
      ]);
      const blogsJson = await blogsRes.json();
      const placesJson = await placesRes.json();
      if (blogsJson.success) setBlogs(blogsJson.data);
      if (placesJson.success)
        setPlaces(
          (placesJson.data as PlaceOption[]).map((p) => ({
            id: p.id,
            name: p.name,
          })),
        );
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
      placeId: values.placeId ?? null,
      filename,
      para: values.para ?? "",
    };
  };

  const showForm = (record?: BlogRow) => {
    setEditing(record ?? null);
    if (record) {
      form.setFieldsValue({
        title: record.title,
        placeId: record.placeId ?? undefined,
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
        // Data baru dibuat nonaktif dulu; aktifkan lewat opsi.
        description: editing
          ? t("notif.saveSuccess", { entity: t("admin.blog.title") })
          : t("notif.createSuccess", { entity: t("admin.blog.title") }),
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
    cols.id,
    {
      title: t("admin.blog.judul"),
      dataIndex: "title",
      key: "title",
      width: 320,
    },
    {
      title: t("admin.blog.author"),
      dataIndex: ["admin", "name"],
      key: "adminName",
      render: (v: string | null, record: BlogRow) => v ?? record.admin.username,
    },
    {
      // Tanggal gabungan: tampilkan tanggal setelah diubah,
      // jika tidak ada maka tanggal awalnya.
      title: t("common.date"),
      key: "date",
      render: (_: unknown, record: BlogRow) =>
        formatDate(record.datetimeAfter ?? record.datetime, locale, true),
    },
    {
      // Tempat wisata yang terkait (optional).
      title: t("admin.blog.relatedPlace"),
      dataIndex: ["place", "name"],
      key: "placeName",
      render: (v: string | null) => v ?? "-",
    },
    // Kolom status & opsi: fixed kanan, width statis (global).
    cols.status,
    // Opsi digabung dropdown three-dots; hanya untuk yang berhak
    // (MASTER semua; AUTHOR edit miliknya saja); VIEWER tanpa kolom opsi.
    ...(canWriteBlog
      ? [
          cols.actions((record) => {
            const items = [
              // AUTHOR hanya bisa edit blog miliknya sendiri.
              ...(isMaster || record.adminId === session?.id
                ? [
                    {
                      key: "edit",
                      icon: <EditOutlined />,
                      label: t("common.edit"),
                      onClick: () => showForm(record),
                    },
                  ]
                : []),
              // Toggle status hanya MASTER.
              ...(isMaster
                ? [
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
                            entity: t("admin.blog.title"),
                          }),
                          okText: t("common.yes"),
                          cancelText: t("common.no"),
                          onOk: () => handleToggleStatus(record),
                        }),
                    },
                  ]
                : []),
              {
                key: "view",
                icon: <EyeOutlined />,
                label: t("common.viewPhoto"),
                onClick: () => openPhoto(record.filename, record.title),
              },
              // Hapus hanya MASTER dan hanya untuk data nonaktif.
              ...(isMaster && record.status !== "ACTIVE"
                ? [
                    {
                      key: "delete",
                      icon: <DeleteOutlined />,
                      danger: true,
                      label: t("common.delete"),
                      onClick: () =>
                        modal.confirm({
                          title: `${t("common.delete")} "${record.title}"?`,
                          content: t("admin.deleteConfirm"),
                          okText: t("common.delete"),
                          okButtonProps: { danger: true },
                          cancelText: t("common.cancel"),
                          onOk: () => handleDelete(record.id),
                        }),
                    },
                  ]
                : []),
            ];
            return <RowActions items={items} />;
          }),
        ]
      : []),
  ];

  const filtered = blogs.filter((post) =>
    [post.title, post.admin?.name, post.place?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  if (!mounted || fetching || sessionLoading) return <LoaderPage />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.blog.title")}</h1>
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
            {/* Tombol tambah untuk MASTER & AUTHOR; VIEWER hidden. */}
            {canWriteBlog && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showForm()}
              >
                {t("common.add")}
              </Button>
            )}
          </Space>
        }
      >
        <AdminTable dataSource={filtered} columns={columns} />
      </Card>

      {/* Preview foto blog langsung (lightbox, tanpa modal) */}
      <Image
        src={preview?.src}
        alt={preview?.name}
        style={{ display: "none" }}
        preview={{
          open: preview !== null,
          src: preview?.src,
          onOpenChange: (open) => {
            if (!open) setPreview(null);
          },
        }}
      />

      {/* Drawer tambah/edit blog */}
      <Drawer
        title={
          editing
            ? `${t("common.edit")} ${t("admin.blog.title")}`
            : `${t("common.add")} ${t("admin.blog.title")}`
        }
        open={isModalOpen}
        onClose={() => {
          form.resetFields();
          setEditing(null);
          setIsModalOpen(false);
        }}
        width={900}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                form.resetFields();
                setEditing(null);
                setIsModalOpen(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              {t("common.save")}
            </Button>
          </div>
        }
        {...drawerBodyProps()}
      >
        <FormAdmin
          formProps={{ form }}
          layout={blogFormLayout}
          optionList={{
            placeId: places.map((p) => ({ label: p.name, value: p.id })),
          }}
          uploadFolder="blogs"
        />
      </Drawer>
    </div>
  );
};

export default BlogDecorator;
