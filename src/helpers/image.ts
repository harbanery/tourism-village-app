/** Bentuk file antd Upload yang dipakai aplikasi (termasuk metadata upload). */
export interface UploadFileLike {
  uid?: string | number;
  name?: string;
  url?: string;
  thumbUrl?: string;
  status?: string;
  originFileObj?: File;
  storagePath?: string;
  response?: {
    success?: boolean;
    data?: { url?: string; storagePath?: string };
  };
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/** Konversi fileList antd Upload menjadi string URL (Cloudinary atau base64). */
export async function getImageString(imageValue: unknown): Promise<string> {
  if (!imageValue) return "";
  if (typeof imageValue === "string") return imageValue;

  if (Array.isArray(imageValue) && imageValue.length > 0) {
    const url = await fileEntryToUrl(imageValue[0]);
    if (url) return url;
    return "";
  }

  const singleUrl = await fileEntryToUrl(imageValue);
  return singleUrl ?? "";
}

/** Ambil URL dari satu entri file upload (url / response / originFileObj / thumbUrl). */
async function fileEntryToUrl(entry: unknown): Promise<string | null> {
  if (typeof entry === "string") return entry;
  if (!entry || typeof entry !== "object") return null;

  const file = entry as UploadFileLike;
  if (isNonEmptyString(file.url)) return file.url;
  const responseUrl = file.response?.data?.url;
  if (isNonEmptyString(responseUrl)) return responseUrl;
  if (file.originFileObj instanceof File) {
    return fileToBase64(file.originFileObj);
  }
  if (isNonEmptyString(file.thumbUrl)) return file.thumbUrl;
  return null;
}

/** Konversi File menjadi data URL base64. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
