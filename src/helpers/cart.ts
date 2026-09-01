"use client";

/** Key sessionStorage untuk keranjang (dipakai halaman package → checkout). */
const CART_KEY = "tourism-village:cart";

export interface StoredCartItem {
  packageId: number;
  quantity: number;
}

/** Baca keranjang dari sessionStorage (client-only). */
export function readCart(): StoredCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => Number.isInteger(item.packageId) && item.quantity >= 1,
    );
  } catch {
    return [];
  }
}

/** Simpan keranjang ke sessionStorage. */
export function writeCart(items: StoredCartItem[]): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CART_KEY, JSON.stringify(items));
}

/** Kosongkan keranjang (setelah checkout sukses). */
export function clearCart(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CART_KEY);
}
