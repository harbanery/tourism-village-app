import type { ModalProps } from "antd";

/** Opsi body modal admin. */
export interface ModalBodyOptions {
  /** Tinggi maksimum body modal sebelum dapat di-scroll. */
  maxHeight?: string;
}

/**
 * Props modal untuk body yang dapat di-scroll dengan scrollbar tersembunyi.
 *
 * Pemakaian: `<Modal {...modalBodyProps()}>`.
 */
export const modalBodyProps = (
  options: ModalBodyOptions = {},
): Pick<ModalProps, "styles" | "classNames"> => {
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
