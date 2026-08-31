"use client";

import { useState } from "react";
import { Layout } from "antd";
import SiderLayout from "./sider";
import HeaderLayout from "./header";
import ContentLayout from "./content";
import Footer from "./footer";

const AdminShell = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
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
  );
};

export default AdminShell;
