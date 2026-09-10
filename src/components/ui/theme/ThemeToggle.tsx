"use client";

import { Button, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useThemeMode } from "./ThemeProvider";
import { useT } from "@/components/i18n/LocaleProvider";

export function ThemeToggle() {
  const { mode, toggle } = useThemeMode();
  const { t } = useT();
  return (
    <Tooltip title={t("nav.theme.toggle")}>
      <Button
        type="text"
        aria-label={t("nav.theme.toggle")}
        icon={mode === "light" ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggle}
      />
    </Tooltip>
  );
}
