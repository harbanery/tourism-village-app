/**
 * Bentuk error yang ditangkap blok catch di aplikasi admin.
 * - `errorFields`: ada ketika error berasal dari `form.validateFields()` antd.
 * - `message`: pesan error standar dari `Error`.
 */
export interface AppError {
  errorFields?: unknown;
  message?: string;
}

/** Cast error hasil catch (unknown) menjadi AppError secara aman. */
export const asAppError = (error: unknown): AppError => {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (typeof error === "object" && error !== null) {
    return error as AppError;
  }
  return { message: String(error) };
};

/** Ambil pesan error dengan fallback string kosong. */
export const errorMessage = (error: unknown): string =>
  asAppError(error).message ?? "";
