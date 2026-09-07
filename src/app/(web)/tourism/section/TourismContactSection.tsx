"use client";

import { useMounted } from "@/helpers/useMounted";
import { Card } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

export function TourismContactSection() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <Card className="mt-6!">
      <p className="text-foreground/75">{t("tourism.note")}</p>
      <p className="mt-4 font-medium">WhatsApp: +62 896-0556-7347</p>
      <p className="mt-1 text-foreground/70">{t("tourism.payment")}: PayPal — admin@desakuwisataku.id</p>
    </Card>
  );
}
