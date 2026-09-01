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
 *
 * Validasi sesi penuh (terhadap database) dilakukan di route handler;
 * proxy hanya memeriksa keberadaan cookie agar cepat.
 */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/upload",
    "/api/web/profile/:path*",
  ],
};
