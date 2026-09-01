import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminCanWrite, adminCanWriteBlog } from "@/server/auth";
import {
  destroyCloudinaryAsset,
  publicIdFromUrl,
  resolveUploadFolder,
  signCloudinaryParams,
} from "@/server/cloudinary";

/** Folder Cloudinary yang diizinkan per sumber upload. */
const ALLOWED_FOLDERS = ["places", "packages", "blogs", "sponsors", "misc"];

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin || !adminCanWrite(admin)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const data = await request.formData();
    const file = (data.get("image") ||
      data.get("file")) as unknown as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 },
      );
    }

    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cloudinary belum dikonfigurasi. Isi NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di .env.",
        },
        { status: 500 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subfolder per menu (mis. "places" → tourism-village/places).
    const rawFolder = data.get("folder") as string | null;
    const folder = resolveUploadFolder(rawFolder);
    if (!folder || !ALLOWED_FOLDERS.includes(rawFolder ?? "")) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid upload folder. Gunakan salah satu dari: ${ALLOWED_FOLDERS.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Hanya file gambar yang diizinkan." },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const uploadTimestamp = Math.floor(Date.now() / 1000);
    const params = {
      timestamp: uploadTimestamp,
      public_id: filename,
      folder: folder,
    };

    const signature = signCloudinaryParams(
      params,
      process.env.CLOUDINARY_API_SECRET || "",
    );

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([buffer], { type: file.type }),
      filename,
    );
    formData.append("api_key", process.env.CLOUDINARY_API_KEY || "");
    formData.append("timestamp", uploadTimestamp.toString());
    formData.append("public_id", filename);
    formData.append("folder", folder);
    formData.append("signature", signature);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      throw new Error(errorData.error?.message || "Cloudinary upload failed");
    }

    const cloudinaryData = await cloudinaryResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        url: cloudinaryData.secure_url,
        storagePath: cloudinaryData.public_id,
        resourceType: cloudinaryData.resource_type,
        mimeType: file.type,
        size: file.size,
        name: file.name,
        width: cloudinaryData.width,
        height: cloudinaryData.height,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, error: `Failed to upload file: ${message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin || !(adminCanWrite(admin) || adminCanWriteBlog(admin))) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const { searchParams } = new URL(request.url);
    const pathParam = searchParams.get("path");
    const urlParam = searchParams.get("url");
    const publicId =
      pathParam ?? (urlParam ? publicIdFromUrl(urlParam) : null);

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid asset identifier" },
        { status: 400 },
      );
    }

    const deleted = await destroyCloudinaryAsset(publicId);
    if (!deleted) {
      throw new Error("Cloudinary delete failed");
    }

    return NextResponse.json({
      success: true,
      message: "Successfully deleted asset from Cloudinary",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: `Failed to delete file: ${message}` },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
