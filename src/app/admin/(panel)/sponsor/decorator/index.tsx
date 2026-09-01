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
import { useAdminSession } from "@/components/admin/session";
import LoaderPage from "@/components/admin/loader";
import FormAdmin from "@/components/admin/form";
import { modalBodyProps } from "@/helpers/modal";
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

  const [form] = Form.useForm<SponsorFormValues>();

  const [fetching, setFetching] = useState(true);
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<SponsorRow | null>(null);
  const [viewSponsor, setViewSponsor] = useState<SponsorRow | null>(null);
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
    { title: "Id", dataIndex: "id", key: "id", width: 60 },
    {
      title: t("admin.sponsors.name"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: t("admin.sponsors.desc"),
      dataIndex: "description",
      key: "description",
      render: (v: string | null) => v ?? "-",
    },
    {
      title: t("common.status"),
      dataIndex: "status",
      key: "status",
      render: (status: SponsorRow["status"]) => (
        <Tag color={status === "ACTIVE" ? "green" : "default"}>
          {status === "ACTIVE" ? t("common.active") : t("common.inactive")}
        </Tag>
      ),
    },
    // Opsi hanya untuk MASTER — viewer hidden, bukan disabled.
    ...(isMaster
      ? [
          {
            title: t("common.actions"),
            key: "actions",
            fixed: "right" as const,
            width: 280,
            render: (_: unknown, record: SponsorRow) => (
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
                  icon={
                    record.status === "ACTIVE" ? (
                      <StopOutlined />
                    ) : (
                      <CheckOutlined />
                    )
                  }
                  onClick={() =>
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
                  onClick={() => setViewSponsor(record)}
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
                        title: `${t("common.delete")} "${record.name}"?`,
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
            <Input.Search
              allowClear
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
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {/* Modal lihat foto sponsor */}
      <Modal
        title={`${t("common.viewPhoto")} — ${viewSponsor?.name ?? ""}`}
        open={viewSponsor !== null}
        footer={null}
        onCancel={() => setViewSponsor(null)}
        width={640}
      >
        {viewSponsor?.filename ? (
          <Image
            src={viewSponsor.filename}
            alt={viewSponsor.name}
            className="w-full! rounded! bg-black/5! object-contain!"
          />
        ) : (
          <p className="text-center py-8 text-foreground/60">
            {t("common.noPhoto")}
          </p>
        )}
      </Modal>

      {/* Modal tambah/edit sponsor */}
      <Modal
        title={
          editing
            ? `${t("common.edit")} ${t("admin.sponsors.title")}`
            : `${t("common.add")} ${t("admin.sponsors.title")}`
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
        width={560}
        {...modalBodyProps()}
      >
        <FormAdmin
          formProps={{ form }}
          layout={sponsorFormLayout}
          uploadFolder="sponsors"
        />
      </Modal>
    </div>
  );
};

export default SponsorDecorator;
