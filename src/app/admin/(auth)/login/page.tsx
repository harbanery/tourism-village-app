"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Form, Input } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { ThemeToggle } from "@/components/ui/theme/ThemeToggle";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";

interface LoginFormValues {
  username: string;
  password: string;
}

export default function AdminLoginPage() {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);

  if (!mounted) return null;

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await res.json();

      if (!result.success) {
        if (result.error === "BLOCKED") {
          message.error(
            t("auth.login.blocked", { minutes: result.minutes ?? 15 }),
          );
        } else {
          message.error(t("auth.login.invalid"));
        }
        return;
      }

      message.success(t("auth.login.success"));
      // replace + refresh agar client router cache di-reset dan panel
      // dirender ulang dengan cookie sesi yang baru saja diset.
      router.replace("/admin");
      router.refresh();
    } catch {
      message.error(t("notif.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <Card className="w-full! max-w-md!">
        <h1 className="text-2xl font-bold text-center">
          {t("admin.login.title")}
        </h1>
        <p className="mt-1 text-center text-foreground/60">{t("admin.title")}</p>
        <Form
          form={form}
          layout="vertical"
          className="mt-6!"
          onFinish={handleLogin}
          disabled={loading}
        >
          <Form.Item
            name="username"
            label={t("admin.accounts.username")}
            rules={[{ required: true }]}
          >
            <Input prefix={<UserOutlined />} placeholder="masteradmin" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t("auth.register.password")}
            rules={[{ required: true }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
            >
              {t("auth.login.button")}
            </Button>
          </Form.Item>
        </Form>
        <p className="mt-4 text-center text-sm text-foreground/60">
          {t("admin.login.backToSite")}
        </p>
      </Card>
    </div>
  );
}
