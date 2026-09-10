import { getPlacesWithPackages } from "@/services/place";
import { TourismPackageSection } from "./section/TourismPackageSection";

/**
 * ISR: data tempat wisata diambil di server (service ter-cache) dan
 * diverifikasi tiap 60 detik — section menerima data via props, tidak
 * ada fetching di client.
 */
export const revalidate = 60;

export default async function TourismPage() {
  const places = await getPlacesWithPackages();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <TourismPackageSection places={places} />
    </div>
  );
}
