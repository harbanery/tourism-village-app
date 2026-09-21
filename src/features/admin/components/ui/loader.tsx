/**
 * Loader halaman penuh saat fetch data admin: dua lingkaran mendorong
 * dari bawah (animasi push) di tengah layar (atas-bawah kiri-kanan
 * sama). Warna mengikuti tema — primary (hijau) di light mode, putih
 * di dark mode (lihat .loader-push di global CSS). Murni CSS sehingga
 * aman dipakai di Server maupun Client Component.
 *
 * Background warna konten panel admin (antd colorBgLayout: #f5f5f5
 * light / #000000 dark) — bukan palet web (bg-white/bg-black Tailwind
 * project ini ter-override ke palet web, jadi warna literal dipakai).
 */
const LoaderPage = () => {
  return (
    <div
      role="status"
      aria-label="Memuat"
      className="flex min-h-[50dvh] w-full items-center justify-center bg-[#f5f5f5] dark:bg-[#000000]"
    >
      <span className="loader-push" aria-hidden />
    </div>
  );
};

export default LoaderPage;
