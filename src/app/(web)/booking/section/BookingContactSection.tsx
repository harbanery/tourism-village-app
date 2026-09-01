"use client";

import { useMounted } from "@/helpers/useMounted";
import { Card } from "antd";
import { useT } from "@/components/locale/LocaleProvider";

export function BookingContactSection() {
  const { t } = useT();
  const mounted = useMounted();
  if (!mounted) return null;

  return (
    <Card className="mt-6!">
      <p className="text-foreground/75">{t("booking.note")}</p>
      <p className="mt-4 font-medium">WhatsApp: +62 896-0556-7347</p>
      <p className="mt-1 text-foreground/70">{t("booking.payment")}: PayPal — admin@desakuwisataku.id</p>
    </Card>
  );
}
