"use client";

import { Button, Dropdown } from "antd";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { FlagGB, FlagID } from "../ui/logo";

/**
 * Bendera bahasa digambar sebagai SVG inline — Windows tidak merender
 * emoji bendera (hanya huruf kode), jadi SVG memastikan bendera tampil
 * konsisten di semua OS.
 */

/** Bahasa yang tersedia: bendera + nama aslinya. */
const LANGUAGES = {
  id: { flag: <FlagID />, label: "Bahasa Indonesia" },
  en: { flag: <FlagGB />, label: "English" },
} as const;

type Locale = keyof typeof LANGUAGES;

export function LanguageToggle() {
  const { locale, t, setLocale } = useLocale();
  return (
    <Dropdown
      menu={{
        selectable: true,
        selectedKeys: [locale],
        items: (Object.keys(LANGUAGES) as Locale[]).map((key) => ({
          key,
          label: (
            <span className="inline-flex items-center gap-2">
              {LANGUAGES[key].flag}
              {LANGUAGES[key].label}
            </span>
          ),
        })),
        onClick: ({ key }) => setLocale(key as Locale),
      }}
    >
      <Button
        type="text"
        aria-label={t("nav.language.toggle")}
        icon={LANGUAGES[locale as Locale].flag}
      />
    </Dropdown>
  );
}
