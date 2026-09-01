import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/server/auth";
import { ADMIN_SESSION_COOKIE } from "@/config/variables";

/** POST /api/admin/auth/logout — hapus sesi admin. */
export async function POST() {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  await destroySession("admin", token);
  store.delete(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
