import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SetPasswordSection } from "./section/SetPasswordSection";

/**
 * Halaman /set-password — melengkapi alur Google SSO:
 * - `?pending=<token>`: email sudah terdaftar manual (belum verifikasi OTP);
 *   user membuktikan pemilik akun Google, lalu menaut Google + membuat
 *   password pertama.
 * - `?credential=<idToken>`: akun Google-only baru dari alur register;
 *   user membuat password pertama (registrasi tanpa form manual).
 * Sudah login dialihkan ke beranda.
 */
export default async function SetPasswordPage({
  searchParams,
}: PageProps<"/set-password">) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const pending = typeof params.pending === "string" ? params.pending : "";
  const credential =
    typeof params.credential === "string" ? params.credential : "";

  if (!pending && !credential) {
    redirect("/login");
  }

  return <SetPasswordSection pendingToken={pending} credential={credential} />;
}
