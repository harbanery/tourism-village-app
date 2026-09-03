import { NextRequest, NextResponse } from "next/server";
import prisma from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { deleteCloudinaryUrls } from "@/server/cloudinary";

/** Batas ukuran avatar (bytes). */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/**
 * POST /api/web/profile/avatar — unggah avatar user (Cloudinary, folder
 * khusus avatars). Avatar lama dihapus bila diganti.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        { success: false, error: "Cloudinary belum dikonfigurasi." },
        { status: 500 },
      );
    }

    const data = await request.formData();
    const file = data.get("image") as unknown as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 },
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Hanya file gambar yang diizinkan." },
        { status: 400 },
      );
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { success: false, error: "Ukuran gambar maksimal 2MB." },
        { status: 400 },
      );
    }

    // Nama file random per unggahan (tanpa nama asli user).
    const filename = `avatar-${user.id}-${Date.now()}`;
    const folder = "tourism-village/avatars";

    const { signCloudinaryParams } = await import("@/server/cloudinary");
    const uploadTimestamp = Math.floor(Date.now() / 1000);
    const signature = signCloudinaryParams(
      { timestamp: uploadTimestamp, public_id: filename, folder },
      process.env.CLOUDINARY_API_SECRET || "",
    );

    const formData = new FormData();
    formData.append("file", file, filename);
    formData.append("api_key", process.env.CLOUDINARY_API_KEY || "");
    formData.append("timestamp", uploadTimestamp.toString());
    formData.append("public_id", filename);
    formData.append("folder", folder);
    formData.append("signature", signature);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData },
    );
    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      throw new Error(errorData.error?.message || "Cloudinary upload failed");
    }
    const cloudinaryData = await cloudinaryResponse.json();
    const url = cloudinaryData.secure_url as string;

    // Hapus avatar lama (best-effort) lalu simpan yang baru.
    if (user.avatar) {
      await deleteCloudinaryUrls([user.avatar]).catch(() => {});
    }
    await prisma.authUser.update({
      where: { id: user.id },
      data: { avatar: url },
    });

    return NextResponse.json({ success: true, data: { url } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { success: false, error: `Failed to upload avatar: ${message}` },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
