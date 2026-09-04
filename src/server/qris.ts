import prisma from "@/server/db";
import { PAYMENT_EXPIRY_MINUTES } from "@/config/variables";
import { createQrisCharge, type QrisChargeResult } from "@/server/midtrans";
import type { AuthUser, Order, OrderItem, Package } from "@prisma/client";

/**
 * QRIS POS integration — memastikan order punya QR aktif.
 *
 * Membuat charge QRIS sekali (Core API /charge, payment_type qris) lalu
 * menyimpan payload + URL gambar QR ke order; kunjungan berikutnya memakai
 * QR tersimpan. order_id Midtrans deterministik (TOURISM-{id}) sehingga
 * endpoint status/notifikasi bisa menemukan transaksinya.
 */

type OrderWithItems = Order & {
  items: (OrderItem & { package: Package })[];
};

interface EnsureQrisInput {
  order: OrderWithItems;
  customer: { name: string; email: string; phone?: string | null };
}

/** Ambil (atau buat) QR untuk order PENDING. null = gagal / bukan PENDING. */
export async function ensureOrderQris(
  input: EnsureQrisInput,
): Promise<QrisChargeResult | null> {
  const { order, customer } = input;
  if (order.paymentStatus !== "PENDING") return null;
  if (order.qrisString) {
    return { qrString: order.qrisString, qrImageUrl: order.qrisImageUrl };
  }

  // item.price menyimpan SUBTOTAL; harga satuan = subtotal/qty.
  // Selisih pembulatan ditampung di item terakhir agar jumlahnya persis
  // sama dengan gross_amount (Midtrans menolak selisih).
  const items = order.items.map((item) => ({
    id: String(item.packageId),
    price: Math.round(item.price / Math.max(1, item.quantity)),
    quantity: item.quantity,
    name: item.package.name,
  }));
  const itemsSum = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (items.length > 0) {
    const last = items[items.length - 1];
    last.price += Math.round((order.totalPrice - itemsSum) / last.quantity);
  }

  const charge = await createQrisCharge({
    midtransOrderId: `TOURISM-${order.id}`,
    grossAmount: order.totalPrice,
    items,
    customer,
    expiryMinutes: PAYMENT_EXPIRY_MINUTES,
  });
  if (!charge) return null;

  await prisma.order.update({
    where: { id: order.id },
    data: { qrisString: charge.qrString, qrisImageUrl: charge.qrImageUrl },
  });
  return charge;
}

/** Bentuk customer minimal dari AuthUser (untuk charge QRIS). */
export function customerFromUser(user: AuthUser): {
  name: string;
  email: string;
  phone?: string | null;
} {
  return { name: user.name, email: user.email, phone: user.phone };
}
