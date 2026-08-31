"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { App, ConfigProvider, theme as antdTheme } from "antd";
import idID from "antd/locale/id_ID";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/id";

type Theme = "light" | "dark";
type Locale = "id" | "en";

const THEME_STORAGE_KEY = "tourism-village:theme";
const LOCALE_STORAGE_KEY = "tourism-village:locale";

let currentTheme: Theme = "light";
let currentLocale: Locale = "id";
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  currentTheme =
    storedTheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  currentLocale = storedLocale ?? "id";
}

function useThemeStore() {
  return useSyncExternalStore(
    subscribe,
    () => currentTheme,
    () => "light" as Theme,
  );
}

function useLocaleStore() {
  return useSyncExternalStore(
    subscribe,
    () => currentLocale,
    () => "id" as Locale,
  );
}

export function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  window.localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
  document.documentElement.classList.toggle("dark", currentTheme === "dark");
  emitChange();
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  dayjs.locale(locale);
  emitChange();
}

interface ThemeContextValue {
  theme: Theme;
  locale: Locale;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "light", locale: "id" });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore();
  const locale = useLocaleStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", currentTheme === "dark");
    document.documentElement.lang = currentLocale;
    dayjs.locale(currentLocale);
  }, []);

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, locale }}>
      <ConfigProvider
        locale={locale === "id" ? idID : enUS}
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: "#0d7a5f",
            borderRadius: 10,
            fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
            ...(isDark ? {} : { colorTextSecondary: "#595959", colorTextTertiary: "#6b7280" }),
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
