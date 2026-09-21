import { CookieConsent } from "@/components/ui/consent/CookieConsent";

/**
 * Layout grup (web) — membungkus seluruh halaman web pengunjung
 * (public, auth, membership) tanpa memengaruhi URL.
 *
 * Banner persetujuan cookie dipasang di sini (bukan di root layout)
 * agar hanya tampil pada halaman web: fallback loading/not-found/error
 * root dirender di luar grup ini sehingga bebas banner (permintaan
 * DROID). Harus tetap di dalam LocaleProvider (root) agar translate
 * jalan — urutan tree terpenuhi karena layout ini nested di bawahnya.
 */
export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <CookieConsent />
    </>
  );
}
