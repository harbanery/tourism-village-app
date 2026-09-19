import localFont from "next/font/local";

/**
 * Font LOKAL — didaftarkan di sini dulu, lalu variabelnya dipasang di
 * app/layout.tsx (alur permintaan DROID: next-local → layout).
 * next/font mengoptimasi + meng-host file otomatis (self-host, tanpa
 * request pihak ketiga saat runtime).
 *
 * CATATAN PENEMPATAN FILE:
 * - Master font ada di public/fonts (sesuai struktur project). File
 *   di-duplikasi ke src/assets/fonts karena Turbopack (builder default
 *   Next.js 16) TIDAK BISA memproses next/font/local yang src-nya
 *   menunjuk ke dalam public/ (panic "Missing content ... static
 *   asset"). Jika menambah/mengubah font: perbarui public/fonts LALU
 *   salin ke src/assets/fonts agar keduanya sinkron.
 * - Gudlak di-takeout (permintaan DROID): body kini Helvetica Neue.
 * - Bobot yang didaftarkan dibatasi ke yang dipakai UI (400/500/700 +
 *   italic 400) — set tambahan tinggal menambah entry src; jika build
 *   panic "Missing content ... static asset", satu file font spesifik
 *   biasanya pemicunya (pernah terjadi pada GCGudlakDemo-Medium) —
 *   isolasi dengan bisect lalu ganti/file-nya dibuang.
 */

/** Helvetica Neue — font body utama (menggantikan Geist, lalu Gudlak). */
export const helveticaNeue = localFont({
  variable: "--font-helvetica",
  display: "swap",
  src: [
    {
      path: "../../assets/fonts/helveticaneue/HelveticaNeueRoman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/helveticaneue/HelveticaNeueItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../assets/fonts/helveticaneue/HelveticaNeueMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../assets/fonts/helveticaneue/HelveticaNeueBold.otf",
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
