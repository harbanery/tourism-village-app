"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * false saat SSR dan render hidrasi pertama, true setelahnya.
 * Alternatif aman untuk pola `useEffect(() => setMounted(true), [])`.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
