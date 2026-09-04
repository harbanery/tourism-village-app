"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Form, Input } from "antd";
import { LockOutlined, SafetyOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

interface ResetFormValues {
  password: string;
  retypePassword: string;
}

/**
 * Form reset password — TANPA input OTP (OTP sudah diverifikasi di /otp;
 * bukti kepemilikan kini berupa token reset sekali pakai di URL, bukan
 * userId yang mudah dibaca orang lain).
 * Flow: lupa password → OTP (auto-verifikasi) → token → reset → login.
 */
export function ResetPasswordSection({ token }: { token: string }) {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [form] = Form.useForm<ResetFormValues>();
  const [loading, setLoading] = useState(false);

  if (!mounted) return null;

  const handleReset = async (values: ResetFormValues) => {
    if (values.password !== values.retypePassword) {
      message.error(t("auth.register.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/web/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const result = await res.json();

      if (!result.success) {
        if (result.error === "PASSWORD_SAME_AS_OLD") {
          // Password baru sama dengan lama → validasi gagal (permintaan).
          message.error(t("auth.reset.sameAsOld"));
          return;
        }
        if (result.error === "TOKEN_INVALID") {
          // Token sudah dipakai / kedaluwarsa → ulang dari lupa password.
          message.error(t("auth.reset.tokenInvalid"));
          router.replace("/forgot-password");
          return;
        }
        message.error(t("notif.error"));
        return;
      }

      message.success(t("auth.reset.success"));
      router.push("/login");
    } catch {
      message.error(t("notif.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <Card>
        <div className="text-center">
          <SafetyOutlined className="text-4xl text-primary" />
          <h1 className="mt-3 text-2xl font-bold">{t("auth.reset.title")}</h1>
          <p className="mt-1 text-foreground/60">
            {t("auth.reset.subtitle")}
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          className="mt-6!"
          onFinish={handleReset}
          disabled={loading}
        >
          <Form.Item
            name="password"
            label={t("auth.register.password")}
            rules={[
              { required: true },
              { min: 8, message: t("auth.register.passwordMin") },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                message: t("auth.register.passwordPattern"),
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item
            name="retypePassword"
            label={t("auth.register.retypePassword")}
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
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {t("auth.reset.button")}
            </Button>
          </Form.Item>
        </Form>
        <p className="text-center text-sm text-foreground/60">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="cursor-pointer! text-primary! hover:underline!"
          >
            {t("auth.reset.resend")}
          </button>
        </p>
      </Card>
    </div>
  );
}
