import { randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/prisma";
import { createPendingLinkToken } from "@/lib/auth";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  GOOGLE_IS_CONFIGURED,
} from "@/utils/config/variables";

/**
 * Integrasi Google Sign-In (pola lib/ integrasi pihak ketiga yang memegang
 * secret — hanya server-side; bukan Firebase).
 *
 * Alur OAuth 2.0 REDIRECT (tanpa popup GIS, tanpa script pihak ketiga):
 * 1. Klik tombol antd → GET /api/web/auth/google/start → 302 ke consent
 *    Google bersama `state` acak yang disimpan di cookie httpOnly.
 * 2. Google mengembalikan `code` ke /api/web/auth/google/callback.
 * 3. Server menukar code (client secret) → ID token → diverifikasi
 *    (signature + audience) → identitas email/nama/foto.
 * 4. resolveGoogleSignIn() memetakan identitas ke akun: login, taut,
 *    register otomatis, atau wajib buat password (/set-password).
 */

/** Cookie state anti-CSRF alur OAuth (dibuat start, dicek callback). */
export const GOOGLE_STATE_COOKIE = "tourism_oauth_state";

/** Umur state OAuth (menit). */
export const GOOGLE_STATE_TTL_MINUTES = 10;

export interface GoogleIdentity {
  /** Subject Google — id unik akun (disimpan ke AuthUser.googleId). */
  sub: string;
  email: string;
  /** Email sudah diverifikasi oleh Google. */
  emailVerified: boolean;
  name: string;
  /** URL foto profil Google (opsional). */
  picture?: string;
}

/** Hanya path internal yang boleh jadi tujuan redirect (anti open-redirect). */
export function sanitizeInternalPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function oauthClient(): OAuth2Client {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );
}

/** URL consent Google (dipanggil route start dengan state acak). */
export function buildGoogleAuthUrl(state: string): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("access_type", "online");
  return url.toString();
}

/** State acak untuk link consent ↔ callback (anti-CSRF). */
export function newGoogleState(): string {
  return randomBytes(16).toString("base64url");
}

/** Payload cookie state (dibuat start, diverifikasi callback). */
export interface GoogleStatePayload {
  state: string;
  redirectTo: string;
  mode: "login" | "link";
}

export function encodeGoogleState(payload: GoogleStatePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeGoogleState(raw: string | undefined): GoogleStatePayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as Partial<GoogleStatePayload>;
    if (
      typeof parsed.state !== "string" ||
      typeof parsed.redirectTo !== "string" ||
      (parsed.mode !== "login" && parsed.mode !== "link")
    ) {
      return null;
    }
    return parsed as GoogleStatePayload;
  } catch {
    return null;
  }
}

/**
 * Tukar authorization code → ID token terverifikasi → identitas Google.
 * Melempar Error bila pertukaran/verifikasi gagal.
 */
export async function exchangeGoogleCode(code: string): Promise<GoogleIdentity> {
  const { tokens } = await oauthClient().getToken(code);
  const idToken = tokens.id_token;
  if (!idToken) throw new Error("NO_ID_TOKEN");

  const ticket = await oauthClient().verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) throw new Error("INVALID_GOOGLE_TOKEN");

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name ?? "",
    picture: payload.picture,
  };
}

// ---------------------------------------------------------------------------
// Resolusi identitas Google → akun (dipakai callback login)
// ---------------------------------------------------------------------------

export type GoogleSignInResult =
  | { status: "SESSION"; userId: string }
  | { status: "NEEDS_PASSWORD"; pendingToken: string }
  | { status: "LINK_REQUIRED"; pendingToken: string }
  | { status: "INACTIVE" };

/**
 * Petakan identitas Google (email sudah diverifikasi Google) ke akun:
 * - googleId cocok          → login langsung.
 * - email cocok + terverifikasi / tanpa password → taut otomatis + login
 *   (atau NEEDS_PASSWORD bila belum punya password — register pasca-SSO).
 * - email cocok + BELUM terverifikasi OTP → LINK_REQUIRED (token pending);
 *   mencegah pembajakan akun manual via akun Google.
 * - belum ada akun          → buat akun baru tanpa password → NEEDS_PASSWORD.
 */
export async function resolveGoogleSignIn(
  identity: GoogleIdentity,
): Promise<GoogleSignInResult> {
  let user = await prisma.authUser.findUnique({
    where: { googleId: identity.sub },
  });

  if (!user) {
    user = await prisma.authUser.findUnique({
      where: { email: identity.email },
    });

    if (user?.password && !user.emailVerified) {
      // Akun manual belum verifikasi OTP → wajib bukti pemilik via password.
      const pendingToken = await createPendingLinkToken(user.id);
      return { status: "LINK_REQUIRED", pendingToken };
    }

    if (user) {
      // Email terverifikasi (atau akun Google-only) → taut otomatis.
      user = await prisma.authUser.update({
        where: { id: user.id },
        data: {
          googleId: identity.sub,
          avatar: user.avatar ?? identity.picture ?? null,
        },
      });
    } else {
      // Register tanpa form: akun dibuat otomatis tanpa password.
      user = await prisma.authUser.create({
        data: {
          email: identity.email,
          name: identity.name || identity.email.split("@")[0],
          password: null,
          googleId: identity.sub,
          avatar: identity.picture ?? null,
          // Email sudah diverifikasi Google — tanpa OTP.
          emailVerified: true,
        },
      });
    }
  }

  if (user.status !== "ACTIVE") {
    return { status: "INACTIVE" };
  }

  // Akun Google-only belum punya password → wajib buat password pertama.
  if (!user.password) {
    const pendingToken = await createPendingLinkToken(user.id);
    return { status: "NEEDS_PASSWORD", pendingToken };
  }

  return { status: "SESSION", userId: user.id };
}

/** true bila Google SSO aktif (client ID + secret terisi). */
export function isGoogleConfigured(): boolean {
  return GOOGLE_IS_CONFIGURED;
}
