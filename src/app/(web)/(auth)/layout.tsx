import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageToggle } from "@/components/locale/LanguageToggle";

/**
 * Layout halaman auth (login, register, lupa/reset password, OTP).
 *
 * Sengaja TANPA Navbar dan Footer: form auth tampil sendiri agar fokus
 * ke satu aksi. Tetap menyediakan toggle dark mode + bahasa di pojok
 * kanan atas (menggantikan tombol "kembali ke beranda").
 * Halaman sudah login tidak bisa diakses (guard di page + proxy).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Bar atas minimal: hanya toggle bahasa + tema */}
      <div className="flex items-center justify-end gap-1 px-4 py-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
