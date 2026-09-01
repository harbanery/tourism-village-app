"use client";

import { useEffect, useState } from "react";
import { App, Avatar, Button, Card, Form, Tag, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useAdminSession } from "@/components/admin/session";
import LoaderPage from "@/components/admin/loader";
import FormAdmin from "@/components/admin/form";
import { asAppError } from "@/helpers/error";
import { getImageString } from "@/helpers/image";
import { profileFormLayout } from "../config";

interface ProfileFormValues {
  name?: string;
  avatar?: unknown;
}

const ProfileDecorator = () => {
  const { t } = useT();
  const { session, loading, refresh } = useAdminSession();
  const { notification } = App.useApp();
  const [form] = Form.useForm<ProfileFormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      form.setFieldsValue({
        name: session.name ?? "",
        avatar: session.avatar
          ? [{ url: session.avatar, thumbUrl: session.avatar, status: "done" }]
          : undefined,
      });
    }
  }, [session, form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const avatar = await getImageString(values.avatar);
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name ?? "", avatar }),
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
      // Segarkan sesi agar nama/avatar di header ikut berubah.
      await refresh();
      form.setFieldsValue({
        name: result.data.name ?? "",
        avatar: result.data.avatar
          ? [
              {
                url: result.data.avatar,
                thumbUrl: result.data.avatar,
                status: "done",
              },
            ]
          : undefined,
      });
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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("admin.profile.title")}</h1>
      <Card>
        <div className="flex flex-col gap-4">
          {/* Info read-only: avatar, email, role. */}
          <div className="flex flex-wrap items-center gap-3">
            <Avatar size={64} src={session?.avatar} icon={<UserOutlined />} />
            <div className="flex flex-col">
              <span className="font-semibold">
                {session?.name ?? session?.username}
              </span>
              <Typography.Text type="secondary" className="text-sm!">
                {session?.email}
              </Typography.Text>
            </div>
            {session && (
              <Tag
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
          <Typography.Text type="secondary" className="text-sm!">
            {t("admin.profile.editHint")}
          </Typography.Text>
          <FormAdmin
            formProps={{ form }}
            layout={profileFormLayout}
            uploadFolder="admins"
          />
          <div className="flex justify-end">
            <Button
              type="primary"
              loading={saving}
              onClick={handleSave}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileDecorator;
