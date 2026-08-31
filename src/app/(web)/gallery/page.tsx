import { GalleryGridSection } from "./section/GalleryGridSection";
import { GalleryInstagramSection } from "./section/GalleryInstagramSection";

export default function GalleryPage() {
  return (
    <div>
      <GalleryGridSection />
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <GalleryInstagramSection />
      </div>
    </div>
  );
}
