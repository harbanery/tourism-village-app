"use client";

import { useCallback, useEffect, useState } from "react";
import { Layout } from "antd";
import SiderLayout from "./sider";
import HeaderLayout from "./header";
import ContentLayout from "./content";
import Footer from "./footer";
import type { AdminRole } from "@prisma/client";

export interface AdminSessionInfo {
  id: number;
  username: string;
  name: string | null;
  role: AdminRole;
}

/** Context sederhana via props: shell memegang sesi admin untuk sider/header. */
const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<AdminSessionInfo | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/auth/session");
      const result = await res.json();
      if (result.success) {
        setSession(result.data as AdminSessionInfo);
      }
    } catch {
      // Proxy akan redirect ke login bila sesi invalid.
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchSession);
  }, [fetchSession]);

  return (
    <Layout style={{ minHeight: "100vh" }} hasSider>
      <SiderLayout
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        role={session?.role ?? null}
      />

      <Layout
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          position: "relative",
        }}
      >
        <HeaderLayout
          session={session}
          onMobileMenuClick={() => setMobileOpen(true)}
        />
        <ContentLayout>{children}</ContentLayout>
        <Footer />
      </Layout>
    </Layout>
  );
};

export default AdminShell;
