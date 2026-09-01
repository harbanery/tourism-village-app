import { BookingPackageSection } from "./section/BookingPackageSection";
import { BookingContactSection } from "./section/BookingContactSection";

export default function BookingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <BookingPackageSection />
        <BookingContactSection />
      </div>
      <aside />
    </div>
  );
}
