import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/server/auth";
import { USER_SESSION_COOKIE } from "@/config/variables";

/** POST /api/web/auth/logout — hapus sesi user web. */
export async function POST() {
  const store = await cookies();
  const token = store.get(USER_SESSION_COOKIE)?.value;
  await destroySession("web", token);
  store.delete(USER_SESSION_COOKIE);
  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
