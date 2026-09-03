import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { LoginFormSection } from "./section/LoginFormSection";

/** Target default setelah login sukses. */
const DEFAULT_REDIRECT = "/profile";

/**
 * Validasi target redirect dari query param:
 * hanya path internal (diawali "/" dan bukan protokol-relative "//")
 * yang diizinkan agar tidak bisa dipakai redirect ke domain luar.
 */
function sanitizeRedirect(value: string | undefined): string {
  if (!value) return DEFAULT_REDIRECT;
  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }
  return value;
}

/** Halaman login — tidak bisa diakses saat sudah login. */
export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/profile");
  }

  const params = await searchParams;
  const redirectTo = sanitizeRedirect(
    typeof params.redirect === "string" ? params.redirect : undefined,
  );

  return <LoginFormSection redirectTo={redirectTo} />;
}
