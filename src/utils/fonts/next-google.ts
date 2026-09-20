import { Geist_Mono } from "next/font/google";

/**
 * Font GOOGLE — dipakai untuk kebutuhan yang file-nya tidak tersedia
 * lokal di public/fonts (alur DROID: font lokal lewat next-local.ts,
 * font Google lewat sini; keduanya baru dipakai di app/layout.tsx).
 */

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  weight: ["400", "700"],
  adjustFontFallback: true,
  fallback: ["system-ui", "monospace"],
});
