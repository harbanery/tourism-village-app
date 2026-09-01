import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/server/db";
import {
  createSession,
  hashPassword,
  sessionCookieOptions,
} from "@/server/auth";
import { USER_SESSION_COOKIE, BASE_URL } from "@/config/variables";
import { sendEmail } from "@/server/email";
import { buildCredentialEmail } from "@/server/credentialEmail";

/**
 * POST /api/web/auth/register — registrasi user web (email + password).
 * Mengirim rich email kredensial bila SMTP dikonfigurasi.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body as Record<string, unknown>;

    if (
      typeof name !== "string" ||
      name.trim().length === 0 ||
      typeof email !== "string" ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Data tidak valid. Password minimal 8 karakter.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.authUser.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email sudah terdaftar." },
        { status: 409 },
      );
    }

    const hashed = await hashPassword(password);
    const user = await prisma.authUser.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
      },
    });

    // Kirim rich email kredensial (best-effort).
    const payload = buildCredentialEmail({
      name: user.name,
      username: user.email,
      password,
      loginUrl: `${BASE_URL}/login`,
      generatedAt: new Date(),
    });
    void sendEmail({ to: user.email, ...payload });

    // Langsung login setelah registrasi.
    const { token, expiresAt } = await createSession("web", user.id);
    const store = await cookies();
    store.set(sessionCookieOptions(USER_SESSION_COOKIE, token, expiresAt));

    return NextResponse.json(
      {
        success: true,
        data: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error register user:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
