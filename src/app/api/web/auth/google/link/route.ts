import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import {
  consumePendingLinkToken,
  createSession,
  hashPassword,
  isSameOrigin,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { USER_SESSION_COOKIE } from "@/utils/config/variables";

/** Aturan password (sama seperti register/reset): 8+ karakter, huruf + angka. */
function isNewPasswordValid(password: string): boolean {
  return (
    password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
  );
}

/**
 * POST /api/web/auth/google/link — buat password dari token pending SSO.
 * Dipakai halaman /set-password (alur redirect OAuth Google):
 *
 * `pendingToken` (sekali pakai, 15 menit) diterbitkan saat SSO menjawab
 * NEEDS_PASSWORD (akun Google-only baru — register pasca-SSO) atau
 * LINK_REQUIRED (akun manual yang emailnya belum terverifikasi). Token
 * hanya diterbitkan setelah ID token Google terverifikasi server, jadi
 * kepemilikan email sudah terbukti: password BARU boleh dibuat tanpa
 * password lama (pola lupa password).
 *
 * Setelah sukses: password tersimpan, emailVerified=true, dan user
 * langsung login (sesi web dibuat).
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN_ORIGIN" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { pendingToken, password } = body as Record<string, unknown>;

    if (typeof pendingToken !== "string" || pendingToken.length === 0) {
      return NextResponse.json(
        { success: false, error: "PENDING_TOKEN_INVALID" },
        { status: 400 },
      );
    }
    if (typeof password !== "string" || !isNewPasswordValid(password)) {
      return NextResponse.json(
        { success: false, error: "NEW_PASSWORD_INVALID" },
        { status: 400 },
      );
    }

    const pending = await consumePendingLinkToken(pendingToken);
    if (!pending) {
      return NextResponse.json(
        { success: false, error: "PENDING_TOKEN_INVALID" },
        { status: 400 },
      );
    }

    const user = await prisma.authUser.findUnique({
      where: { id: pending.userId },
    });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "ACCOUNT_NOT_FOUND" },
        { status: 404 },
      );
    }

    // Password baru tidak boleh sama dengan password aktif (bila ada).
    if (user.password && (await verifyPassword(password, user.password))) {
      return NextResponse.json(
        { success: false, error: "NEW_PASSWORD_SAME" },
        { status: 400 },
      );
    }

    const updated = await prisma.authUser.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(password),
        // Token pending hanya diterbitkan setelah email terverifikasi via
        // Google → kepemilikan email sudah terbukti.
        emailVerified: true,
      },
    });

    // Langsung login setelah password dibuat.
    const { token, expiresAt } = await createSession("web", updated.id);
    await prisma.authUser.update({
      where: { id: updated.id },
      data: { lastLoginAt: new Date() },
    });
    const store = await cookies();
    store.set(sessionCookieOptions(USER_SESSION_COOKIE, token, expiresAt));

    return NextResponse.json({
      success: true,
      data: { id: updated.id, name: updated.name, email: updated.email },
    });
  } catch (error) {
    console.error("Error Google link/password:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
