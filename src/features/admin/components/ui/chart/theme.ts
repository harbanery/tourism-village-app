/**
 * Util bersama untuk grafik dashboard admin (chart.js, pola progress-self).
 * Grafik canvas tidak mengikuti tema antd — warna grid/tick/tooltip
 * didefinisikan eksplisit per mode terang/gelap.
 */

/** Warna konsisten per status pembayaran di semua grafik. */
export const STATUS_COLORS: Record<string, string> = {
  PAID: "#0d7a5f",
  PENDING: "#faad14",
  FAILED: "#ff4d4f",
  CANCELED: "#8c8c8c",
};

/** Palet aksen (selain status) untuk grafik komposisi. */
export const ACCENT_COLORS = ["#0d7a5f", "#f59e0b", "#3b82f6", "#8c8c8c"];

/** Konfigurasi warna dasar mengikuti mode tema. */
export function chartPalette(isDark: boolean) {
  return {
    gridColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    tickColor: isDark ? "#9ca3af" : "#6b7280",
    tooltip: {
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      titleColor: isDark ? "#f9fafb" : "#111827",
      bodyColor: isDark ? "#e5e7eb" : "#374151",
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      borderWidth: 1,
      padding: 10,
    },
    /** Warna garis pemisah segmen doughnut (menyatu dengan kartu). */
    doughnutBorder: isDark ? "#141414" : "#ffffff",
  };
}

/** Opsi legend standar: bawah, titik bulat, ukuran kecil. */
export function legendOptions(tickColor: string) {
  return {
    display: true,
    position: "bottom" as const,
    labels: {
      color: tickColor,
      font: { size: 11 },
      usePointStyle: true,
      boxWidth: 8,
      padding: 12,
    },
  };
}
