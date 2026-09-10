import type { Metadata } from "next";
import AdminShell from "@/features/admin/components/layout";
import AdminGuard from "@/features/admin/components/ui/guard";

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
