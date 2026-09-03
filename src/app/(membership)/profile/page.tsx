import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getUserOrders } from "@/services/orderService";
import ProfileClientSection from "./section/ProfileClientSection";
import type { User } from "@/models";

/** Preferensi & status verifikasi akun (dipakai panel pengaturan). */
export interface ProfileSettings {
  emailVerified: boolean;
  pendingEmail: string | null;
  notifWeb: boolean;
  notifEmail: boolean;
}

/**
 * Halaman profil (area membership) — selalu mengikuti sesi login;
 * belum login dikembalikan ke halaman login.
 * Param opsional: `?view=settings` buka tab pengaturan, `&tab=email`
 * langsung ke tab ganti email (tujuan kembali dari verifikasi OTP).
 */
export default async function ProfilePage({
  searchParams,
}: PageProps<"/profile">) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/profile");
  }

  const params = await searchParams;
  const view = params.view === "settings" ? "settings" : "history";
  const settingsTab =
    params.tab === "email" ||
    params.tab === "avatar" ||
    params.tab === "notifications"
      ? params.tab
      : "profile";

  const orders = await getUserOrders(user);

  const profile: User = {
    id: user.id,
    email: user.email,
    phone: user.phone ?? null,
    name: user.name,
    gender:
      user.gender === "MALE"
        ? "male"
        : user.gender === "FEMALE"
          ? "female"
          : null,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    address: user.address ?? null,
    avatar: user.avatar ?? null,
  };

  const settings: ProfileSettings = {
    emailVerified: user.emailVerified,
    pendingEmail: user.pendingEmail,
    notifWeb: user.notifWeb,
    notifEmail: user.notifEmail,
  };

  return (
    <ProfileClientSection
      user={profile}
      settings={settings}
      orders={orders}
      initialView={view}
      initialSettingsTab={settingsTab}
    />
  );
}
