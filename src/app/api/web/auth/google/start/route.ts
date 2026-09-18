import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_TTL_MINUTES,
  buildGoogleAuthUrl,
  encodeGoogleState,
  newGoogleState,
  sanitizeInternalPath,
} from "@/lib/google";
import { NODE_ENV } from "@/utils/config/variables";

/**
 * GET /api/web/auth/google/start — mulai alur OAuth Google (redirect penuh,
 * tanpa popup — tombolnya cukup Button antd biasa).
 *
 * Query:
 * - `redirect`: path internal tujuan setelah login sukses.
 * - `mode=link`: tautkan Google ke akun yang sedang login (dari settings).
 *
 * State acak disimpan di cookie httpOnly (10 menit) dan dicocokkan di
 * callback — melindungi dari CSRF/open-redirect.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "link" ? "link" : "login";
  const redirectTo = sanitizeInternalPath(
    url.searchParams.get("redirect"),
    "/profile",
  );

  const state = newGoogleState();
  const redirect = NextResponse.redirect(buildGoogleAuthUrl(state));
  redirect.cookies.set({
    name: GOOGLE_STATE_COOKIE,
    value: encodeGoogleState({ state, redirectTo, mode }),
    httpOnly: true,
    sameSite: "lax",
    secure: NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_STATE_TTL_MINUTES * 60,
  });
  return redirect;
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
