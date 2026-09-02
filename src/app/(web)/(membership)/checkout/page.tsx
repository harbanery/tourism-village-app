import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import CheckoutClientSection from "./section/CheckoutClientSection";

/** Halaman checkout — wajib login; keranjang dibaca dari sessionStorage. */
export default async function CheckoutPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <CheckoutClientSection
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      }}
    />
  );
}
