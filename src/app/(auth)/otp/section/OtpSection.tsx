"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Form, Input } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

type OtpPurpose = "REGISTER" | "EMAIL_CHANGE" | "RESET_PASSWORD";

interface OtpFormValues {
  code: string;
}

/**
 * Form verifikasi OTP 6 digit.
 * - REGISTER: POST /api/web/auth/verify-otp → ke /login
 *   (flow: registrasi → otp → login, TANPA auto-login).
 * - RESET_PASSWORD: POST /api/web/auth/verify-otp (peek) → /reset-password
 *   (password baru diisi di sana; flow: lupa password → otp → reset → login).
 * - EMAIL_CHANGE: POST /api/web/profile/email/verify → kembali ke tab
 *   ganti email di /profile (flow: profile → otp → profile ganti email).
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
  const isReset = purpose === "RESET_PASSWORD";
  const isEmailChange = purpose === "EMAIL_CHANGE";

  const handleVerify = async (values: OtpFormValues) => {
    setLoading(true);
    try {
      // REGISTER & RESET_PASSWORD diverifikasi lewat verify-otp;
      // EMAIL_CHANGE lewat endpoint profile (berbasis sesi login).
      const endpoint =
        purpose === "EMAIL_CHANGE"
          ? "/api/web/profile/email/verify"
          : "/api/web/auth/verify-otp";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          purpose === "EMAIL_CHANGE"
            ? { code: values.code }
            : {
                userId,
                code: values.code,
                ...(isReset ? { purpose: "RESET_PASSWORD" } : {}),
              },
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

      if (isReset) {
        // OTP reset valid → pra-isi kode di halaman reset (API memverifikasi
        // ulang + mengonsumsinya saat password baru disimpan).
        sessionStorage.setItem("resetOtpCode", values.code);
        message.success(t("auth.otp.verifiedReset"));
        router.push(`/reset-password?userId=${userId}`);
        router.refresh();
        return;
      }

      if (isRegister) {
        // Flow registrasi: verifikasi email → login (tanpa auto-login).
        message.success(t("auth.otp.verified"));
        router.push("/login");
        router.refresh();
        return;
      }

      // Flow ganti email: kembali ke tab ganti email di pengaturan profil.
      message.success(t("settings.email.changed"));
      router.push("/profile?view=settings&tab=email");
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
      // EMAIL_CHANGE: OTP dikirim ulang lewat pengajuan ganti email di
      // pengaturan profil (email baru tersimpan sebagai pendingEmail).
      if (purpose === "EMAIL_CHANGE") {
        message.info(t("auth.otp.resendEmailChange"));
        return;
      }
      const res = await fetch("/api/web/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          purpose: isReset ? "RESET_PASSWORD" : "REGISTER_VERIFICATION",
        }),
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
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {/* Tanpa tombol kembali ke beranda; khusus ganti email sediakan jalan
          kembali ke pengaturan email di profil (bagian flow-nya). */}
      {isEmailChange && (
        <button
          type="button"
          onClick={() => router.push("/profile?view=settings&tab=email")}
          className="cursor-pointer! bg-transparent! text-sm! text-foreground/60! hover:text-foreground!"
        >
          ← {t("auth.otp.backToEmailSettings")}
        </button>
      )}
      <Card className={isEmailChange ? "mt-4!" : undefined}>
        <div className="text-center">
          <SafetyOutlined className="text-4xl text-primary" />
          <h1 className="mt-3 text-2xl font-bold">
            {t("auth.otp.title")}
          </h1>
          <p className="mt-1 text-foreground/60">
            {isRegister
              ? t("auth.otp.subtitleRegister")
              : isReset
                ? t("auth.otp.subtitleReset")
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
          {purpose !== "EMAIL_CHANGE" && (
            <Button type="link" loading={resending} onClick={handleResend}>
              {t("auth.otp.resend")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
