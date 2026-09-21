import { CookieConsent } from "@/components/ui/consent/CookieConsent";

// Auth pages (login/register) render without the AdminShell sidebar.
// The root layout already provides ThemeProvider/AntdRegistry.
//
// Background memakai warna konten panel admin (antd colorBgLayout:
// #f5f5f5 light / #000000 dark) — BUKAN palet web (permintaan DROID):
// Tailwind bg-white/bg-black di project ini ter-override ke palet web,
// jadi warna literal dipakai di sini.
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f5] dark:bg-[#000000]">
      {children}
      {/* Banner cookie khusus halaman auth admin (di luar loading/
          not-found/error yang dirender langsung di bawah admin/layout). */}
      <CookieConsent />
    </div>
  );
}
