import { getCurrentUser } from "@/server/auth";
import prisma from "@/server/db";
import { expireStalePendingOrders } from "@/server/orderExpiry";
import { ProfileInfoSection } from "./section/ProfileInfoSection";
import { OrderHistorySection } from "./section/OrderHistorySection";
import { LoginRequired } from "./section/LoginRequired";
import type { User } from "@/models";

/** Halaman profil — selalu mengikuti sesi login (tanpa param URL). */
export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LoginRequired />;
  }

  // Expire PENDING yang melewati batas waktu pembayaran.
  await expireStalePendingOrders();

  const orderRows = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { dateOrder: "desc" },
    include: { items: { include: { package: true } } },
  });

  const orders = orderRows.map((order) => ({
    id: order.id,
    userId: order.userId,
    userName: user.name,
    userEmail: user.email,
    userPhone: user.phone ?? null,
    dateOrder: order.dateOrder.toISOString(),
    dateSchedule: order.dateSchedule.toISOString(),
    homestay: order.homestay ? ("yes" as const) : ("no" as const),
    homestayTime: order.homestayTime,
    totalPrice: order.totalPrice,
    paymentStatus: order.paymentStatus,
    paymentExpiresAt: order.paymentExpiresAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      packageName: item.package.name,
      quantity: item.quantity,
      price: item.price,
    })),
  }));

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
