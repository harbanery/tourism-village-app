import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/server/auth";

/** GET /api/admin/auth/session — admin yang sedang login. */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  return NextResponse.json({
    success: true,
    data: {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      name: admin.name,
      avatar: admin.avatar,
      role: admin.role,
      status: admin.status,
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
