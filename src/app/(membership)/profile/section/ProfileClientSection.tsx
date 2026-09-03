"use client";

import { useState } from "react";
import { Tabs } from "antd";
import { HistoryOutlined, SettingOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { useMounted } from "@/helpers/useMounted";
import type { User } from "@/models";
import { ProfileInfoSection } from "./ProfileInfoSection";
import { OrderHistorySection, type HistoryOrder } from "./OrderHistorySection";
import { SettingsSection } from "./SettingsSection";
import type { ProfileSettings } from "../page";

export type ProfileView = "history" | "settings";

/**
 * Konten halaman profil: kartu identitas kiri (sticky, tinggi maksimal
 * viewport dikurangi navbar) + kolom kanan ber-Tab: Riwayat Belanja dan
 * Pengaturan (bukan modal — menggantikan section riwayat).
 * `initialView`/`initialSettingsTab` dipakai saat kembali dari verifikasi
 * OTP ganti email agar langsung terbuka di tab ganti email.
 */
export default function ProfileClientSection({
  user,
  settings,
  orders,
  initialView = "history",
  initialSettingsTab = "profile",
}: {
  user: User;
  settings: ProfileSettings;
  orders: HistoryOrder[];
  initialView?: ProfileView;
  initialSettingsTab?: "profile" | "avatar" | "email" | "notifications";
}) {
  const { t } = useT();
  const mounted = useMounted();
  const [view, setView] = useState<ProfileView>(initialView);
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 grid gap-8 lg:grid-cols-[320px_1fr] items-start">
      {/* Kartu kiri: sticky; tinggi menyesuaikan konten namun dibatasi
          viewport - navbar, detail profil di-scroll bila melebihi. */}
      <div className="lg:sticky lg:top-20">
        <ProfileInfoSection user={user} settings={settings} />
      </div>

      <Tabs
        activeKey={view}
        onChange={(key) => setView(key as ProfileView)}
        items={[
          {
            key: "history",
            icon: <HistoryOutlined />,
            label: t("profile.orderHistory"),
            children: <OrderHistorySection orders={orders} />,
          },
          {
            key: "settings",
            icon: <SettingOutlined />,
            label: t("settings.title"),
            children: (
              <SettingsSection
                user={user}
                settings={settings}
                initialTab={initialSettingsTab}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
