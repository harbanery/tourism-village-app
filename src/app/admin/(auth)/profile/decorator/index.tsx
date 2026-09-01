"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Tag,
  Upload,
  theme,
} from "antd";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useAdminSession } from "@/components/admin/session";
import LoaderPage from "@/components/admin/loader";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";
import { asAppError } from "@/helpers/error";

interface ProfileFormValues {
  name?: string;
  email?: string;
}

/**
 * Page profil admin (grup (auth)) — tanpa navbar/shell, dengan toggle
 * tema & bahasa. Layout atas ke bawah: avatar (upload langsung),
 * nama, email (readonly), role (tag). Hanya avatar & nama yang bisa diedit.
 */
const ProfileDecorator = () => {
  const { t } = useT();
  const router = useRouter();
  const { session, loading, refresh } = useAdminSession();
  const { notification } = App.useApp();
  const { token } = theme.useToken();
  const [form] = Form.useForm<ProfileFormValues>();
  /** Avatar hasil upload baru; undefined = belum diubah (pakai sesi). */
  const [uploadedAvatar, setUploadedAvatar] = useState<
    string | null | undefined
  >(undefined);
  const [saving, setSaving] = useState(false);

  /** Avatar yang tampil: hasil upload baru, atau dari sesi. */
  const avatarUrl = uploadedAvatar ?? session?.avatar ?? null;

  useEffect(() => {
    if (session) {
      form.setFieldsValue({ name: session.name ?? "", email: session.email });
    }
  }, [session, form]);

  const handleAvatarChange = (info: {
    file: {
      status?: string;
      response?: { success?: boolean; data?: { url?: string } };
    };
  }) => {
    if (info.file.status === "done" && info.file.response?.success) {
      const next = info.file.response.data?.url ?? null;
      if (!next) return;
      // Bersihkan aset hasil upload sebelumnya yang belum tersimpan.
      if (
        uploadedAvatar !== undefined &&
        uploadedAvatar !== null &&
        uploadedAvatar !== session?.avatar
      ) {
        void fetch(`/api/upload?url=${encodeURIComponent(uploadedAvatar)}`, {
          method: "DELETE",
        }).catch(() => {});
      }
      setUploadedAvatar(next);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name ?? "",
          avatar: avatarUrl ?? "",
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      notification.success({
        title: t("notif.success"),
        description: t("notif.saveSuccess", {
          entity: t("admin.profile.title"),
        }),
        placement: "bottomRight",
      });
      // Segarkan sesi agar nama/avatar di header admin ikut berubah.
      await refresh();
    } catch (error) {
      const err = asAppError(error);
      notification.error({
        title: err.errorFields ? t("notif.validationError") : t("notif.error"),
        ...(err.errorFields
          ? {}
          : {
              description:
                err.message ||
                t("notif.saveFailed", { entity: t("admin.profile.title") }),
            }),
        placement: "bottomRight",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoaderPage />;

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-4 py-10">
      {/* Tanpa navbar: toggle bahasa/tema + tombol kembali. */}
      <div className="absolute top-4 left-4">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/admin")}
          aria-label={t("common.back")}
          title={t("common.back")}
        />
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full! max-w-md!">
        <h1 className="text-2xl font-bold text-center">
          {t("admin.profile.title")}
        </h1>

        <Form
          form={form}
          layout="vertical"
          className="mt-6!"
          onFinish={handleSave}
          disabled={saving}
        >
          {/* 1. Avatar — upload langsung di komponen avatar; kosong = bg primary. */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <Upload
              accept="image/*"
              showUploadList={false}
              maxCount={1}
              action="/api/upload"
              data={{ folder: "admins" }}
              beforeUpload={(file) => file.size <= 2 * 1024 * 1024}
              onChange={handleAvatarChange}
            >
              <Avatar
                size={96}
                src={avatarUrl ?? undefined}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: token.colorPrimary,
                  cursor: "pointer",
                }}
                aria-label={t("form.avatar")}
              />
            </Upload>
            <span className="text-xs text-foreground/60">
              {t("admin.profile.avatarHint")}
            </span>
          </div>

          {/* 2. Nama */}
          <Form.Item
            name="name"
            label={t("common.name")}
            rules={[{ max: 100 }]}
          >
            <Input maxLength={100} placeholder={t("common.name")} />
          </Form.Item>

          {/* 3. Email — readonly */}
          <Form.Item name="email" label={t("common.email")}>
            <Input readOnly variant="filled" />
          </Form.Item>

          {/* 4. Role — tag (read-only) */}
          <div className="flex flex-col gap-1 mb-2">
            <label className="text-sm! font-medium!">
              {t("admin.accounts.role")}
            </label>
            {session && (
              <Tag
                className="w-fit!"
                color={
                  session.role === "MASTER"
                    ? "green"
                    : session.role === "AUTHOR"
                      ? "blue"
                      : "default"
                }
              >
                {t(`admin.role.${session.role}`)}
              </Tag>
            )}
          </div>

          <p className="my-6 text-xs text-foreground/60">
            {t("admin.profile.editHint")}
          </p>

          <Button type="primary" htmlType="submit" block loading={saving}>
            {t("common.save")}
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default ProfileDecorator;
