import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import CheckoutClientSection from "./section/CheckoutClientSection";

/** Halaman checkout — wajib login; keranjang dibaca dari sessionStorage. */
export default async function CheckoutPage({
  params,
}: PageProps<"/checkout/[id]">) {
  const { id } = await params;
  void id; // checkout selalu mengikuti sesi login, bukan param URL

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
