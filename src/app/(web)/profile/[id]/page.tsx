import { ProfileInfoSection } from "./section/ProfileInfoSection";
import { OrderHistorySection } from "./section/OrderHistorySection";
import { dummyOrders, dummyUsers } from "@/models";

export default async function ProfilePage({ params }: PageProps<"/profile/[id]">) {
  const { id } = await params;

  const user = dummyUsers.find((u) => u.id === Number(id)) ?? null;
  const orders = dummyOrders.filter((o) => o.userId === Number(id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[320px_1fr]">
      <ProfileInfoSection user={user} />
      <OrderHistorySection orders={orders} />
    </div>
  );
}
