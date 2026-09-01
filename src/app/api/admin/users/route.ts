import prisma from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/users — semua user web (MASTER | VIEWER). */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const users = await prisma.authUser.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        gender: true,
        birthDate: true,
        address: true,
        avatar: true,
        status: true,
      },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
