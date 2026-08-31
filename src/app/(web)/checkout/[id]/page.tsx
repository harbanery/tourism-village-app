import { CheckoutFormSection, type CheckoutItem } from "./section/CheckoutFormSection";
import { dummyPackages, dummyUsers } from "@/models";

// Dummy cart dari halaman sebelumnya (slicing): Paket A x2, Paket C x1
const dummyCart = [
  { packageId: 1, quantity: 2 },
  { packageId: 3, quantity: 1 },
];

export default async function CheckoutPage({ params }: PageProps<"/checkout/[id]">) {
  const { id } = await params;

  const user = dummyUsers.find((u) => u.id === Number(id)) ?? null;
  const items = dummyCart
    .map((row) => {
      const pkg = dummyPackages.find((p) => p.id === row.packageId);
      return pkg ? { ...row, name: pkg.name, price: pkg.price } : null;
    })
    .filter(Boolean) as CheckoutItem[];
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return <CheckoutFormSection user={user} items={items} total={total} />;
}
