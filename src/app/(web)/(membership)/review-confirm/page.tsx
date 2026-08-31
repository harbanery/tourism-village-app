import { Card } from "antd";
import { ConfirmationSection } from "./section/ConfirmationSection";
import { ReviewSection } from "./section/ReviewSection";

export default function ReviewConfirmPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card>
        <ConfirmationSection />
        <ReviewSection />
      </Card>
    </div>
  );
}
