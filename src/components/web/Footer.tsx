"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/components/locale/LocaleProvider";

export function Footer() {
  const { t } = useT();
  const router = useRouter();
  return (
    <footer className="pt-16 border-t border-black/5 dark:border-white/10 bg-white dark:bg-[#141416]">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <h3 className="font-semibold mb-2">{t("footer.location")}</h3>
          <p className="text-sm text-foreground/70">
            Desa Sukamaju, Kecamatan Melati, Kabupaten Sinarwangi, Jawa Barat
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{t("footer.hours")}</h3>
          <p className="text-sm text-foreground/70">{t("footer.hoursValue")}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">{t("footer.contact")}</h3>
          <p className="text-sm text-foreground/70">
            WhatsApp: +62 812-3456-7890
            <br />
            Email: halo@desakuwisataku.id
          </p>
        </div>
      </div>
      <div className="border-t border-black/5 dark:border-white/10 py-4 text-center text-xs text-foreground/60">
        {t("footer.copyright")} ·{" "}
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="cursor-pointer! bg-transparent! hover:underline!"
        >
          {t("admin.login.title")}
        </button>
      </div>
    </footer>
  );
}
