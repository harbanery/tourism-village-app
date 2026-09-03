import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { RegisterFormSection } from "./section/RegisterFormSection";

/** Halaman register — tidak bisa diakses saat sudah login. */
export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/profile");
  }

  return <RegisterFormSection />;
}
