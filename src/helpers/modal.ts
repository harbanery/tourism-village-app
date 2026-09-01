import type { CSSProperties } from "react";

/** Opsi body modal/drawer admin. */
export interface ModalBodyOptions {
  /** Tinggi maksimum body sebelum dapat di-scroll. */
  maxHeight?: string;
}

/** Hasil props yang kompatibel untuk Modal maupun Drawer antd. */
export interface ModalBodyProps {
  styles: { body: CSSProperties };
}

/**
 * Props body modal/drawer yang dapat di-scroll dengan scrollbar tersembunyi.
 *
 * Pemakaian: `<Modal {...modalBodyProps()}>` atau `<Drawer {...modalBodyProps()}>`.
 */
export const modalBodyProps = (
  options: ModalBodyOptions = {},
): ModalBodyProps => {
  const { maxHeight = "70vh" } = options;
  return {
    styles: {
      body: {
        paddingBlock: "10px",
        maxHeight,
        overflowY: "auto",
      },
    },
  };
};
