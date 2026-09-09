/**
 * Fallback rute (web) saat server sedang merender ulang halaman (miss
 * ISR pertama / navigasi antar rute). Data halaman utama kini disajikan
 * server-side sehingga fallback ini hanya tampil sesaat; spinner murni
 * CSS (Tailwind) agar aman dirender di Server Component.
 */
export default function WebLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid min-h-[60vh] place-items-center"
    >
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
    </div>
  );
}
