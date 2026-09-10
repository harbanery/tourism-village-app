/**
 * Loader halaman penuh saat fetch data admin: dua lingkaran mendorong
 * dari bawah (animasi push) di tengah layar (atas-bawah kiri-kanan
 * sama). Warna mengikuti tema — primary (hijau) di light mode, putih
 * di dark mode (lihat .loader-push di global CSS). Murni CSS sehingga
 * aman dipakai di Server maupun Client Component.
 */
const LoaderPage = () => {
  return (
    <div
      role="status"
      aria-label="Memuat"
      className="flex min-h-[50dvh] w-full items-center justify-center"
    >
      <span className="loader-push" aria-hidden />
    </div>
  );
};

export default LoaderPage;
