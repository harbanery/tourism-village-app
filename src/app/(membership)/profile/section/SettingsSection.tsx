"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  App,
  Avatar,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Tabs,
  Upload,
} from "antd";
import {
  SafetyOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import type { User } from "@/models";
import type { ProfileSettings } from "../page";

interface ProfileFormValues {
  name: string;
  phone?: string;
  gender?: "male" | "female";
  birthDate?: Dayjs;
  address?: string;
}

interface EmailFormValues {
  email: string;
  password: string;
}

/**
 * Switch notifikasi — komponen terpisah agar state-nya bersih tanpa
 * perlu setState di effect.
 */
function NotifSwitches({ settings }: { settings: ProfileSettings }) {
  const { t } = useT();
  const { message } = App.useApp();
  const [notifWeb, setNotifWeb] = useState(settings.notifWeb);
  const [notifEmail, setNotifEmail] = useState(settings.notifEmail);
  const [saving, setSaving] = useState(false);

  const handleChange = async (
    key: "notifWeb" | "notifEmail",
    value: boolean,
  ) => {
    if (key === "notifWeb") setNotifWeb(value);
    else setNotifEmail(value);
    setSaving(true);
    try {
      const res = await fetch("/api/web/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const result = await res.json();
      if (!result.success) {
        // Kembalikan nilai semula bila gagal.
        if (key === "notifWeb") setNotifWeb(!value);
        else setNotifEmail(!value);
        message.error(t("notif.error"));
        return;
      }
      message.success(t("common.saved"));
    } catch {
      if (key === "notifWeb") setNotifWeb(!value);
      else setNotifEmail(!value);
      message.error(t("notif.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{t("settings.notif.web")}</p>
          <p className="text-xs text-foreground/60">
            {t("settings.notif.webDesc")}
          </p>
        </div>
        <Switch
          checked={notifWeb}
          loading={saving}
          onChange={(value) => handleChange("notifWeb", value)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">{t("settings.notif.email")}</p>
          <p className="text-xs text-foreground/60">
            {t("settings.notif.emailDesc")}
          </p>
        </div>
        <Switch
          checked={notifEmail}
          loading={saving}
          onChange={(value) => handleChange("notifEmail", value)}
        />
      </div>
      <p className="text-xs text-foreground/60">
        {t("settings.notif.cronHint")}
      </p>
    </div>
  );
}

/** Detik → format m:ss (untuk countdown tampilan). */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Section pengaturan akun (menggantikan section riwayat belanja, bukan
 * modal): ubah profil, ubah avatar, ganti email (via OTP), dan preferensi
 * notifikasi (web notif + email + cron mendatang).
 *
 * Ganti email memakai MODAL OTP (bukan pindah halaman): modal tidak bisa
 * ditutup sampai OTP berhasil — mencegah kebingungan alur & redirect.
 */
export function SettingsSection({
  user,
  settings,
  initialTab = "profile",
}: {
  user: User | null;
  settings: ProfileSettings;
  /** Tab awal (mis. "email" saat kembali dari verifikasi OTP ganti email). */
  initialTab?: "profile" | "avatar" | "email" | "notifications";
}) {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();

  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [emailForm] = Form.useForm<EmailFormValues>();
  const [tab, setTab] = useState<string>(initialTab);
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingEmail, setRequestingEmail] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // --- Modal OTP ganti email (non-closeable sampai OTP berhasil) ---
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  /** Countdown kirim ulang (detik); 0 = boleh kirim ulang. */
  const [otpResendIn, setOtpResendIn] = useState(300);
  const [otpRateLimited, setOtpRateLimited] = useState(false);
  /** Permintaan terakhir (untuk kirim ulang OTP tanpa isi form lagi). */
  const [lastEmailRequest, setLastEmailRequest] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [otpDevCode, setOtpDevCode] = useState<string | undefined>();
  const [otpTargetEmail, setOtpTargetEmail] = useState("");

  // Tick countdown kirim ulang OTP tiap detik.
  useEffect(() => {
    if (otpResendIn <= 0) return;
    const timer = setInterval(() => {
      setOtpResendIn((prev) => {
        if (prev <= 1) {
          setOtpRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendIn > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const handleSaveProfile = async (values: ProfileFormValues) => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone ?? "",
          gender: values.gender ? values.gender.toUpperCase() : "",
          birthDate: values.birthDate
            ? values.birthDate.format("YYYY-MM-DD")
            : "",
          address: values.address ?? "",
        }),
      });
      const result = await res.json();
      if (!result.success) {
        message.error(result.error || t("notif.error"));
        return;
      }
      message.success(t("common.saved"));
      router.refresh();
    } catch {
      message.error(t("notif.error"));
    } finally {
      setSavingProfile(false);
    }
  };

  /** Ajukan ganti email (kirim OTP ke email baru). Hasil: ok + devCode. */
  const requestEmailChange = async (
    email: string,
    password: string,
  ): Promise<{
    ok: boolean;
    devCode?: string;
    cooldownSeconds?: number;
    rateLimited?: boolean;
  }> => {
    const res = await fetch("/api/web/profile/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!result.success) {
      // Password salah → tampilkan error pada field password-nya langsung.
      if (
        result.error === "INVALID_PASSWORD" ||
        result.error === "PASSWORD_REQUIRED"
      ) {
        emailForm.setFields([
          {
            name: "password",
            errors: [t("settings.email.wrongPassword")],
          },
        ]);
        return { ok: false };
      }
      // Rate limit kirim ulang → sinyalkan ke modal (countdown panjang).
      if (result.error === "RATE_LIMITED") {
        return {
          ok: false,
          rateLimited: true,
          cooldownSeconds: result.seconds ?? 15 * 60,
        };
      }
      message.error(result.error || t("notif.error"));
      return { ok: false };
    }
    return {
      ok: true,
      devCode: result.data?.devCode,
      cooldownSeconds: result.data?.cooldownSeconds,
    };
  };

  const handleRequestEmailChange = async (values: EmailFormValues) => {
    setRequestingEmail(true);
    try {
      const result = await requestEmailChange(values.email, values.password);
      if (!result.ok) {
        // Rate limit saat meminta ulang dari tab email → tampilkan pesan.
        if (result.rateLimited) {
          message.warning(
            t("auth.otp.rateLimited", {
              time: formatCountdown(result.cooldownSeconds ?? 15 * 60),
            }),
          );
        }
        return;
      }
      // OTP terkirim ke email baru → buka modal OTP (non-closeable).
      setLastEmailRequest({ email: values.email, password: values.password });
      setOtpTargetEmail(values.email);
      setOtpDevCode(result.devCode);
      setOtpCode("");
      setOtpRateLimited(false);
      setOtpResendIn(result.cooldownSeconds ?? 300);
      setOtpOpen(true);
      message.success(t("settings.email.otpSent"));
    } catch {
      message.error(t("notif.error"));
    } finally {
      setRequestingEmail(false);
    }
  };

  /** Verifikasi OTP ganti email — otomatis saat 6 digit terisi. */
  const handleOtpVerify = async (value: string) => {
    setOtpVerifying(true);
    try {
      const res = await fetch("/api/web/profile/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      const result = await res.json();
      if (!result.success) {
        if (result.remainingAttempts !== undefined) {
          message.error(
            t("auth.otp.invalidRemaining", {
              count: result.remainingAttempts,
            }),
          );
        } else {
          message.error(t("notif.error"));
        }
        setOtpCode("");
        return;
      }
      // Berhasil → tutup modal & segarkan data profil.
      setOtpOpen(false);
      setLastEmailRequest(null);
      setOtpCode("");
      setOtpDevCode(undefined);
      emailForm.resetFields();
      message.success(t("settings.email.changed"));
      router.refresh();
    } catch {
      message.error(t("notif.error"));
      setOtpCode("");
    } finally {
      setOtpVerifying(false);
    }
  };

  /** Auto-submit: begitu 6 digit terisi penuh, verifikasi langsung. */
  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    if (/^\d{6}$/.test(value) && !otpVerifying) {
      void handleOtpVerify(value);
    }
  };

  /** Kirim ulang OTP ganti email (ajukan ulang dengan data form terakhir). */
  const handleOtpResend = async () => {
    if (!lastEmailRequest) return;
    setOtpResending(true);
    try {
      const result = await requestEmailChange(
        lastEmailRequest.email,
        lastEmailRequest.password,
      );
      if (!result.ok) {
        // Rate limit → kunci kirim ulang selama sisa jendela (15 menit).
        if (result.rateLimited) {
          setOtpRateLimited(true);
          setOtpResendIn(result.cooldownSeconds ?? 15 * 60);
          message.warning(
            t("auth.otp.rateLimited", {
              time: formatCountdown(result.cooldownSeconds ?? 15 * 60),
            }),
          );
        }
        return;
      }
      setOtpDevCode(result.devCode);
      setOtpCode("");
      setOtpRateLimited(false);
      setOtpResendIn(result.cooldownSeconds ?? 300);
      message.success(t("auth.otp.resent"));
    } catch {
      message.error(t("notif.error"));
    } finally {
      setOtpResending(false);
    }
  };

  return (
    <Card title={t("settings.title")}>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "profile",
            label: t("settings.tab.profile"),
            children: (
              <Form
                form={profileForm}
                layout="vertical"
                onFinish={handleSaveProfile}
                disabled={savingProfile}
                className="mt-2! max-w-md!"
                initialValues={{
                  name: user?.name,
                  phone: user?.phone ?? undefined,
                  gender: user?.gender ?? undefined,
                  birthDate: user?.birthDate
                    ? dayjs(user.birthDate)
                    : undefined,
                  address: user?.address ?? undefined,
                }}
              >
                <Form.Item
                  name="name"
                  label={t("common.name")}
                  rules={[{ required: true }]}
                >
                  <Input placeholder={t("auth.register.namePlaceholder")} />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label={t("common.phone")}
                  rules={[
                    { required: true },
                    {
                      pattern: /^[+()\-\s\d]{6,20}$/,
                      message: t("auth.register.phonePattern"),
                    },
                  ]}
                >
                  <Input placeholder="08..." />
                </Form.Item>
                <Form.Item name="gender" label={t("profile.gender")}>
                  <Select
                    allowClear
                    placeholder={t("profile.genderPlaceholder")}
                    options={[
                      { value: "male", label: t("profile.male") },
                      { value: "female", label: t("profile.female") },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="birthDate" label={t("profile.birthDate")}>
                  <DatePicker
                    className="w-full!"
                    placeholder={t("profile.birthDatePlaceholder")}
                  />
                </Form.Item>
                <Form.Item name="address" label={t("profile.address")}>
                  <Input.TextArea
                    rows={2}
                    placeholder={t("profile.addressPlaceholder")}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={savingProfile}
                >
                  {t("common.save")}
                </Button>
              </Form>
            ),
          },
          {
            key: "avatar",
            label: t("settings.tab.avatar"),
            children: (
              <div className="flex flex-col items-center gap-4 py-4">
                <Avatar size={112} src={user?.avatar} icon={<UserOutlined />} />
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  maxCount={1}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    setUploadingAvatar(true);
                    try {
                      const formData = new FormData();
                      formData.append("image", file as File);
                      const res = await fetch("/api/web/profile/avatar", {
                        method: "POST",
                        body: formData,
                      });
                      const result = await res.json();
                      if (!result.success) {
                        message.error(result.error || t("notif.error"));
                        onError?.(new Error(result.error));
                        return;
                      }
                      onSuccess?.(result);
                      message.success(t("common.saved"));
                      router.refresh();
                    } catch (err) {
                      onError?.(err as Error);
                      message.error(t("notif.error"));
                    } finally {
                      setUploadingAvatar(false);
                    }
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingAvatar}>
                    {t("settings.avatar.upload")}
                  </Button>
                </Upload>
                <p className="text-xs text-foreground/60">
                  {t("settings.avatar.hint")}
                </p>
              </div>
            ),
          },
          {
            key: "email",
            label: t("settings.tab.email"),
            children: (
              <div className="mt-2 max-w-md">
                <p className="text-sm text-foreground/60">
                  {t("settings.email.current")}: <b>{user?.email}</b>
                </p>
                {settings.pendingEmail && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {t("profile.pendingEmail", {
                      email: settings.pendingEmail,
                    })}
                  </p>
                )}
                <Form
                  form={emailForm}
                  layout="vertical"
                  className="mt-4!"
                  preserve={false}
                  onFinish={handleRequestEmailChange}
                  disabled={requestingEmail}
                >
                  <Form.Item
                    name="email"
                    label={t("settings.email.new")}
                    rules={[
                      { required: true },
                      { type: "email" },
                      () => ({
                        validator(_, value) {
                          if (!value || value === user?.email) {
                            return Promise.reject(
                              new Error(t("settings.email.same")),
                            );
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <Input placeholder="email-baru@example.com" />
                  </Form.Item>
                  {/* Password aktif: keamanan — pastikan pengajuan datang
                      dari pemilik akun (bukan orang lain di sesi terbuka). */}
                  <Form.Item
                    name="password"
                    label={t("settings.email.password")}
                    rules={[{ required: true }]}
                  >
                    <Input.Password
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={requestingEmail}
                  >
                    {t("settings.email.sendOtp")}
                  </Button>
                </Form>
                <p className="mt-3 text-xs text-foreground/60">
                  {t("settings.email.hint")}
                </p>
              </div>
            ),
          },
          {
            key: "notifications",
            label: t("settings.tab.notifications"),
            children: <NotifSwitches settings={settings} />,
          },
        ]}
      />

      {/* Modal OTP ganti email — TIDAK bisa ditutup sampai OTP berhasil
          (closable/maskClosable/keyboard dimatikan, tanpa tombol batal). */}
      <Modal
        open={otpOpen}
        closable={false}
        maskClosable={false}
        keyboard={false}
        footer={null}
        title={
          <span className="inline-flex items-center gap-2">
            <SafetyOutlined className="text-primary" />
            {t("settings.email.otpTitle")}
          </span>
        }
      >
        <p className="text-sm text-foreground/60">
          {t("settings.email.otpSentTo", { email: otpTargetEmail })}
        </p>
        {otpDevCode && (
          <Alert
            className="mt-3!"
            type="info"
            showIcon
            message={t("auth.otp.devCode")}
            description={
              <span className="font-mono text-lg font-bold tracking-widest">
                {otpDevCode}
              </span>
            }
          />
        )}
        <div className="mt-4 flex flex-col items-center gap-2">
          {/* Tanpa tombol verifikasi — submit otomatis saat 6 digit terisi. */}
          <Input.OTP
            autoFocus
            length={6}
            inputMode="numeric"
            disabled={otpVerifying}
            value={otpCode}
            onChange={handleOtpChange}
          />
          {otpVerifying && (
            <p className="text-xs text-foreground/50">{t("common.loading")}</p>
          )}
        </div>
        <div className="mt-4 text-center text-sm space-y-2">
          <p className="text-foreground/60">{t("auth.otp.notReceived")}</p>
          <Button
            type="link"
            loading={otpResending}
            disabled={otpResendIn > 0 || otpRateLimited}
            onClick={handleOtpResend}
          >
            {otpResendIn > 0
              ? t("auth.otp.resendIn", { time: formatCountdown(otpResendIn) })
              : t("auth.otp.resend")}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
