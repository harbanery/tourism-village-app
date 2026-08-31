"use client";

import { useTheme, setLocale } from "@/components/theme/ThemeProvider";
import { translations, translate, DEFAULT_LOCALE, type Locale } from "./translations";

export function useT() {
  const { locale } = useTheme();
  const dict = translations[locale] ?? translations[DEFAULT_LOCALE];
  const t = (key: string, params?: Record<string, string | number>) =>
    translate(dict, key, params);
  return { t, locale, setLocale };
}

export type { Locale };
