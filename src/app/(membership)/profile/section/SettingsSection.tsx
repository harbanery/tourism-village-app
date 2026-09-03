"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Avatar,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Tabs,
  Upload,
} from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
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
}

/**
 * Switch notifikasi — komponen terpisah agar state-nya di-reset tiap kali
 * modal dibuka (Modal memakai destroyOnHidden) tanpa setState di effect.
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
      <p className="text-xs text-foreground/60">{t("settings.notif.cronHint")}</p>
    </div>
  );
}

/**
 * Panel pengaturan akun: ubah profil, ubah avatar, ganti email (via OTP),
 * dan preferensi notifikasi (web notif + email + cron mendatang).
 * Modal memakai destroyOnHidden sehingga seluruh isi (form + switch)
 * selalu segar setiap dibuka — tanpa perlu sinkronisasi via effect.
 */
export function SettingsSection({
  open,
  onClose,
  user,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  settings: ProfileSettings;
}) {
  const { t } = useT();
  const router = useRouter();
  const mounted = useMounted();
  const { message } = App.useApp();

  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [emailForm] = Form.useForm<EmailFormValues>();
  const [tab, setTab] = useState("profile");
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingEmail, setRequestingEmail] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
      onClose();
      router.refresh();
    } catch {
      message.error(t("notif.error"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleRequestEmailChange = async (values: EmailFormValues) => {
    setRequestingEmail(true);
    try {
      const res = await fetch("/api/web/profile/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const result = await res.json();
      if (!result.success) {
        message.error(result.error || t("notif.error"));
        return;
      }
      // OTP dikirim ke email baru → lanjut ke halaman OTP.
      message.success(t("settings.email.otpSent"));
      const dev = result.data?.devCode ? `&dev=${result.data.devCode}` : "";
      onClose();
      router.push(`/otp?purpose=EMAIL_CHANGE${dev}`);
    } catch {
      message.error(t("notif.error"));
    } finally {
      setRequestingEmail(false);
    }
  };

  const genderLabel = (value?: "male" | "female") =>
    value ? t(`profile.${value}`) : undefined;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={t("settings.title")}
      width={520}
      destroyOnHidden
    >
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
                className="mt-2!"
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
                  <Input />
                </Form.Item>
                <Form.Item name="phone" label={t("common.phone")}>
                  <Input />
                </Form.Item>
                <Form.Item name="gender" label={t("profile.gender")}>
                  <Select
                    allowClear
                    placeholder={genderLabel(user?.gender ?? undefined)}
                    options={[
                      { value: "male", label: t("profile.male") },
                      { value: "female", label: t("profile.female") },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="birthDate" label={t("profile.birthDate")}>
                  <DatePicker className="w-full!" />
                </Form.Item>
                <Form.Item name="address" label={t("profile.address")}>
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={savingProfile} block>
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
                      onClose();
                      router.refresh();
                    } catch (err) {
                      onError?.(err as Error);
                      message.error(t("notif.error"));
                    } finally {
                      setUploadingAvatar(false);
                    }
                  }}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingAvatar}
                  >
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
              <div className="mt-2">
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
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={requestingEmail}
                    block
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
    </Modal>
  );
}
