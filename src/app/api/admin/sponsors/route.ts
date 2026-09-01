import prisma from "@/server/db";
import { requireAdmin, adminCanWrite } from "@/server/auth";
import { NextResponse } from "next/server";

/** GET /api/admin/sponsors — semua sponsor. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const sponsors = await prisma.sponsor.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json({ success: true, data: sponsors });
  } catch (error) {
    console.error("Error fetching sponsors:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sponsors" },
      { status: 500 },
    );
  }
}

/** POST /api/admin/sponsors — tambah sponsor (MASTER, status awal NONACTIVE). */
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
    const sponsor = await prisma.sponsor.create({
      data: {
        name: body.name,
        description: body.description || null,
        filename: body.filename || "",
        status: "NONACTIVE",
      },
    });
    return NextResponse.json(
      { success: true, data: sponsor },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating sponsor:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sponsor" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
