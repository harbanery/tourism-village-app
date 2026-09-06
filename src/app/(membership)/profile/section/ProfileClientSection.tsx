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
 * Konten halaman profil: kartu identitas kiri (sticky, tinggi maksimal
 * viewport dikurangi navbar) + kolom kanan dengan Segmented (pola period
 * di dashboard admin, icon dipertahankan): Riwayat Belanja dan Pengaturan.
 * `initialView`/`initialSettingsTab` dipakai saat kembali dari verifikasi
 * OTP ganti email agar langsung terbuka di tab ganti email.
 */
export default function ProfileClientSection({
  user,
  settings,
  orders,
  hasMoreOrders = false,
  totalOrders = 0,
  initialView = "history",
  initialSettingsTab = "profile",
}: {
  user: User;
  settings: ProfileSettings;
  orders: HistoryOrder[];
  /** Masih ada pesanan berikutnya (infinite scroll). */
  hasMoreOrders?: boolean;
  /** Total seluruh pesanan user. */
  totalOrders?: number;
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

      <div className="flex min-w-0 flex-col gap-4">
        {/* Segmented view switcher — layout serupa period di dashboard admin;
            bg + jarak antar opsi diatur via .profile-segmented (global css). */}
        <Segmented
          className="profile-segmented"
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
          <OrderHistorySection
            orders={orders}
            hasMore={hasMoreOrders}
            total={totalOrders}
          />
        ) : (
          <SettingsSection
            user={user}
            settings={settings}
            initialTab={initialSettingsTab}
          />
        )}
      </div>
    </div>
  );
}
