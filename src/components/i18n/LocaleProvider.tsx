"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  translations,
  translate,
  type Locale,
} from "./translations";

/**
 * Provider locale (pola progress-self): state locale terpisah dari tema,
 * dipakai oleh ThemeProvider untuk ConfigProvider antd & dayjs.
 */

interface LocaleContextValue {
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key) => key,
  setLocale: () => {},
});

const STORAGE_KEY = "tourism-village:locale";

// Store level-modul: SSR & render awal client selalu DEFAULT_LOCALE
// (hindari hydration mismatch), diperbarui setelah mount.
let clientLocale: Locale = DEFAULT_LOCALE;
const localeListeners = new Set<() => void>();

function emitLocale() {
  for (const l of localeListeners) l();
}

function subscribeLocale(listener: () => void): () => void {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
}

function getLocaleSnapshot(): Locale {
  return clientLocale;
}

function getLocaleServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

function readPersistedLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

function applyLocale(next: Locale): void {
  clientLocale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  emitLocale();
}

export function LocaleProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocaleSnapshot,
    getLocaleServerSnapshot,
  );

  useEffect(() => {
    const persisted = readPersistedLocale();
    if (persisted !== clientLocale) {
      applyLocale(persisted);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = translations[locale] ?? translations[DEFAULT_LOCALE];
      return translate(dict, key, params);
    },
    [locale],
  );

  const setLocale = useCallback((next: Locale) => {
    applyLocale(next);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/** Shortcut `t` + `locale` + `setLocale` (API lama yang dipakai luas). */
export function useT() {
  const { t, locale, setLocale } = useLocale();
  return { t, locale, setLocale };
}

export type { Locale };
