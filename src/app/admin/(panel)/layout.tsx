import type { Metadata } from "next";
import AdminShell from "@/features/admin/components/layout";
import AdminGuard from "@/features/admin/components/ui/guard";
import NotificationTest from "@/features/admin/components/ui/dev/NotificationTest";
import { CookieConsent } from "@/components/ui/consent/CookieConsent";

export const metadata: Metadata = {
  title: "Panel Admin",
};

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
      {/* Banner cookie khusus halaman panel (loading/not-found/error
          admin dirender langsung di bawah admin/layout — bebas banner). */}
      <CookieConsent />
      <NotificationTest />
    </AdminGuard>
  );
}
