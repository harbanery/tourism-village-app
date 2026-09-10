import { AdminSessionProvider } from "@/features/admin/hooks/session";
import NotificationTest from "@/features/admin/components/ui/dev/NotificationTest";

/**
 * Layout bersama seluruh halaman admin (grup (auth) dan (panel)).
 * Provider sesi dipasang di sini agar halaman di luar AdminShell
 * (mis. profile di (auth)) tetap bisa membaca role + refresh sesi.
 *
 * NotificationTest: floating panel untuk menjalankan endpoint cron
 * secara manual — hanya dirender saat development (NODE_ENV).
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionProvider>
      {children}
      <NotificationTest />
    </AdminSessionProvider>
  );
}
