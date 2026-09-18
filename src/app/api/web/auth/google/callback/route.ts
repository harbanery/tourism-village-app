import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createSession, sessionCookieOptions } from "@/lib/auth";
import {
  GOOGLE_STATE_COOKIE,
  decodeGoogleState,
  exchangeGoogleCode,
  resolveGoogleSignIn,
} from "@/lib/google";
import { USER_SESSION_COOKIE } from "@/utils/config/variables";

/** Halaman pengaturan profil (tab keamanan) — tujuan mode link. */
const SETTINGS_URL = "/profile?view=settings&tab=security";

/** Redirect 303 ke path internal aplikasi. */
function to(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin), 303);
}

/**
 * GET /api/web/auth/google/callback — balikan consent Google (redirect
 * flow; tanpa popup GIS sehingga tidak kena blokir popup browser).
 *
 * 1. Cocokkan `state` dengan cookie (anti-CSRF) lalu hapus cookie.
 * 2. Tukar `code` → ID token terverifikasi → identitas Google.
 * 3. mode=link  → tautkan Google ke akun yang sedang login (email harus
 *    sama) lalu kembali ke pengaturan.
 *    mode=login → resolveGoogleSignIn: login langsung / taut otomatis /
 *    register otomatis → /set-password bila belum punya password.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;

  // User membatalkan consent → kembali ke login tanpa error.
  if (query.get("error") === "access_denied") {
    return to(request, "/login");
  }

  const code = query.get("code");
  const state = query.get("state");
  const cookieState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const payload = decodeGoogleState(cookieState);

  const responseBase = to(request, "/login?googleError=failed");
  responseBase.cookies.delete(GOOGLE_STATE_COOKIE);

  if (!code || !state || !payload || payload.state !== state) {
    return responseBase;
  }

  let identity;
  try {
    identity = await exchangeGoogleCode(code);
  } catch (error) {
    console.error("Error tukar code Google:", error);
    return responseBase;
  }

  if (!identity.emailVerified) {
    return to(request, "/login?googleError=unverified");
  }

  // --- Mode link: tautkan Google ke akun yang sedang login (settings). ---
  if (payload.mode === "link") {
    const user = await getCurrentUser();
    if (!user) {
      return to(request, "/login?googleError=failed");
    }

    const existing = await prisma.authUser.findUnique({
      where: { googleId: identity.sub },
    });
    if (existing && existing.id !== user.id) {
      return to(request, `${SETTINGS_URL}&googleError=linked_other`);
    }
    if (identity.email !== user.email.toLowerCase()) {
      return to(request, `${SETTINGS_URL}&googleError=email_mismatch`);
    }

    await prisma.authUser.update({
      where: { id: user.id },
      data: {
        googleId: identity.sub,
        avatar: user.avatar ?? identity.picture ?? null,
        emailVerified: true,
      },
    });
    return to(request, `${SETTINGS_URL}&googleLinked=1`);
  }

  // --- Mode login/register (tanpa form manual). ---
  const result = await resolveGoogleSignIn(identity);

  if (result.status === "INACTIVE") {
    return to(request, "/login?googleError=inactive");
  }
  if (result.status === "NEEDS_PASSWORD" || result.status === "LINK_REQUIRED") {
    return to(request, `/set-password?pending=${result.pendingToken}`);
  }

  // Login sukses → sesi + cookie + catat login terakhir.
  const { token, expiresAt } = await createSession("web", result.userId);
  await prisma.authUser.update({
    where: { id: result.userId },
    data: { lastLoginAt: new Date() },
  });
  const redirect = to(request, payload.redirectTo);
  redirect.cookies.set(
    sessionCookieOptions(USER_SESSION_COOKIE, token, expiresAt),
  );
  redirect.cookies.delete(GOOGLE_STATE_COOKIE);
  return redirect;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
