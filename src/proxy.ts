import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, USER_SESSION_COOKIE } from "@/config/variables";

/**
 * Proxy (pengganti middleware di Next.js 16) untuk proteksi rute.
 *
 * - /admin/** halaman: tanpa cookie sesi admin → redirect /admin/login.
 *   /admin/login dengan cookie sesi → redirect /admin.
 * - /api/admin/**: tanpa cookie sesi admin → 401 JSON.
 * - /api/upload: tanpa cookie sesi admin → 401 JSON.
 * - /api/web/profile*: tanpa cookie sesi user → 401 JSON.
 * - Halaman membership (/profile, /package, /checkout, /payment/**,
 *   /review-confirm): tanpa cookie sesi user → redirect ke
 *   /login?redirect=<halaman asal> agar setelah login kembali ke sana.
 * - /login, /register, /forgot-password & /reset-password dengan cookie
 *   sesi user → redirect / (sudah login tidak boleh membuka form auth).
 *
 * Validasi sesi penuh (terhadap database) dilakukan di route handler /
 * page; proxy hanya memeriksa keberadaan cookie agar cepat.
 */

/** Halaman membership yang wajib login (prefix match). */
const MEMBERSHIP_PAGE_PREFIXES = [
  "/profile",
  "/package",
  "/checkout",
  "/payment",
  "/review-confirm",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAdminCookie = request.cookies.has(ADMIN_SESSION_COOKIE);
  const hasUserCookie = request.cookies.has(USER_SESSION_COOKIE);

  // Endpoint auth selalu diizinkan (login/logout/session/register).
  if (
    pathname.startsWith("/api/admin/auth/") ||
    pathname.startsWith("/api/web/auth/")
  ) {
    return NextResponse.next();
  }

  // API admin + upload: butuh cookie sesi admin.
  if (pathname.startsWith("/api/admin") || pathname === "/api/upload") {
    if (!hasAdminCookie) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // API profil user web: butuh cookie sesi user.
  if (pathname.startsWith("/api/web/profile")) {
    if (!hasUserCookie) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  // Halaman login admin: sudah punya sesi → langsung ke panel.
  if (pathname === "/admin/login") {
    if (hasAdminCookie) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Halaman admin lainnya: wajib cookie sesi admin.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!hasAdminCookie) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Form auth web: sudah login → tidak bisa diakses lagi (kembali ke
  // beranda). /otp sengaja tidak diblokir di proxy: halaman itu sendiri
  // yang menyesuaikan guard per purpose (register vs ganti email).
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    if (hasUserCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Halaman membership: wajib cookie sesi user. Setelah login, user
  // dikembalikan ke halaman asal via param ?redirect=.
  const isMembershipPage = MEMBERSHIP_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isMembershipPage && !hasUserCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/upload",
    "/api/web/profile/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/profile/:path*",
    "/package",
    "/checkout",
    "/payment/:path*",
    "/review-confirm",
  ],
};
