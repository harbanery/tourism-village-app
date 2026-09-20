import localFont from "next/font/local";

/**
 * Font LOKAL — didaftarkan di sini dulu, lalu variabelnya dipasang di
 * app/layout.tsx (alur permintaan DROID: next-local → layout).
 * next/font mengoptimasi + meng-host file otomatis (self-host, tanpa
 * request pihak ketiga saat runtime). Format dipakai: woff2 (terkecil).
 *
 * CATATAN PENEMPATAN FILE:
 * - Master font ada di public/fonts (sesuai struktur project). File
 *   di-duplikasi ke src/assets/fonts karena Turbopack (builder default
 *   Next.js 16) TIDAK BISA memproses next/font/local yang src-nya
 *   menunjuk ke dalam public/ (panic "Missing content ... static
 *   asset"). Jika menambah/mengubah font: perbarui public/fonts LALU
 *   salin ke src/assets/fonts agar keduanya sinkron.
 * - Switzer memakai file VARIABLE (satu file untuk seluruh bobot
 *   100–900 + satu file italic-nya) — selain hemat, ini juga
 *   menghindari bug Turbopack content-hash pada src array banyak file
 *   (pernah terjadi pada GCGudlakDemo-Medium; gudlak & helvetica kini
 *   di-takeout, body memakai Switzer).
 */

/** Switzer — font body utama (variable, bobot 100–900 + italic). */
export const switzerSans = localFont({
  variable: "--font-switzer",
  display: "swap",
  src: [
    {
      path: "../../assets/fonts/switzer/Switzer-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../assets/fonts/switzer/Switzer-VariableItalic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
});

/** Paquito — font merek DesakuWisataku (bold, permintaan DROID). */
export const paquito = localFont({
  variable: "--font-paquito",
  display: "swap",
  src: [
    {
      path: "../../assets/fonts/paquito/Paquito-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
});

/** Advercase — font judul (h1–h6, via rule CSS global). */
export const advercase = localFont({
  variable: "--font-advercase",
  display: "swap",
  src: [
    {
      path: "../../assets/fonts/advercase/Advercase-Font-Demo-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/advercase/Advercase-Font-Demo-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../assets/fonts/advercase/Advercase-Font-Demo-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../assets/fonts/advercase/Advercase-Font-Demo-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
});
