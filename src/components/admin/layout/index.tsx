"use client";

import { useState } from "react";
import { Layout } from "antd";
import SiderLayout from "./sider";
import HeaderLayout from "./header";
import ContentLayout from "./content";
import Footer from "./footer";
import { AdminSessionProvider } from "@/components/admin/session";

/** Shell panel admin: sider + header + konten + footer, sesi via context. */
const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AdminSessionProvider>
      <Layout style={{ minHeight: "100vh" }} hasSider>
        <SiderLayout
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
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
          <HeaderLayout onMobileMenuClick={() => setMobileOpen(true)} />
          <ContentLayout>{children}</ContentLayout>
          <Footer />
        </Layout>
      </Layout>
    </AdminSessionProvider>
  );
};

export default AdminShell;
