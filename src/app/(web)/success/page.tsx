import { Card } from "antd";
import { SuccessConfirmationSection } from "./section/SuccessConfirmationSection";
import { SuccessReviewSection } from "./section/SuccessReviewSection";

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card>
        <SuccessConfirmationSection />
        <SuccessReviewSection />
      </Card>
    </div>
  );
}
