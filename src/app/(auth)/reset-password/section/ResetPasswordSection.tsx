"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Form, Input } from "antd";
import { LockOutlined, SafetyOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

interface ResetFormValues {
  code: string;
  password: string;
  retypePassword: string;
}

/** Kunci sessionStorage: kode OTP yang barusan diverifikasi di /otp. */
const RESET_OTP_STORAGE_KEY = "resetOtpCode";

/**
 * Form reset password: OTP 6 digit (dari email) + password baru.
 * Flow: lupa password → OTP (di /otp, peek) → reset di sini → login.
 * Kode diverifikasi ULANG + dikonsumsi final oleh API reset (keamanan:
 * bukti kepemilikan akun wajib sampai ke server, bukan sekadar lewat gate).
 * `dev` = kode OTP cadangan (development tanpa SMTP).
 */
export function ResetPasswordSection({
  userId,
  dev,
}: {
  userId: number;
  dev?: string;
}) {
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
        body: JSON.stringify({ userId, code: values.code, password: values.password }),
      });
      const result = await res.json();

      if (!result.success) {
        if (result.error === "PASSWORD_SAME_AS_OLD") {
          // Password baru sama dengan lama → validasi gagal (permintaan).
          message.error(t("auth.reset.sameAsOld"));
          return;
        }
        if (result.remainingAttempts !== undefined) {
          message.error(
            t("auth.otp.invalidRemaining", {
              count: result.remainingAttempts,
            }),
          );
        } else {
          message.error(t(`auth.otp.error.${result.error}`));
        }
        return;
      }

      sessionStorage.removeItem(RESET_OTP_STORAGE_KEY);
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

        {dev && (
          <Alert
            className="mt-4!"
            type="info"
            showIcon
            message={t("auth.otp.devCode")}
            description={
              <span className="font-mono text-lg font-bold tracking-widest">
                {dev}
              </span>
            }
          />
        )}

        <Form
          form={form}
          layout="vertical"
          className="mt-6!"
          onFinish={handleReset}
          disabled={loading}
          initialValues={{
            // Kode barusan diverifikasi di /otp → pra-isi (tetap bisa diubah).
            code:
              typeof window !== "undefined"
                ? (sessionStorage.getItem(RESET_OTP_STORAGE_KEY) ?? "")
                : "",
          }}
        >
          <Form.Item
            name="code"
            label={t("auth.otp.codeLabel")}
            rules={[
              { required: true },
              { pattern: /^\d{6}$/, message: t("auth.otp.codePattern") },
            ]}
          >
            <Input
              size="large"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              className="text-center! font-mono! text-2xl! tracking-[0.5em]!"
            />
          </Form.Item>
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
