import { NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { getUserOrders } from "@/services/orderService";

/** GET /api/web/profile — data user + riwayat pesanan. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const orders = await getUserOrders(user);

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birthDate,
        address: user.address,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        pendingEmail: user.pendingEmail,
        notifWeb: user.notifWeb,
        notifEmail: user.notifEmail,
      },
      orders,
    },
  });
}

/**
 * PATCH /api/web/profile — perbarui data profil sendiri (nama, telepon,
 * jenis kelamin, tanggal lahir, alamat). Email & password tidak di sini.
 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 100)
        : undefined;
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 20)
        : null;
    const gender =
      body.gender === "MALE" || body.gender === "FEMALE"
        ? body.gender
        : null;
    const birthDate =
      typeof body.birthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)
        ? new Date(`${body.birthDate}T00:00:00Z`)
        : null;
    const address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim().slice(0, 255)
        : null;

    if (name === undefined) {
      return NextResponse.json(
        { success: false, error: "Nama wajib diisi." },
        { status: 400 },
      );
    }

    const updated = await prisma.authUser.update({
      where: { id: user.id },
      data: { name, phone, gender, birthDate, address },
      select: {
        id: true,
        name: true,
        phone: true,
        gender: true,
        birthDate: true,
        address: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
