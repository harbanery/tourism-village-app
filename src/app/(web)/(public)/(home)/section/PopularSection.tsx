"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { ArrowRightOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useT } from "@/components/i18n/LocaleProvider";
import { displayImage } from "@/utils/helpers";
import { Reveal } from "@/features/web/components/ui/reveal";
import type { PlaceWithPackages } from "@/services/place";

const MAX_PLACES = 3;

/**
 * Kartu wisata populer — kartu gambar penuh (tanpa body) dengan tinggi
 * lebih dari lebar. Saat hover/fokus kartu melebar (flex-[2.4]) dan
 * memunculkan nama tempat di atas gradient gelap; kartu lain otomatis
 * menyempit (flex dibagi ulang) dan gambarnya menjadi hitam-putih.
 * Tinggi container tetap (md:h-[480px]) — section menyesuaikan tinggi
 * kontennya, bukan h-screen.
 */
function PlaceCard({
  place,
  onClick,
}: {
  place: PlaceWithPackages;
  onClick: () => void;
}) {
  const { t } = useT();
  // Foto Cloudinary dioptimasi CDN (f_auto,q_auto,w_800) — kartu grid
  // maksimal ~1/2 layar saat melebar; sizes untuk fallback optimizer.
  const { src, unoptimized } = place.photo
    ? displayImage(place.photo, 800)
    : { src: null, unoptimized: true };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={place.name}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={[
        "group/card relative h-80 w-full cursor-pointer overflow-hidden rounded-2xl",
        "outline-none transition-all duration-500 ease-in-out",
        "focus-visible:ring-2 focus-visible:ring-white",
        "md:h-full md:min-w-[180px] md:flex-1",
        "md:hover:flex-[2.4] md:focus-visible:flex-[2.4] md:focus-within:flex-[2.4]",
      ].join(" ")}
    >
      {place.photo && src ? (
        <Image
          src={src}
          alt={place.name}
          fill
          unoptimized={unoptimized}
          sizes="(max-width: 768px) 100vw, 50vw"
          className={[
            "object-cover transition-[filter] duration-500",
            // Kartu lain jadi hitam-putih saat salah satu di-hover;
            // kartu yang di-hover dipaksa berwarna (important).
            "md:group-hover/list:grayscale md:group-hover/card:grayscale-0!",
          ].join(" ")}
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-black/25">
          <EnvironmentOutlined className="text-4xl! text-white!" />
        </div>
      )}

      {/* Gradient gelap agar teks nama terbaca di atas gambar — hanya
          muncul saat kartu hover/fokus (di mobile selalu tampil). */}
      <div
        aria-hidden
        className={[
          "absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent",
          "opacity-100 transition-opacity duration-500",
          "md:opacity-0 md:group-hover/card:opacity-100 md:group-focus-within/card:opacity-100",
        ].join(" ")}
      />
      <div
        className={[
          "absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4",
          "opacity-100 transition-opacity duration-500",
          "md:opacity-0 md:group-hover/card:opacity-100 md:group-focus-within/card:opacity-100",
        ].join(" ")}
      >
        <h3 className="text-lg font-semibold text-white drop-shadow">
          {place.name}
        </h3>
        {/* Tombol lihat (teks + icon) — klik tetap memakai navigasi kartu
            (event bubble), konsisten memakai useRouter. */}
        <Button
          ghost
          size="small"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          className="shrink-0! border-white/70! text-white! hover:border-white! hover:text-white!"
        >
          {t("common.view")}
        </Button>
      </div>
    </div>
  );
}

/**
 * Wisata populer: tempat dengan pembelian PAID terbanyak ditampilkan
 * lebih dulu (sesuai semantik tag Populer di admin); bila yang populer
 * kurang dari 3, sisa
 * slot diisi tempat dengan pembelian tertinggi berikutnya hingga
 * maksimal 3 data tampil. Data diterima via props dari server page
 * (SSR) — tidak ada fetching di section.
 */
export function PopularSection({ places }: { places: PlaceWithPackages[] }) {
  const { t } = useT();
  const router = useRouter();

  const popularPlaces = [...places]
    .sort((a, b) => b.totalPurchased - a.totalPurchased)
    .slice(0, MAX_PLACES);

  // Section bg primary (dark & light); heading putih agar terbaca.
  // Tinggi section menyesuaikan konten (tanpa h-screen).
  return (
    <section className="rounded-4xl bg-primary">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <Reveal className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {t("home.popular.title")}
          </h2>
          <p className="mt-1 text-white/70">{t("home.popular.subtitle")}</p>
        </Reveal>

        <Reveal delay={150}>
          <div className="group/list mt-8 flex flex-col gap-4 md:h-[480px] md:flex-row">
            {popularPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onClick={() => router.push(`/tourism#place-${place.id}`)}
              />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
