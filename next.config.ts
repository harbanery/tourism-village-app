import type { NextConfig } from "next";

/**
 * Security headers (rekomendasi 2.4). CSP mengizinkan:
 * - Cloudinary & picsum (gambar konten), QR Midtrans (img-src).
 * - Embed YouTube (frame-src) untuk dokumentasi video.
 * - 'unsafe-inline'/'unsafe-eval' script: Next.js (hydration & dev) —
 *   nonce-based CSP menyusul bila dipindah ke middleware.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "img-src 'self' data: blob: https://res.cloudinary.com https://picsum.photos https://*.midtrans.com",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src https://www.youtube.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Hilangkan header X-Powered-By (rekomendasi 2.4).
  poweredByHeader: false,
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
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
