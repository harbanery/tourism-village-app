import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { Card } from "antd";
import { ConfirmationSection } from "./section/ConfirmationSection";
import { ReviewSection } from "./section/ReviewSection";

/** Halaman review & konfirmasi setelah pembayaran — wajib login. */
export default async function ReviewConfirmPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/review-confirm");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card>
        <ConfirmationSection />
        <ReviewSection />
      </Card>
    </div>
  );
}
