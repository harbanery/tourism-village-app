import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserOrdersPage } from "@/services/order";
import { GOOGLE_IS_CONFIGURED } from "@/utils/config/variables";
import ProfileClientSection from "./section/ProfileClientSection";
import type { User } from "@/features/web/types";

/** Preferensi & status verifikasi akun (dipakai panel pengaturan). */
export interface ProfileSettings {
  emailVerified: boolean;
  pendingEmail: string | null;
  notifWeb: boolean;
  notifEmail: boolean;
  /** Akun tertaut ke Google (SSO aktif untuk akun ini). */
  googleLinked: boolean;
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
    params.tab === "security" ||
    params.tab === "email" ||
    params.tab === "avatar" ||
    params.tab === "password" ||
    params.tab === "notifications"
      ? params.tab
      : "profile";

  // Halaman pertama riwayat (3 order teratas: PENDING dulu, lalu PAID,
  // terbaru duluan, tie-break reservasi paling awal) — sisanya dimuat
  // via infinite scroll dari klien.
  const ordersPage = await getUserOrdersPage(user, { take: 3, skip: 0 });

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
    googleLinked: user.googleId !== null,
  };

  // Hasil alur taut Google dari callback OAuth (?googleLinked / ?googleError).
  const googleStatus =
    params.googleLinked === "1"
      ? ("linked" as const)
      : params.googleError === "email_mismatch" ||
          params.googleError === "linked_other"
        ? (params.googleError as "email_mismatch" | "linked_other")
        : null;

  return (
    <ProfileClientSection
      user={profile}
      settings={settings}
      orders={ordersPage.items}
      hasMoreOrders={ordersPage.hasMore}
      totalOrders={ordersPage.total}
      initialView={view}
      initialSettingsTab={settingsTab}
      googleEnabled={GOOGLE_IS_CONFIGURED}
      googleStatus={googleStatus}
    />
  );
}
