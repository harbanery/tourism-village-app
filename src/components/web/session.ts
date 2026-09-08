"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Store sesi user web bersama (pola store LocaleProvider): fetch
 * /api/web/auth/session di-dedup lintas komponen & navigasi client —
 * dalam window TTL hanya ada satu request yang berjalan, hasilnya
 * dibagikan ke semua subscriber (rekomendasi 1.3: navbar tidak lagi
 * refetch sesi di setiap halaman).
 */

export interface WebSessionUser {
  id: string;
  name: string;
  email: string;
}

interface SessionState {
  user: WebSessionUser | null;
  loading: boolean;
}

/** TTL cache sesi (ms) — sesi segar maksimal satu menit. */
const SESSION_TTL_MS = 60_000;

let state: SessionState = { user: null, loading: false };
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SessionState {
  return state;
}

/** Ambil sesi (cache bila masih segar; dedup request berjalan). */
function load(force = false): Promise<void> {
  if (!force && Date.now() - fetchedAt < SESSION_TTL_MS) {
    return Promise.resolve();
  }
  if (inflight) return inflight;

  state = { ...state, loading: true };
  emit();
  inflight = (async () => {
    try {
      const res = await fetch("/api/web/auth/session");
      const result = await res.json();
      state = {
        user: result.success ? result.data : null,
        loading: false,
      };
      fetchedAt = Date.now();
    } catch {
      state = { user: null, loading: false };
      fetchedAt = Date.now();
    } finally {
      inflight = null;
      emit();
    }
  })();
  return inflight;
}

/** Paksa ambil ulang sesi (mis. setelah login/logout di tab lain). */
export function refreshWebSession(): Promise<void> {
  return load(true);
}

/** Kosongkan sesi tersimpan (dipanggil setelah logout berhasil). */
export function clearWebSession(): void {
  state = { user: null, loading: false };
  fetchedAt = Date.now();
  emit();
}

/**
 * Hook sesi user web: hasil di-dedup global — mount pertama kali dalam
 * window TTL tidak memicu fetch baru bila data masih segar.
 */
export function useWebSession(): SessionState & { refresh: () => void } {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void load();
  }, []);

  return { ...snapshot, refresh: () => void load(true) };
}
