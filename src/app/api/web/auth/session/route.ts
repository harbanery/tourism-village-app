import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";

/** GET /api/web/auth/session — user web yang sedang login. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      gender: user.gender,
      birthDate: user.birthDate,
      address: user.address,
      avatar: user.avatar,
    },
  });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
