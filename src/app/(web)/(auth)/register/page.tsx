import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { GOOGLE_IS_CONFIGURED } from "@/utils/config/variables";
import { RegisterFormSection } from "./section/RegisterFormSection";

/** Halaman register — sudah login dialihkan ke beranda. */
export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return <RegisterFormSection googleEnabled={GOOGLE_IS_CONFIGURED} />;
}
