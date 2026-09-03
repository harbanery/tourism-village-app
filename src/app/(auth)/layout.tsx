/**
 * Layout halaman auth (login & register).
 *
 * Sengaja TANPA Navbar dan Footer: form login/register tampil sendiri
 * agar fokus ke satu aksi. Halaman sudah login tidak bisa diakses
 * (guard di masing-masing page + proxy).
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
