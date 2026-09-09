import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";
import { HeroBackground } from "@/app/(web)/(public)/(home)/section/HeroBackground";

/**
 * Layout halaman auth (login, register, lupa/reset password, OTP).
 *
 * Sengaja TANPA Navbar dan Footer: form auth tampil sendiri agar fokus
 * ke satu aksi. Background memakai HeroBackground (sama dengan home) —
 * toggle bahasa + dark mode dipaksa putih (pola actionWrap navbar web)
 * agar terbaca di atas gambar gelap.
 *
 * Kartu form rata tengah (atas-bawah kiri-kanan). Konten card yang lebih
 * tinggi dari layar tidak dipaksa center: container min-height (bukan
 * height fixed) + padding bawah sehingga halaman ikut di-scroll.
 * Halaman sudah login tidak bisa diakses (guard di page + proxy).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col">
      <HeroBackground />
      {/* Bar atas minimal: hanya toggle bahasa + tema (putih di atas hero). */}
      <div className="flex items-center justify-end gap-1 px-4 py-3 [&_.ant-btn]:text-white!">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-10">
        {children}
      </div>
    </div>
  );
}
