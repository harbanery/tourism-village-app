import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { RegisterFormSection } from "./section/RegisterFormSection";

/** Halaman register — sudah login dialihkan ke beranda. */
export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return <RegisterFormSection />;
}
