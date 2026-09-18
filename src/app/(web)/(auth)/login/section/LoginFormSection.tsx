"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Divider, Form, Input } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { GoogleButton } from "@/components/ui/GoogleButton";

interface LoginFormValues {
  email: string;
  password: string;
}

/** Kode error balikan callback Google → kunci terjemahan pesan. */
const GOOGLE_ERROR_KEYS: Record<string, string> = {
  failed: "auth.google.failed",
  unverified: "auth.google.emailUnverified",
  inactive: "auth.google.inactive",
  unconfigured: "auth.google.notConfigured",
};

/**
 * Form login.
 * `redirectTo`: halaman tujuan setelah login sukses (mis. user belum login
 * saat membuka /package → kembali ke /package, bukan ke profile).
 * `googleError`: kode error dari callback OAuth Google (?googleError=...).
 */
export function LoginFormSection({
  redirectTo,
  googleEnabled,
  googleError,
}: {
  redirectTo: string;
  /** Google SSO aktif (server: GOOGLE_CLIENT_ID + SECRET terisi). */
  googleEnabled: boolean;
  /** Kode error alur OAuth Google (bila ada). */
  googleError?: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);

  // Pesan error satu kali dari callback OAuth Google (redirect penuh).
  useEffect(() => {
    if (!googleError) return;
    const key = GOOGLE_ERROR_KEYS[googleError];
    if (key) message.error(t(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            t("auth.login.blocked", { minutes: result.minutes ?? 1440 }),
          );
        } else if (result.error === "EMAIL_NOT_VERIFIED") {
          // Belum verifikasi OTP → arahkan ke halaman OTP.
          message.warning(t("auth.otp.needVerification"));
          router.push(`/otp?userId=${result.userId}&purpose=REGISTER`);
          return;
        } else {
          message.error(
            result.remaining !== undefined && result.remaining > 0
              ? t("auth.login.invalidRemaining", { count: result.remaining })
              : t("auth.login.invalid"),
          );
        }
        return;
      }

      message.success(t("auth.login.success"));
      // Kembali ke halaman asal (mis. /package) bila ada; selain itu profile.
      router.push(redirectTo);
      router.refresh();
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
          {t("auth.login.title")}
        </h1>
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
            rules={[{ required: true }, { type: "email" }]}
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
        <Divider plain className="my-2! text-xs!">
          <span className="text-xs text-foreground/50">
            {t("auth.google.divider")}
          </span>
        </Divider>
        <div className="w-full flex justify-center">
          <GoogleButton enabled={googleEnabled} redirectTo={redirectTo} />
        </div>
        <div className="mt-6 text-center space-y-2 text-sm">
          <p>
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="cursor-pointer! text-primary! hover:underline!"
            >
              {t("auth.login.forgot")}
            </button>
          </p>
          <p className="text-foreground/60">
            {t("auth.login.noAccount")}{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="cursor-pointer! text-primary! hover:underline!"
            >
              {t("nav.register")}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}
