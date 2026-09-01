import { randomBytes } from "node:crypto";
import prisma from "@/server/db";
import { requireAdmin, adminCanWrite, hashPassword } from "@/server/auth";
import { BASE_URL } from "@/config/variables";
import { sendEmail } from "@/server/email";
import { buildCredentialEmail } from "@/server/credentialEmail";
import { NextResponse } from "next/server";

/** Generate password acak kuat (tanpa karakter ambigu). */
const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
const GENERATED_PASSWORD_LENGTH = 12;

function generatePassword(): string {
  const bytes = randomBytes(GENERATED_PASSWORD_LENGTH);
  let out = "";
  for (let i = 0; i < GENERATED_PASSWORD_LENGTH; i++) {
    out += PASSWORD_CHARS[bytes[i] % PASSWORD_CHARS.length];
  }
  return out;
}

/** GET /api/admin/admins — semua admin (MASTER | VIEWER). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const admins = await prisma.authAdmin.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        role: true,
        status: true,
      },
    });
    return NextResponse.json({ success: true, data: admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admins" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/admins — tambah admin baru (MASTER).
 * Password digenerate server-side lalu dikirim via rich email;
 * password polos juga dikembalikan sekali di response untuk ditampilkan.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const body = await request.json();
    const { username, email, name, role } = body as Record<string, unknown>;

    if (
      typeof username !== "string" ||
      username.trim().length < 3 ||
      typeof email !== "string" ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      typeof role !== "string" ||
      !["MASTER", "VIEWER", "AUTHOR"].includes(role)
    ) {
      return NextResponse.json(
        { success: false, error: "Data admin tidak valid." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const dupEmail = await prisma.authAdmin.findUnique({
      where: { email: normalizedEmail },
    });
    const dupUsername = await prisma.authAdmin.findUnique({
      where: { username: username.trim() },
    });
    if (dupEmail || dupUsername) {
      return NextResponse.json(
        { success: false, error: "Email atau username sudah dipakai." },
        { status: 409 },
      );
    }

    const password = generatePassword();
    const hashed = await hashPassword(password);

    const created = await prisma.authAdmin.create({
      data: {
        email: normalizedEmail,
        username: username.trim(),
        name: typeof name === "string" && name.trim() ? name.trim() : null,
        password: hashed,
        role: role as "MASTER" | "VIEWER" | "AUTHOR",
        status: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        status: true,
      },
    });

    // Kirim rich email kredensial (best-effort).
    const roleLabelMap: Record<string, string> = {
      MASTER: "Master (semua akses)",
      VIEWER: "Viewer (hanya melihat)",
      AUTHOR: "Author (hanya blog)",
    };
    const payload = buildCredentialEmail({
      name: created.name ?? created.username,
      username: created.username,
      password,
      loginUrl: `${BASE_URL}/admin/login`,
      roleLabel: roleLabelMap[role] ?? undefined,
      generatedAt: new Date(),
    });
    void sendEmail({ to: created.email, ...payload });

    // Password polos dikembalikan SEKALI untuk ditampilkan di UI.
    return NextResponse.json(
      { success: true, data: { ...created, password } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create admin" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
