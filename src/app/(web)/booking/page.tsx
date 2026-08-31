"use client";

import { useMounted } from "@/hooks/useMounted";
import { Card } from "antd";
import { useT } from "@/components/locale/LocaleProvider";
import { dummyPackages } from "@/models";

export default function BookingPage() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{t("booking.title")}</h1>
        <p className="mt-1 text-foreground/60">{t("booking.subtitle")}</p>
        <div className="mt-6 space-y-6">
          {dummyPackages.map((pkg) => (
            <Card key={pkg.id} title={pkg.name} extra={<span className="text-sm text-foreground/60">{pkg.placeName}</span>}>
              <ol className="list-decimal pl-5 space-y-1 text-foreground/80">
                {pkg.facilities.filter(Boolean).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ol>
              <p className="mt-4 font-semibold text-[#0d7a5f]">
                {t("booking.pricePerPerson", { price: pkg.price.toLocaleString("id-ID") })}
              </p>
            </Card>
          ))}
        </div>
        <Card className="mt-6">
          <p className="text-foreground/75">{t("booking.note")}</p>
          <p className="mt-4 font-medium">WhatsApp: +62 896-0556-7347</p>
          <p className="mt-1 text-foreground/70">{t("booking.payment")}: PayPal — admin@tempellemahbang.id</p>
        </Card>
      </div>
      <aside />
    </div>
  );
}
