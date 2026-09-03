import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getOrderForUser } from "@/services/orderService";
import PaymentClientSection from "./section/PaymentClientSection";

/**
 * Halaman pembayaran order — target redirect setelah checkout dan dari
 * tombol "Bayar" order PENDING di profil. Wajib login; order harus milik
 * user sesi (bukan milik user lain).
 */
export default async function PaymentPage({
  params,
}: PageProps<"/payment/[id]">) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?redirect=/payment/${id}`);
  }

  const orderId = Number(id);
  if (!Number.isInteger(orderId)) {
    notFound();
  }

  const order = await getOrderForUser(orderId, user.id);
  if (!order) {
    notFound();
  }

  return (
    <PaymentClientSection
      order={{
        id: order.id,
        dateSchedule: order.dateSchedule,
        homestay: order.homestay === "yes",
        homestayTime: order.homestayTime,
        totalPrice: order.totalPrice,
        paymentStatus: order.paymentStatus,
        items: order.items,
      }}
    />
  );
}
