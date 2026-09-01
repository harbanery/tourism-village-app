"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

/** Paket live dari /api/web/packages (kelola admin). */
interface WebPackage {
  id: number;
  name: string;
  placeName: string | null;
  facilities: string[];
  price: number;
}

export function BookingPackageSection() {
  const { t } = useT();
  const [packages, setPackages] = useState<WebPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/web/packages");
      const json = await res.json();
      if (json.success) setPackages(json.data);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchPackages);
  }, [fetchPackages]);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">{t("booking.title")}</h1>
      <p className="mt-1 text-foreground/60">{t("booking.subtitle")}</p>
      <div className="mt-6 space-y-6">
        {loading ? (
          [1, 2].map((key) => <Card key={key} loading />)
        ) : (
          packages.map((pkg) => (
            <Card
              key={pkg.id}
              title={pkg.name}
              extra={
                <span className="text-sm text-foreground/60">
                  {pkg.placeName ?? "-"}
                </span>
              }
            >
              <ol className="list-decimal pl-5 space-y-1 text-foreground/80">
                {pkg.facilities.filter(Boolean).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ol>
              <p className="mt-4 font-semibold text-primary">
                {t("booking.pricePerPerson", {
                  price: pkg.price.toLocaleString("id-ID"),
                })}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
