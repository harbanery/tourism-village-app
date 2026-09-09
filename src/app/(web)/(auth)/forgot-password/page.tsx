import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { ForgotPasswordSection } from "./section/ForgotPasswordSection";

/** Halaman lupa password — sudah login dialihkan ke beranda. */
export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return <ForgotPasswordSection />;
}
