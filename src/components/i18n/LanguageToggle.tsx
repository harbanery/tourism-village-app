"use client";

import { Button, Dropdown } from "antd";
import { useLocale } from "@/components/i18n/LocaleProvider";

/**
 * Bendera bahasa digambar sebagai SVG inline — Windows tidak merender
 * emoji bendera (hanya huruf kode), jadi SVG memastikan bendera tampil
 * konsisten di semua OS.
 */

/** Bendera Indonesia (merah atas, putih bawah). */
function FlagID() {
  return (
    <svg
      viewBox="0 0 20 15"
      width="16"
      height="12"
      aria-hidden="true"
      className="shrink-0 rounded-[2px] ring-1 ring-black/10"
    >
      <rect width="20" height="7.5" fill="#C8102E" />
      <rect y="7.5" width="20" height="7.5" fill="#fff" />
    </svg>
  );
}

/** Bendera Inggris / Union Jack (bendera bahasa Inggris). */
function FlagGB() {
  return (
    <svg
      viewBox="0 0 30 20"
      width="16"
      height="12"
      aria-hidden="true"
      className="shrink-0 rounded-[2px] ring-1 ring-black/10"
    >
      <rect width="30" height="20" fill="#012169" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
      <path d="M0 0l30 20M30 0L0 20" stroke="#C8102E" strokeWidth="2" />
      <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="7" />
      <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="4" />
    </svg>
  );
}

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
