import { Martian_Mono, Style_Script } from "next/font/google";

/**
 * Font GOOGLE — dipakai untuk kebutuhan yang file-nya tidak tersedia
 * lokal di public/fonts (alur DROID: font lokal lewat next-local.ts,
 * font Google lewat sini; keduanya baru dipakai di app/layout.tsx).
 */

/** Style Script — font tulisan tangan khusus teks merek DesakuWisataku. */
export const styleScript = Style_Script({
  variable: "--font-style-script",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  fallback: ["cursive"],
  weight: "400",
});

/** Martian Mono — font mono (menggantikan Geist Mono). */
export const martianMono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian-mono",
  display: "swap",
  weight: ["400", "700"],
  adjustFontFallback: true,
  fallback: ["system-ui", "monospace"],
});
