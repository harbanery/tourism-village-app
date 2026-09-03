import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { ResetPasswordSection } from "./section/ResetPasswordSection";

/**
 * Halaman reset password — sudah login dialihkan ke beranda.
 * `userId` dipakai konsumsi OTP reset (flow: lupa password → otp → reset).
 */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const userId = Number(
    typeof params.userId === "string" ? params.userId : NaN,
  );
  const dev = typeof params.dev === "string" ? params.dev : undefined;

  if (!Number.isInteger(userId)) {
    redirect("/forgot-password");
  }

  return <ResetPasswordSection userId={userId} dev={dev} />;
}
