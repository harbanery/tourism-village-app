import { Martian_Mono } from "next/font/google";

/**
 * Font GOOGLE — dipakai untuk kebutuhan yang file-nya tidak tersedia
 * lokal di public/fonts (alur DROID: font lokal lewat next-local.ts,
 * font Google lewat sini; keduanya baru dipakai di app/layout.tsx).
 */

/** Martian Mono — font mono (menggantikan Geist Mono). */
export const martianMono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian-mono",
  display: "swap",
  weight: ["400", "700"],
  adjustFontFallback: true,
  fallback: ["system-ui", "monospace"],
});
