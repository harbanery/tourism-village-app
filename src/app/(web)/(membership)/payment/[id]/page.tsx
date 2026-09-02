import { notFound, redirect } from "next/navigation";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import PaymentClientSection from "./section/PaymentClientSection";

/**
 * Halaman pembayaran order — target redirect setelah checkout dan dari
 * tombol "Bayar" order PENDING di profil. Wajib login; order harus milik
 * user sesi (bukan milik user lain).
 */
export default async function PaymentPage({
  params,
}: PageProps<"/payment/[id]">) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    notFound();
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { items: { include: { package: true } } },
  });
  if (!order) {
    notFound();
  }

  return (
    <PaymentClientSection
      order={{
        id: order.id,
        dateSchedule: order.dateSchedule.toISOString(),
        homestay: order.homestay,
        homestayTime: order.homestayTime,
        totalPrice: order.totalPrice,
        paymentStatus: order.paymentStatus,
        items: order.items.map((item) => ({
          id: item.id,
          packageName: item.package.name,
          quantity: item.quantity,
          price: item.price,
        })),
      }}
    />
  );
}
