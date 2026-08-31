import type { Metadata } from "next";
import AdminShell from "@/components/admin/layout";

export const metadata: Metadata = {
  title: "Panel Admin",
};

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
