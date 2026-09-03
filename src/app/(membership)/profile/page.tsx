import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getUserOrders } from "@/services/orderService";
import { ProfileInfoSection } from "./section/ProfileInfoSection";
import { OrderHistorySection } from "./section/OrderHistorySection";
import type { User } from "@/models";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[320px_1fr]">
      <ProfileInfoSection user={profile} />
      <OrderHistorySection orders={orders} />
    </div>
  );
}
