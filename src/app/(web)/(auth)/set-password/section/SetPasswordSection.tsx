"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Form, Input } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { refreshWebSession } from "@/features/web/hooks/session";
import { Reveal } from "@/features/web/components/ui/reveal";

interface SetPasswordValues {
  password: string;
  retypePassword: string;
}

/**
 * Form pembuatan password pertama setelah Google SSO:
 * - pendingToken: menautkan Google ke akun manual (email belum verifikasi).
 * - credential: melengkapi registrasi akun Google-only (tanpa form manual).
 * Setelah sukses user langsung login (sesi dibuat API).
 */
export function SetPasswordSection({
  pendingToken,
  credential,
}: {
  pendingToken: string;
  credential: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [form] = Form.useForm<SetPasswordValues>();
  const [loading, setLoading] = useState(false);

  if (!mounted) return null;

  const handleSubmit = async (values: SetPasswordValues) => {
    if (values.password !== values.retypePassword) {
      message.error(t("auth.register.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/web/auth/google/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(pendingToken ? { pendingToken } : { credential }),
          password: values.password,
        }),
      });
      const result = await res.json();

      if (!result.success) {
        if (result.error === "PENDING_TOKEN_INVALID") {
          message.error(t("auth.setPassword.pendingInvalid"));
          router.replace("/login");
          return;
        }
        if (result.error === "NEW_PASSWORD_INVALID") {
          message.error(t("settings.password.requirement"));
          return;
        }
        if (result.error === "NEW_PASSWORD_SAME") {
          message.error(t("settings.password.same"));
          return;
        }
        message.error(t("auth.setPassword.failed"));
        return;
      }

      message.success(t("auth.setPassword.success"));
      await refreshWebSession();
      router.push("/profile");
      router.refresh();
    } catch {
      message.error(t("notif.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <Reveal>
        <Card>
        <h1 className="text-2xl font-bold text-center">
          {t("auth.setPassword.title")}
        </h1>
        <p className="mt-1 text-center text-foreground/60">
          {pendingToken
            ? t("auth.setPassword.subtitlePending")
            : t("auth.setPassword.subtitle")}
        </p>
        <Form
          form={form}
          layout="vertical"
          className="mt-6!"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item
            name="password"
            label={t("settings.password.new")}
            rules={[
              { required: true },
              { min: 8, message: t("auth.register.passwordMin") },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                message: t("settings.password.requirement"),
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t("auth.setPassword.passwordPlaceholder")}
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="retypePassword"
            label={t("settings.password.confirm")}
            dependencies={["password"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(t("auth.register.passwordMismatch")),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t("auth.setPassword.retypePlaceholder")}
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {t("auth.setPassword.submit")}
            </Button>
          </Form.Item>
        </Form>
        <p className="text-center text-sm text-foreground/60">
          {t("auth.setPassword.hint")}
        </p>
        </Card>
      </Reveal>
    </div>
  );
}
