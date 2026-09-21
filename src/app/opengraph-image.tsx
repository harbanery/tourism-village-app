import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";
import { BASE_URL, META_DESCRIPTION, META_TITLE } from "@/utils/config/variables";

export const alt = META_TITLE ?? "DesakuWisataku — Website Desa Wisata";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Baca aset lokal jadi data URL agar bisa dirender satori (next/og). */
const toDataURL = (relativePath: string): string | null => {
  try {
    // Aset dibaca saat build (route statis) — beri tahu Turbopack agar
    // tidak men-trace seluruh project karena operasi filesystem ini.
    const file = readFileSync(
      join(/*turbopackIgnore: true*/ process.cwd(), relativePath),
    );
    return `data:image/png;base64,${file.toString("base64")}`;
  } catch {
    return null;
  }
};

/**
 * Background OG image = hero home (hero-a.png, permintaan DROID) —
 * dibaca saat build; bila gagal, jatuh ke warna solid secondary.
 */
const backgroundSrc = toDataURL("public/images/hero-a.png");

/**
 * Font STATIS (bukan variable) untuk satori/next/og: opentype.js yang
 * dibundel tidak mem-parse tabel `fvar` pada variable font. Brand memakai
 * Paquito Bold (font-script merek DesakuWisataku), teks memakai Advercase
 * Bold (font display judul) — keduanya sudah ada di public/fonts.
 */
const paquitoBoldFont = (() => {
  try {
    return readFileSync(
      join(
        /*turbopackIgnore: true*/ process.cwd(),
        "public/fonts/paquito/Paquito-Bold.ttf",
      ),
    );
  } catch {
    return null;
  }
})();

const advercaseBoldFont = (() => {
  try {
    return readFileSync(
      join(
        /*turbopackIgnore: true*/ process.cwd(),
        "public/fonts/advercase/Advercase-Font-Demo-Bold.otf",
      ),
    );
  } catch {
    return null;
  }
})();

/** Host BASE_URL tanpa protokol (mis. https://x.dev → x.dev). */
const baseUrlHost = (() => {
  try {
    return BASE_URL ? new URL(BASE_URL).host : null;
  } catch {
    return null;
  }
})();

/**
 * Daftar font untuk satori — weight diketik literal (700) sesuai
 * `Weight` milik next/og (number biasa ditolak type-nya).
 */
const ogFonts: {
  name: string;
  data: Buffer;
  weight: 700;
  style: "normal";
}[] = [];
if (paquitoBoldFont) {
  ogFonts.push({
    name: "Paquito",
    data: paquitoBoldFont,
    weight: 700,
    style: "normal",
  });
}
if (advercaseBoldFont) {
  ogFonts.push({
    name: "Advercase",
    data: advercaseBoldFont,
    weight: 700,
    style: "normal",
  });
}

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        ...size,
        display: "flex",
        position: "relative",
        backgroundColor: "#0d4715",
      }}
    >
      {/* Background sama seperti hero home (hero-a.png). */}
      {backgroundSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundSrc}
          alt=""
          width={size.width}
          height={size.height}
          style={{
            position: "absolute",
            objectFit: "cover",
          }}
        />
      ) : null}

      {/* Overlay gradasi palet DROID: midnight forest → forest crown,
          plus lapisan gelap agar teks putih tetap terbaca. */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundImage:
            "linear-gradient(to right, rgba(13, 71, 21, 0.82), rgba(65, 100, 74, 0.48))",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.28)",
        }}
      />

      {/* Aksen bar kiri — vintage paper. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 16,
          backgroundColor: "#ebe1d1",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Brand — Paquito Bold (font-script), pola navbar home. */}
        <div
          style={{
            display: "flex",
            fontFamily: '"Paquito", sans-serif',
            fontSize: 96,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.05,
          }}
        >
          Desaku
          <span style={{ color: "#9dbba4" }}>Wisataku</span>
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: '"Advercase", sans-serif',
            fontSize: 30,
            fontWeight: 700,
            color: "#e8e3d5",
            marginTop: 28,
            maxWidth: 900,
          }}
        >
          {META_DESCRIPTION ??
            "Website desa wisata — paket wisata, galeri, vlog, dan artikel."}
        </div>
        {baseUrlHost ? (
          <div
            style={{
              display: "flex",
              fontFamily: '"Advercase", sans-serif',
              fontSize: 26,
              fontWeight: 700,
              color: "#c7d2c9",
              marginTop: 48,
              padding: "12px 0",
              borderRadius: 12,
            }}
          >
            {baseUrlHost}
          </div>
        ) : null}
      </div>
    </div>,
    {
      ...size,
      ...(ogFonts.length > 0 ? { fonts: ogFonts } : {}),
    },
  );
}
