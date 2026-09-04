"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, App, Button, Card, Input } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";

type OtpPurpose = "REGISTER" | "EMAIL_CHANGE" | "RESET_PASSWORD";

/** Detik → format m:ss (untuk countdown tampilan). */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Form verifikasi OTP 6 digit — tombol verifikasi dihilangkan: kode
 * dikirim otomatis begitu 6 digit terisi penuh.
 * - REGISTER: POST /api/web/auth/verify-otp → ke /login
 *   (flow: registrasi → otp → login, TANPA auto-login).
 * - RESET_PASSWORD: POST /api/web/auth/verify-otp → /reset-password?token=…
 *   (OTP dikonsumsi + token reset sekali pakai diterbitkan server).
 * - EMAIL_CHANGE: POST /api/web/profile/email/verify → kembali ke tab
 *   ganti email di /profile.
 *
 * Kirim ulang: countdown 5 menit antar kirim; setelah 5 kali kirim ulang
 * kena rate limit 15 menit (dijaga server, klien hanya menampilkan).
 * `dev` = kode OTP cadangan (hanya muncul di development tanpa SMTP).
 */
export function OtpSection({
  userId,
  purpose,
  dev,
  initialCountdown = 300,
}: {
  userId: number;
  purpose: OtpPurpose;
  dev?: string;
  /** Sisa cooldown kirim (detik) bila OTP dikirim sebelum halaman ini. */
  initialCountdown?: number;
}) {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  /** Countdown kirim ulang (detik); 0 = boleh kirim ulang. */
  const [resendIn, setResendIn] = useState(initialCountdown);
  /** true saat kena rate limit (countdown panjang, tombol nonaktif). */
  const [rateLimited, setRateLimited] = useState(false);

  // Tick countdown tiap detik sampai habis.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          setRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendIn > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const isRegister = purpose === "REGISTER";
  const isReset = purpose === "RESET_PASSWORD";

  const handleVerify = useCallback(
    async (value: string) => {
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
              ? { code: value }
              : {
                  userId,
                  code: value,
                  ...(isReset ? { purpose: "RESET_PASSWORD" } : {}),
                },
          ),
        });
        const result = await res.json();

        if (!result.success) {
          if (result.error === "COOLDOWN") {
            message.warning(
              t("auth.otp.cooldown", { seconds: result.seconds ?? 300 }),
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
          // Gagal → kosongkan agar user bisa mengetik ulang (auto-submit).
          setCode("");
          return;
        }

        if (isReset) {
          // OTP reset valid & dikonsumsi → token reset sekali pakai.
          message.success(t("auth.otp.verifiedReset"));
          router.replace(`/reset-password?token=${result.data.token}`);
          return;
        }

        if (isRegister) {
          // Flow registrasi: verifikasi email → login (tanpa auto-login).
          message.success(t("auth.otp.verified"));
          router.replace("/login");
          return;
        }

        // Flow ganti email: kembali ke tab ganti email di pengaturan profil.
        message.success(t("settings.email.changed"));
        router.replace("/profile?view=settings&tab=email");
      } catch {
        message.error(t("notif.error"));
        setCode("");
      } finally {
        setLoading(false);
      }
    },
    [isRegister, isReset, message, purpose, router, t, userId],
  );

  /** Auto-submit: begitu 6 digit terisi penuh, verifikasi langsung. */
  const handleChange = (value: string) => {
    setCode(value);
    if (/^\d{6}$/.test(value) && !loading) {
      void handleVerify(value);
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
        if (result.error === "RATE_LIMITED") {
          // 5 kali kirim ulang tercapai → tunggu sisa jendela rate limit.
          setRateLimited(true);
          setResendIn(result.seconds ?? 15 * 60);
          message.warning(
            t("auth.otp.rateLimited", {
              time: formatCountdown(result.seconds ?? 15 * 60),
            }),
          );
        } else if (result.error === "COOLDOWN") {
          setResendIn(result.seconds ?? 300);
          message.warning(
            t("auth.otp.cooldown", { seconds: result.seconds ?? 300 }),
          );
        } else {
          message.error(t("notif.error"));
        }
        return;
      }
      // Kode baru terkirim → mulai ulang countdown 5 menit.
      setRateLimited(false);
      setResendIn(300);
      setCode("");
      message.success(t("auth.otp.resent"));
      if (result.resendsLeft !== undefined) {
        message.info(t("auth.otp.resendsLeft", { count: result.resendsLeft }));
      }
    } catch {
      message.error(t("notif.error"));
    } finally {
      setResending(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <Card>
        <div className="text-center">
          <SafetyOutlined className="text-4xl text-primary" />
          <h1 className="mt-3 text-2xl font-bold">{t("auth.otp.title")}</h1>
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

        {/* Tanpa tombol verifikasi — submit otomatis saat 6 digit terisi. */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <Input.OTP
            autoFocus
            length={6}
            inputMode="numeric"
            disabled={loading}
            value={code}
            onChange={handleChange}
          />
          {loading && (
            <p className="text-xs text-foreground/50">{t("common.loading")}</p>
          )}
        </div>

        <div className="mt-6 text-center space-y-2 text-sm">
          <p className="text-foreground/60">{t("auth.otp.notReceived")}</p>
          {purpose !== "EMAIL_CHANGE" && (
            <Button
              type="link"
              loading={resending}
              disabled={resendIn > 0 || rateLimited}
              onClick={handleResend}
            >
              {resendIn > 0
                ? t("auth.otp.resendIn", { time: formatCountdown(resendIn) })
                : t("auth.otp.resend")}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
