export function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatDate(
  value: string | Date,
  locale: "id" | "en" = "id",
  withTime = false,
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}
