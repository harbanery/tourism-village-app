import type { CSSProperties } from "react";

/** Hasil props body drawer yang kompatibel untuk Drawer antd. */
export interface DrawerBodyProps {
  styles: { body: CSSProperties };
}

/**
 * Props body drawer admin.
 *
 * Tanpa maxHeight agar konten mengalir sampai footer sehingga tidak ada
 * jarak kosong di bawah body. Pemakaian: `<Drawer {...drawerBodyProps()}>`.
 */
export const drawerBodyProps = (): DrawerBodyProps => ({
  styles: {
    body: {
      paddingBlock: "10px",
    },
  },
});
