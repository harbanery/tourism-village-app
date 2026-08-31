import { VlogListSection } from "./section/VlogListSection";
import { VlogSubscribeSection } from "./section/VlogSubscribeSection";

export default function VlogPage() {
  return (
    <div>
      <VlogListSection />
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <VlogSubscribeSection />
      </div>
    </div>
  );
}
