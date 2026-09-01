import type { Metadata } from "next";
import AdminShell from "@/components/admin/layout";
import AdminGuard from "@/components/admin/guard";

export const metadata: Metadata = {
  title: "Panel Admin",
};

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
