"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Form, Input, Typography } from "antd";
import { InfoCircleOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginFormSection() {
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
      const res = await fetch("/api/web/auth/login", {
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
      router.push("/profile");
      router.refresh();
    } catch {
      message.error(t("notif.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <h1 className="text-2xl font-bold text-center">{t("auth.login.title")}</h1>
        <p className="mt-1 text-center text-foreground/60">
          {t("auth.login.subtitle")}
        </p>
        <Form
          form={form}
          layout="vertical"
          className="mt-6!"
          onFinish={handleLogin}
          disabled={loading}
        >
          <Form.Item
            name="email"
            label={t("common.email")}
            rules={[
              { required: true },
              { type: "email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t("auth.register.password")}
            rules={[{ required: true }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {t("auth.login.button")}
            </Button>
          </Form.Item>
        </Form>
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message={t("admin.login.credentials.title")}
          description={
            <Typography.Text className="text-xs!">
              raihan@example.com / User#1234
            </Typography.Text>
          }
          className="mb-4!"
        />
        <div className="text-center space-y-2 text-sm">
          <p>
            <Link href="#" className="text-primary! hover:underline!">
              {t("auth.login.forgot")}
            </Link>
          </p>
          <p className="text-foreground/60">
            {t("auth.login.noAccount")}{" "}
            <Link href="/register" className="text-primary! hover:underline!">
              {t("nav.register")}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
