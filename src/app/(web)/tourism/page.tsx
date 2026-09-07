import { TourismPackageSection } from "./section/TourismPackageSection";
import { TourismContactSection } from "./section/TourismContactSection";

export default function TourismPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <TourismPackageSection />
        <TourismContactSection />
      </div>
      <aside />
    </div>
  );
}
