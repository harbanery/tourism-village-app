import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { ResetPasswordSection } from "./section/ResetPasswordSection";

/** Halaman reset password — sudah login dialihkan ke beranda. */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  const params = await searchParams;
  const email =
    typeof params.email === "string" ? params.email : undefined;
  const dev = typeof params.dev === "string" ? params.dev : undefined;

  return <ResetPasswordSection email={email} dev={dev} />;
}
