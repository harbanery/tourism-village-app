"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App, Button, Card, Divider, Form, Input } from "antd";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { useMounted } from "@/hooks/useMounted";
import { GoogleButton } from "@/components/ui/button/google";
import { Reveal } from "@/features/web/components/ui/reveal";

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  retypePassword: string;
}

export function RegisterFormSection({
  googleEnabled,
}: {
  /** Google SSO aktif (server: GOOGLE_CLIENT_ID + SECRET terisi). */
  googleEnabled: boolean;
}) {
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
        // Mapping error terstruktur dari API → pesan ter-translate.
        if (result.error === "EMAIL_TAKEN") {
          message.error(t("auth.register.emailTaken"));
        } else if (result.error === "VALIDATION") {
          message.error(t("notif.validationError"));
        } else if (result.error === "BLOCKED") {
          message.error(
            t("auth.login.blocked", { minutes: result.minutes ?? 1440 }),
          );
        } else {
          message.error(t("auth.register.failed"));
        }
        return;
      }

      // Akun dibuat → verifikasi email via halaman OTP.
      message.success(t("auth.register.successOtp"));
      const dev = result.data?.devCode ? `&dev=${result.data.devCode}` : "";
      router.replace(`/otp?userId=${result.data.id}&purpose=REGISTER${dev}`);
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
            {t("auth.register.title")}
          </h1>
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
              rules={[
                { required: true },
                { min: 2, message: t("auth.register.nameMin") },
                { max: 60, message: t("auth.register.nameMin") },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder={t("auth.register.namePlaceholder")}
              />
            </Form.Item>
            <Form.Item
              name="email"
              label={t("common.email")}
              rules={[{ required: true }, { type: "email" }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder={t("auth.register.emailPlaceholder")}
                autoComplete="email"
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
                placeholder={t("auth.register.passwordPlaceholder")}
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
                placeholder={t("auth.register.retypePlaceholder")}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                {t("auth.register.button")}
              </Button>
            </Form.Item>
          </Form>
          <Divider plain className="my-2! text-xs!">
            <span className="text-xs text-foreground/50">
              {t("auth.google.divider")}
            </span>
          </Divider>
          <div className="flex justify-center">
            <GoogleButton enabled={googleEnabled} redirectTo="/profile" />
          </div>
          <p className="mt-6 text-center text-sm text-foreground/60">
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
      </Reveal>
    </div>
  );
}
