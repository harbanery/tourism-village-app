"use client";

import { App, ConfigProvider, theme } from "antd";
import idID from "antd/locale/id_ID";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/locale/LocaleProvider";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  /** true setelah mode klien selesai dihidrasi (render konsisten). */
  hydrated: boolean;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  hydrated: false,
  toggle: () => {},
  setMode: () => {},
});

const STORAGE_KEY = "tourism-village:theme";

// Store level-modul (pola progress-self): SSR & render awal client selalu
// "light" agar tidak terjadi hydration mismatch; setelah mount nilai
// persisten/preferensi sistem diterapkan lewat store eksternal.
let clientMode: ThemeMode = "light";
let clientHydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getModeSnapshot(): ThemeMode {
  return clientMode;
}

function getHydratedSnapshot(): boolean {
  return clientHydrated;
}

function getServerSnapshot(): ThemeMode {
  return "light";
}

function getServerHydrated(): boolean {
  return false;
}

function readPersistedMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyMode(next: ThemeMode): void {
  clientMode = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  const root = document.documentElement;
  if (next === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
  emit();
}

/**
 * Provider tema aplikasi (pola progress-self):
 * - State light/dark (persist localStorage, default preferensi sistem).
 * - Class `dark` pada <html> agar Tailwind dark: variant aktif.
 * - Menyuplai antd ConfigProvider dengan algoritma tema + locale aktif.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getModeSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribe,
    getHydratedSnapshot,
    getServerHydrated,
  );
  const { locale } = useLocale();

  useEffect(() => {
    const lang = locale === "id" ? "id" : "en";
    dayjs.locale(lang);
    // Sinkronkan atribut lang <html> agar aksesibilitas & SEO sesuai locale.
    document.documentElement.lang = lang;
  }, [locale]);

  // Setelah mount: baca nilai persisten & terapkan sekali (tanpa setState
  // React; applyMode memutasi store eksternal + emit).
  useEffect(() => {
    const persisted = readPersistedMode();
    if (persisted !== clientMode) {
      applyMode(persisted);
    } else {
      const root = document.documentElement;
      if (persisted === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
    clientHydrated = true;
    emit();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    applyMode(next);
  }, []);

  const toggle = useCallback(() => {
    applyMode(clientMode === "light" ? "dark" : "light");
  }, []);

  const isDark = mode === "dark";

  return (
    <ThemeContext.Provider value={{ mode, hydrated, toggle, setMode }}>
      <ConfigProvider
        locale={locale === "id" ? idID : enUS}
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: "#0d7a5f",
            borderRadius: 10,
            fontFamily:
              "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
            // Override kontras WCAG (minimal 4.5:1 pada background terang).
            ...(isDark
              ? {}
              : {
                  colorTextSecondary: "#595959",
                  colorTextTertiary: "#6b7280",
                }),
          },
          components: {
            Statistic: {
              titleFontSize: 14,
              ...(isDark ? {} : { contentFontSize: 24 }),
            },
            Tabs: {
              ...(isDark ? {} : { itemActiveColor: "#0d7a5f" }),
            },
          },
        }}
      >
        {/*
          App membungkus seluruh aplikasi agar message/notification/modal
          kontekstual (App.useApp) mengonsumsi tema dinamis (dark/light).
        */}
        <App>{children}</App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

/** Hook mode tema (pola progress-self). */
export function useThemeMode(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Kompatibilitas: hook lama {theme, locale}. */
export function useTheme() {
  const { mode } = useThemeMode();
  const { locale } = useLocale();
  return { theme: mode, locale };
}

/** Kompatibilitas: aksi toggle tema lama. */
export function toggleTheme() {
  applyMode(clientMode === "light" ? "dark" : "light");
}
