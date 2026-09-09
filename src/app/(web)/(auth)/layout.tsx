import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";
import { HeroBackground } from "@/components/custom/hero-background/HeroBackground";

/**
 * Layout halaman auth (login, register, lupa/reset password, OTP).
 *
 * Sengaja TANPA Navbar dan Footer: form auth tampil sendiri agar fokus
 * ke satu aksi. Background memakai HeroBackground (sama dengan home) —
 * toggle bahasa + dark mode dipaksa putih (pola actionWrap navbar web)
 * agar terbaca di atas gambar gelap, termasuk tombol bahasa yang bukan
 * komponen antd (selector &_button mencakup keduanya).
 *
 * Toggle bahasa + tema FIXED di pojok kanan atas (tidak mengambil ruang
 * alur halaman) sehingga seluruh tinggi layar tersedia untuk kartu auth.
 * Kartu rata tengah (atas-bawah kiri-kanan); konten yang lebih tinggi
 * dari layar tidak dipaksa center — container min-height (bukan height
 * fixed) sehingga halaman ikut di-scroll.
 * Halaman sudah login tidak bisa diakses (guard di page + proxy).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center px-4">
      <HeroBackground />
      {/* Toggle bahasa + tema: fixed di pojok kanan atas (putih di atas
          hero, baik light maupun dark mode — background selalu gelap). */}
      <div className="fixed top-3 right-4 z-10 flex items-center gap-1 [&_button]:text-white!">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
