"use client";

import { useMounted } from "@/hooks/useMounted";
import { Button, Image } from "antd";
import { InstagramOutlined } from "@ant-design/icons";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyGalleries, dummyPlaces } from "@/models";

export default function GaleriPage() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  const activePlaces = dummyPlaces.filter((p) => p.active === "yes");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold">{t("gallery.title")}</h1>
      <p className="mt-1 text-foreground/60">{t("gallery.subtitle")}</p>

      {activePlaces.map((place) => {
        const photos = dummyGalleries.filter((g) => g.placeId === place.id);
        return (
          <section key={place.id} className="mt-10">
            <h2 className="text-xl font-semibold">{place.name}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              {photos.map((photo) => (
                <Image
                  key={photo.id}
                  src={photo.filename}
                  alt={photo.title}
                  className="h-48 w-full rounded-xl object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-12 text-center">
        <Button size="large" icon={<InstagramOutlined />} href="https://instagram.com">
          {t("gallery.followInstagram")}
        </Button>
      </div>
    </div>
  );
}
