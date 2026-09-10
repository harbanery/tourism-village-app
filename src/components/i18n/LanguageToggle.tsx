"use client";

import { Dropdown } from "antd";
import { GlobalOutlined } from "@ant-design/icons";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function LanguageToggle() {
  const { locale, t, setLocale } = useLocale();
  return (
    <Dropdown
      menu={{
        selectable: true,
        selectedKeys: [locale],
        items: [
          { key: "id", label: "Bahasa Indonesia" },
          { key: "en", label: "English" },
        ],
        onClick: ({ key }) => setLocale(key as "id" | "en"),
      }}
    >
      <button
        type="button"
        aria-label={t("nav.language.toggle")}
        className="inline-flex items-center gap-1.5 cursor-pointer px-2 py-1 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10"
      >
        <GlobalOutlined />
        <span className="font-medium uppercase">{locale}</span>
      </button>
    </Dropdown>
  );
}
