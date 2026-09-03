"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Form, Input } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  retypePassword: string;
}

export function RegisterFormSection() {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [form] = Form.useForm<RegisterFormValues>();
  const [loading, setLoading] = useState(false);

  if (!mounted) return null;

  const handleRegister = async (values: RegisterFormValues) => {
    if (values.password !== values.retypePassword) {
      message.error(t("auth.register.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/web/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });
      const result = await res.json();

      if (!result.success) {
        message.error(result.error || t("auth.register.failed"));
        return;
      }

      message.success(t("auth.register.success"));
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
      <button
        type="button"
        onClick={() => router.push("/")}
        className="cursor-pointer! bg-transparent! text-sm! text-foreground/60! hover:text-foreground!"
      >
        ← {t("common.backToHome")}
      </button>
      <Card className="mt-4!">
        <h1 className="text-2xl font-bold text-center">
          {t("auth.register.title")}
        </h1>
        <p className="mt-1 text-center text-foreground/60">
          {t("auth.register.subtitle")}
        </p>
        <Form
          form={form}
          layout="vertical"
          className="mt-6!"
          onFinish={handleRegister}
          disabled={loading}
        >
          <Form.Item
            name="name"
            label={t("auth.register.name")}
            rules={[{ required: true }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="email"
            label={t("common.email")}
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label={t("auth.register.password")}
            rules={[
              { required: true },
              { min: 8, message: t("auth.register.passwordMin") },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="retypePassword"
            label={t("auth.register.retypePassword")}
            rules={[{ required: true }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {t("auth.register.button")}
            </Button>
          </Form.Item>
        </Form>
        <p className="text-center text-sm text-foreground/60">
          {t("auth.register.haveAccount")}{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="cursor-pointer! text-primary! hover:underline!"
          >
            {t("nav.login")}
          </button>
        </p>
      </Card>
    </div>
  );
}
