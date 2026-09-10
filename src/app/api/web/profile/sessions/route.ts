import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * DELETE /api/web/profile/sessions — keluar dari SEMUA perangkat
 * (rekomendasi 2.1): cabut seluruh sesi user login, termasuk sesi
 * aktif permintaan ini → klien diarahkan ke /login setelahnya.
 */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { count } = await prisma.userSession.deleteMany({
    where: { userId: user.id },
  });

  return NextResponse.json({ success: true, data: { revoked: count } });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
