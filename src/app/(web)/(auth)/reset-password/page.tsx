import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { ResetPasswordSection } from "./section/ResetPasswordSection";

/**
 * Halaman reset password — sudah login dialihkan ke beranda.
 * Memakai token reset sekali pakai (diterbitkan saat OTP diverifikasi);
 * tanpa userId di URL (privasi). Token invalid → ulang dari lupa password.
 */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  if (!/^[0-9a-f]{64}$/.test(token)) {
    redirect("/forgot-password");
  }

  return <ResetPasswordSection token={token} />;
}
