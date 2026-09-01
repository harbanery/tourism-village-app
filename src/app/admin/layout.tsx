import { AdminSessionProvider } from "@/components/admin/session";

/**
 * Layout bersama seluruh halaman admin (grup (auth) dan (panel)).
 * Provider sesi dipasang di sini agar halaman di luar AdminShell
 * (mis. profile di (auth)) tetap bisa membaca role + refresh sesi.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminSessionProvider>{children}</AdminSessionProvider>;
}
