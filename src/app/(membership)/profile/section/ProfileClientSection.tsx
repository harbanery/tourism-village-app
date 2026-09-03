"use client";

import { useState } from "react";
import { Segmented } from "antd";
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
 * Konten halaman profil: kartu identitas kiri (sticky, tinggi viewport
 * dikurangi navbar) + kolom kanan yang berganti antara Riwayat Belanja
 * dan Pengaturan (bukan modal — menggantikan section riwayat).
 */
export default function ProfileClientSection({
  user,
  settings,
  orders,
}: {
  user: User;
  settings: ProfileSettings;
  orders: HistoryOrder[];
}) {
  const { t } = useT();
  const mounted = useMounted();
  const [view, setView] = useState<ProfileView>("history");
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[320px_1fr] items-start">
      {/* Kartu kiri: sticky dengan tinggi viewport - navbar (h-16). */}
      <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
        <ProfileInfoSection user={user} settings={settings} />
      </div>

      <div>
        <Segmented
          value={view}
          onChange={(value) => setView(value as ProfileView)}
          options={[
            {
              value: "history",
              icon: <HistoryOutlined />,
              label: t("profile.orderHistory"),
            },
            {
              value: "settings",
              icon: <SettingOutlined />,
              label: t("settings.title"),
            },
          ]}
        />
        {view === "history" ? (
          <OrderHistorySection orders={orders} />
        ) : (
          <SettingsSection user={user} settings={settings} />
        )}
      </div>
    </div>
  );
}
