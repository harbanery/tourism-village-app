import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser, isSameOrigin } from "@/lib/auth";

/**
 * DELETE /api/web/profile/google — lepaskan tautan Google. Ditolak bila
 * akun tidak punya password (Google satu-satunya cara login — akun akan
 * terkunci).
 *
 * Penautan Google TIDAK lewat sini: tombol "Hubungkan Google" di settings
 * memakai alur redirect /api/web/auth/google/start?mode=link (OAuth penuh,
 * tanpa popup) yang ditangani callback.
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN_ORIGIN" },
        { status: 403 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!user.googleId) {
      return NextResponse.json(
        { success: false, error: "GOOGLE_NOT_LINKED" },
        { status: 400 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: "PASSWORD_REQUIRED" },
        { status: 409 },
      );
    }

    await prisma.authUser.update({
      where: { id: user.id },
      data: { googleId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlink Google:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
