"use client";

import { Layout } from "antd";

const { Content } = Layout;

const ContentLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Content
    style={{
      padding: "16px 24px",
      background: "none",
      display: "flex",
      flexGrow: 1,
      flexDirection: "column",
      width: "100%",
      minWidth: 0,
    }}
  >
    {children}
  </Content>
);

export default ContentLayout;
