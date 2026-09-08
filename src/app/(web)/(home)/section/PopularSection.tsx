"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Empty, Skeleton } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";

const MAX_PLACES = 3;

/** Tempat wisata live dari /api/web/places (kelola admin). */
interface WebPlace {
  id: string;
  name: string;
  photo: string | null;
  /** Total kuantitas terjual lunas dari paket tempat ini (PAID). */
  totalPurchased: number;
}

function PlaceCard({
  place,
  onClick,
}: {
  place: WebPlace;
  onClick: () => void;
}) {
  return (
    <Card
      hoverable
      className="h-full! cursor-pointer!"
      onClick={onClick}
      cover={
        place.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={place.name}
            src={place.photo}
            className="h-48 w-full object-cover"
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={false}
            className="grid! h-48! place-items-center!"
          />
        )
      }
    >
      <Card.Meta
        avatar={<EnvironmentOutlined className="text-xl! text-primary!" />}
        title={place.name}
        description="Indonesia"
      />
    </Card>
  );
}

export function PopularSection() {
  const { t } = useT();
  const router = useRouter();
  const [places, setPlaces] = useState<WebPlace[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaces = useCallback(async () => {
    try {
      const res = await fetch("/api/web/places");
      const json = await res.json();
      if (json.success) setPlaces(json.data);
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchPlaces);
  }, [fetchPlaces]);

  /**
   * Wisata populer: tempat dengan pembelian PAID terbanyak duluan
   * (sesuai semantik tag Populer di admin); bila yang populer kurang
   * dari 3, sisa slot diisi tempat dengan pembelian tertinggi berikutnya
   * hingga maksimal 3 data tampil.
   */
  const popularPlaces = [...places]
    .sort((a, b) => b.totalPurchased - a.totalPurchased)
    .slice(0, MAX_PLACES);

  return (
    <section className="flex min-h-screen items-center bg-white dark:bg-[#141416]">
      <div className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            {t("home.popular.title")}
          </h2>
          <p className="mt-1 text-foreground/60">
            {t("home.popular.subtitle")}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {loading
            ? [1, 2, 3].map((key) => (
                <Card key={key} loading className="h-full!">
                  <Skeleton.Image active className="w-full!" />
                </Card>
              ))
            : popularPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onClick={() => router.push(`/tourism#place-${place.id}`)}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
