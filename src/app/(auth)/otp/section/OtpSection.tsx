"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Form, Input } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

type OtpPurpose = "REGISTER" | "EMAIL_CHANGE";

interface OtpFormValues {
  code: string;
}

/**
 * Form verifikasi OTP 6 digit.
 * - REGISTER: POST /api/web/auth/verify-otp → auto-login → /profile.
 * - EMAIL_CHANGE: POST /api/web/profile/email/verify → kembali ke /profile.
 * `dev` = kode OTP cadangan (hanya muncul di development tanpa SMTP).
 */
export function OtpSection({
  userId,
  purpose,
  dev,
}: {
  userId: number;
  purpose: OtpPurpose;
  dev?: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();
  const [form] = Form.useForm<OtpFormValues>();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!mounted) return null;

  const isRegister = purpose === "REGISTER";

  const handleVerify = async (values: OtpFormValues) => {
    setLoading(true);
    try {
      const endpoint = isRegister
        ? "/api/web/auth/verify-otp"
        : "/api/web/profile/email/verify";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister
            ? { userId, code: values.code }
            : { code: values.code },
        ),
      });
      const result = await res.json();

      if (!result.success) {
        if (result.error === "COOLDOWN") {
          message.warning(
            t("auth.otp.cooldown", { seconds: result.seconds ?? 60 }),
          );
        } else if (result.remainingAttempts !== undefined) {
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

      message.success(
        isRegister ? t("auth.otp.verified") : t("settings.email.changed"),
      );
      router.push("/profile");
      router.refresh();
    } catch {
      message.error(t("notif.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const endpoint = isRegister
        ? "/api/web/auth/resend-otp"
        : "/api/web/profile/email";
      const body = isRegister
        ? { userId, purpose: "REGISTER_VERIFICATION" }
        : {};
      // Ganti email: kirim ulang OTP dengan request ulang email baru yang
      // sama tidak didukung (email baru sudah tersimpan di pendingEmail),
      // jadi resend hanya untuk register.
      if (!isRegister) {
        message.info(t("auth.otp.resendEmailChange"));
        return;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) {
        if (result.error === "COOLDOWN") {
          message.warning(
            t("auth.otp.cooldown", { seconds: result.seconds ?? 60 }),
          );
        } else {
          message.error(t("notif.error"));
        }
        return;
      }
      message.success(t("auth.otp.resent"));
    } catch {
      message.error(t("notif.error"));
    } finally {
      setResending(false);
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
        <div className="text-center">
          <SafetyOutlined className="text-4xl text-primary" />
          <h1 className="mt-3 text-2xl font-bold">
            {t("auth.otp.title")}
          </h1>
          <p className="mt-1 text-foreground/60">
            {isRegister
              ? t("auth.otp.subtitleRegister")
              : t("auth.otp.subtitleEmailChange")}
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
          onFinish={handleVerify}
          disabled={loading}
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
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {t("auth.otp.verify")}
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center space-y-2 text-sm">
          <p className="text-foreground/60">{t("auth.otp.notReceived")}</p>
          {isRegister && (
            <Button type="link" loading={resending} onClick={handleResend}>
              {t("auth.otp.resend")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
