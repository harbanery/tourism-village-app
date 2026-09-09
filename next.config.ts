import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Gambar konten (tempat wisata, blog, sponsor) disimpan di Cloudinary.
    // URL Cloudinary umumnya sudah bertransformasi f_auto/q_auto (lihat
    // utils/image) dan dipakai unoptimized; remotePatterns mengizinkan
    // optimizer untuk URL Cloudinary tanpa transformasi.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
