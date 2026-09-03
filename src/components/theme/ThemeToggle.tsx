"use client";

import { Button, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useTheme, toggleTheme } from "./ThemeProvider";
import { useT } from "@/components/locale/LocaleProvider";

export function ThemeToggle() {
  const { theme } = useTheme();
  const { t } = useT();
  return (
    <Tooltip title={t("nav.theme.toggle")}>
      <Button
        type="text"
        aria-label={t("nav.theme.toggle")}
        icon={theme === "light" ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
      />
    </Tooltip>
  );
}
