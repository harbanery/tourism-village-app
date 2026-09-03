"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Form, Input } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

interface ForgotFormValues {
  email: string;
}

/** Form lupa password — kirim OTP reset ke email terdaftar. */
export function ForgotPasswordSection() {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [form] = Form.useForm<ForgotFormValues>();
  const [loading, setLoading] = useState(false);

  if (!mounted) return null;

  const handleSubmit = async (values: ForgotFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/web/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const result = await res.json();

      if (!result.success) {
        // Email tidak terdaftar → gagal (permintaan: validasi email di DB).
        if (result.error === "EMAIL_NOT_FOUND") {
          message.error(t("auth.forgot.emailNotFound"));
          return;
        }
        if (result.error === "COOLDOWN") {
          // Kode lama masih aktif — lanjut ke OTP agar bisa dipakai.
          message.warning(
            t("auth.otp.cooldown", { seconds: result.seconds ?? 60 }),
          );
        } else {
          message.error(t("notif.error"));
          return;
        }
      } else {
        message.success(t("auth.reset.otpSent"));
      }

      // Flow: lupa password → OTP (verifikasi kepemilikan akun) → reset.
      const dev = result.data?.devCode
        ? `&dev=${result.data.devCode}`
        : "";
      router.push(
        `/otp?userId=${result.data.userId}&purpose=RESET_PASSWORD${dev}`,
      );
    } catch {
      message.error(t("notif.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <Card>
        <h1 className="text-2xl font-bold text-center">
          {t("auth.forgot.title")}
        </h1>
        <p className="mt-1 text-center text-foreground/60">
          {t("auth.forgot.subtitle")}
        </p>
        <Form
          form={form}
          layout="vertical"
          className="mt-6!"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item
            name="email"
            label={t("common.email")}
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {t("auth.forgot.button")}
            </Button>
          </Form.Item>
        </Form>
        <Alert
          type="info"
          showIcon
          message={t("auth.forgot.info")}
          className="mt-2!"
        />
        <p className="mt-4 text-center text-sm text-foreground/60">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="cursor-pointer! text-primary! hover:underline!"
          >
            ← {t("auth.forgot.backToLogin")}
          </button>
        </p>
      </Card>
    </div>
  );
}
