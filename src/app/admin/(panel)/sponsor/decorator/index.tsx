"use client";

import { useCallback, useEffect, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  Space,
} from "antd";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  StopOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
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
import { sponsorFormLayout } from "../config";

interface SponsorRow {
  id: number;
  name: string;
  description: string | null;
  filename: string;
  status: "ACTIVE" | "NONACTIVE";
}

interface SponsorFormValues {
  name: string;
  description?: string;
  filename?: unknown;
}

const SponsorDecorator = () => {
  const { t } = useT();
  const mounted = useMounted();
  const { session, loading: sessionLoading } = useAdminSession();
  const { notification, modal } = App.useApp();

  // Aturan role: MASTER bisa akses opsi + tambah; VIEWER hidden.
  const isMaster = session?.role === "MASTER";

  // Kolom global (id, status, opsi) untuk tabel sponsor.
  const cols = useAdminColumns<SponsorRow>();

  const [form] = Form.useForm<SponsorFormValues>();

  const [fetching, setFetching] = useState(true);
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<SponsorRow | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSponsors = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sponsors");
      const result = await res.json();
      if (result.success) setSponsors(result.data);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
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
    void Promise.resolve().then(fetchSponsors);
  }, [fetchSponsors]);

  const showForm = (record?: SponsorRow) => {
    setEditing(record ?? null);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        description: record.description ?? undefined,
        filename: record.filename
          ? [{ url: record.filename, thumbUrl: record.filename, status: "done" }]
          : undefined,
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
      const filename = await getImageString(values.filename);
      const payload = {
        name: values.name,
        description: values.description ?? null,
        filename,
      };
      const res = editing
        ? await fetch(`/api/admin/sponsors/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/sponsors", {
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
          ? t("notif.saveSuccess", { entity: t("admin.sponsors.title") })
          : t("notif.createSuccess", { entity: t("admin.sponsors.title") }),
        placement: "bottomRight",
      });
      setIsModalOpen(false);
      form.resetFields();
      fetchSponsors();
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: err.errorFields ? t("notif.validationError") : t("notif.error"),
        ...(err.errorFields
          ? {}
          : {
              description:
                err.message ||
                t("notif.saveFailed", { entity: t("admin.sponsors.title") }),
            }),
        placement: "bottomRight",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (record: SponsorRow) => {
    const next = record.status === "ACTIVE" ? "NONACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/sponsors/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchSponsors();
      notification.success({
        title: t("notif.success"),
        description: t("notif.toggleSuccess", {
          entity: t("admin.sponsors.title"),
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
          t("notif.toggleFailed", { entity: t("admin.sponsors.title") }),
        placement: "bottomRight",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/sponsors/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      fetchSponsors();
      notification.success({
        title: t("notif.success"),
        description: t("notif.deleteSuccess", {
          entity: t("admin.sponsors.title"),
        }),
        placement: "bottomRight",
      });
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: t("notif.error"),
        description:
          err.message ||
          t("notif.deleteFailed", { entity: t("admin.sponsors.title") }),
        placement: "bottomRight",
      });
    }
  };

  const columns = [
    cols.id,
    {
      // Foto logo sponsor berada di kolom nama (seperti akun admin/user).
      title: t("admin.sponsors.name"),
      dataIndex: "name",
      key: "name",
      render: (_: unknown, record: SponsorRow) => (
        <div className="flex items-center gap-2">
          <Avatar src={record.filename} icon={<TrophyOutlined />} />
          <span className="font-medium">{record.name}</span>
        </div>
      ),
    },
    {
      title: t("admin.sponsors.desc"),
      dataIndex: "description",
      key: "description",
      render: (v: string | null) => v ?? "-",
    },
    // Kolom status & opsi: fixed kanan, width statis (global).
    cols.status,
    // Opsi digabung dropdown three-dots; hanya untuk MASTER —
    // viewer hidden, bukan disabled.
    ...(isMaster
      ? [
          cols.actions((record) => (
            <RowActions
              items={[
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: t("common.edit"),
                  onClick: () => showForm(record),
                },
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
                        entity: t("admin.sponsors.title"),
                      }),
                      okText: t("common.yes"),
                      cancelText: t("common.no"),
                      onOk: () => handleToggleStatus(record),
                    }),
                },
                ...(record.status !== "ACTIVE"
                  ? [
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        danger: true,
                        label: t("common.delete"),
                        onClick: () =>
                          modal.confirm({
                            title: `${t("common.delete")} "${record.name}"?`,
                            content: t("admin.deleteConfirm"),
                            okText: t("common.delete"),
                            okButtonProps: { danger: true },
                            cancelText: t("common.cancel"),
                            onOk: () => handleDelete(record.id),
                          }),
                      },
                    ]
                  : []),
              ]}
            />
          )),
        ]
      : []),
  ];

  const filtered = sponsors.filter((s) =>
    [s.name, s.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  if (!mounted || fetching || sessionLoading) return <LoaderPage />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.sponsors.title")}</h1>
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
            {/* Tombol tambah hanya untuk MASTER — viewer hidden. */}
            {isMaster && (
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

      {/* Drawer tambah/edit sponsor */}
      <Drawer
        title={
          editing
            ? `${t("common.edit")} ${t("admin.sponsors.title")}`
            : `${t("common.add")} ${t("admin.sponsors.title")}`
        }
        open={isModalOpen}
        onClose={() => {
          form.resetFields();
          setEditing(null);
          setIsModalOpen(false);
        }}
        width={560}
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
          layout={sponsorFormLayout}
          uploadFolder="sponsors"
        />
      </Drawer>
    </div>
  );
};

export default SponsorDecorator;
