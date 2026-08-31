"use client";

import { Button, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTheme, toggleTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme } = useTheme();
  return (
    <Tooltip title={theme === "light" ? "Dark mode" : "Light mode"}>
      <Button
        type="text"
        aria-label="Toggle theme"
        icon={theme === "light" ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
      />
    </Tooltip>
  );
}
