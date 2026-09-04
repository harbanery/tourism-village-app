import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { OtpSection } from "./section/OtpSection";

/**
 * Halaman OTP terpisah — dipakai dua alur (via param purpose):
 * - REGISTER (belum login): verifikasi email setelah register → login.
 * - RESET_PASSWORD (belum login): bukti kepemilikan akun → reset password.
 * (Flow ganti email DIHAPUS dari sini — verifikasi OTP ganti email
 * sekarang berupa modal langsung di tab Email pengaturan profil.)
 * Guard menyesuaikan purpose; purpose lain dialihkan.
 */
export default async function OtpPage({ searchParams }: PageProps<"/otp">) {
  const params = await searchParams;
  const userId = Number(
    typeof params.userId === "string" ? params.userId : NaN,
  );
  const purpose = typeof params.purpose === "string" ? params.purpose : "";
  const dev = typeof params.dev === "string" ? params.dev : undefined;
  // Sisa cooldown kirim ulang (detik) bila OTP sudah dikirim sebelumnya.
  const cd = Number(typeof params.cd === "string" ? params.cd : NaN);
  const initialCountdown = Number.isInteger(cd) && cd > 0 ? cd : 300;

  if (!Number.isInteger(userId)) {
    redirect("/login", "replace");
  }

  const user = await getCurrentUser();

  // Sisa tautan lama ganti email → arahkan ke pengaturan email di profil.
  if (purpose === "EMAIL_CHANGE") {
    if (!user) {
      redirect("/login?redirect=/profile", "replace");
    }
    redirect("/profile?view=settings&tab=email", "replace");
  }

  if (purpose === "RESET_PASSWORD") {
    // Alur lupa password: user belum (tidak) login.
    if (user) {
      redirect("/", "replace");
    }
    return (
      <OtpSection
        userId={userId}
        purpose="RESET_PASSWORD"
        dev={dev}
        initialCountdown={initialCountdown}
      />
    );
  }

  if (purpose !== "REGISTER") {
    redirect("/", "replace");
  }

  // Halaman auth tidak untuk user yang sudah login.
  if (user) {
    redirect("/", "replace");
  }

  return (
    <OtpSection
      userId={userId}
      purpose="REGISTER"
      dev={dev}
      initialCountdown={initialCountdown}
    />
  );
}
