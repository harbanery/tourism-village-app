/**
 * Loading screen root (fallback seluruh rute): ripple memancar di tengah
 * layar (atas-bawah kiri-kanan sama) + teks brand. Warna mengikuti tema —
 * primary (hijau) di light mode, putih di dark mode (lihat .loader-ripple
 * di global CSS). Server Component murni CSS, tanpa hydration.
 */
export default function RootLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat"
      className="grid min-h-dvh place-items-center bg-background"
    >
      <div className="flex flex-col items-center">
        <span className="loader-ripple" aria-hidden />
        <p className="-mt-4 text-lg font-bold tracking-tight text-foreground">
          Desaku<span className="text-primary">Wisataku</span>
        </p>
      </div>
    </div>
  );
}
