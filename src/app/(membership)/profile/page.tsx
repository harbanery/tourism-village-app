import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getUserOrders } from "@/services/orderService";
import { ProfileInfoSection } from "./section/ProfileInfoSection";
import { OrderHistorySection } from "./section/OrderHistorySection";
import type { User } from "@/models";

/** Preferensi & status verifikasi akun (dipakai panel pengaturan). */
export interface ProfileSettings {
  emailVerified: boolean;
  pendingEmail: string | null;
  notifWeb: boolean;
  notifEmail: boolean;
}

/**
 * Halaman profil (area membership) — selalu mengikuti sesi login
 * (tanpa param URL); belum login dikembalikan ke halaman login.
 */
export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/profile");
  }

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
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[320px_1fr] items-start">
      {/* Kartu kiri: tinggi mengikuti konten (tidak full) dan sticky
          sehingga tetap terlihat saat halaman riwayat di-scroll. */}
      <div className="lg:sticky lg:top-20">
        <ProfileInfoSection user={profile} settings={settings} />
      </div>
      <OrderHistorySection orders={orders} />
    </div>
  );
}
