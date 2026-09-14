import type { NextConfig } from "next";

/**
 * Security headers (rekomendasi 2.4 + 2.6). CSP mengizinkan:
 * - Cloudinary & picsum (gambar konten), QR Midtrans (img-src).
 * - Embed YouTube (frame-src) untuk dokumentasi video.
 * - beacons @vercel/analytics (va.vercel-scripts.com) di connect-src.
 *
 * Catatan CSP (hasil verifikasi kode Next 16 di node_modules):
 * - 'unsafe-eval' HANYA di development (HMR/React refresh memerlukannya);
 *   di produksi dihilangkan (rekomendasi 2.6) — bundle produksi Next
 *   tidak memakai eval.
 * - 'unsafe-inline' pada script-src tetap diperlukan: Next menyematkan
 *   data flight/streaming sebagai <script> inline, dan halaman publik
 *   situs ini statis/ISR (revalidate 60) — nonce per-request dari proxy
 *   akan terkunci saat cache terisi (nonce basi) sehingga semua script
 *   terblokir. Nonce hanya aman untuk route yang selalu dinamis.
 * - va.vercel-scripts.com di script-src sebagai fallback host untuk
 *   skrip analytics yang disuntik runtime.
 */
const IS_DEV = process.env.NODE_ENV === "development";

const CSP_SCRIPT_SRC = [
  "'self'",
  "'unsafe-inline'",
  ...(IS_DEV ? ["'unsafe-eval'"] : []),
  "https://va.vercel-scripts.com",
].join(" ");

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
      `script-src ${CSP_SCRIPT_SRC}`,
      "font-src 'self' data:",
      "connect-src 'self' https://va.vercel-scripts.com",
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
