import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { OtpSection } from "./section/OtpSection";

/**
 * Halaman OTP terpisah — dipakai tiga alur (via param purpose):
 * - REGISTER (belum login): verifikasi email setelah register → login.
 * - RESET_PASSWORD (belum login): bukti kepemilikan akun → reset password.
 * - EMAIL_CHANGE (wajib login): verifikasi email baru → profil.
 * Guard menyesuaikan purpose; purpose lain kembali ke beranda.
 */
export default async function OtpPage({ searchParams }: PageProps<"/otp">) {
  const params = await searchParams;
  const userId = Number(
    typeof params.userId === "string" ? params.userId : NaN,
  );
  const purpose = typeof params.purpose === "string" ? params.purpose : "";
  const dev = typeof params.dev === "string" ? params.dev : undefined;

  if (!Number.isInteger(userId)) {
    redirect("/login", "replace");
  }

  const user = await getCurrentUser();

  if (purpose === "EMAIL_CHANGE") {
    // Ganti email hanya untuk user yang sedang login.
    if (!user) {
      redirect("/login?redirect=/profile", "replace");
    }
    // OTP ganti email selalu milik user sesi (bukan userId dari query).
    return <OtpSection userId={user.id} purpose="EMAIL_CHANGE" dev={dev} />;
  }

  if (purpose === "RESET_PASSWORD") {
    // Alur lupa password: user belum (tidak) login.
    if (user) {
      redirect("/", "replace");
    }
    return <OtpSection userId={userId} purpose="RESET_PASSWORD" dev={dev} />;
  }

  if (purpose !== "REGISTER") {
    redirect("/", "replace");
  }

  // Halaman auth tidak untuk user yang sudah login.
  if (user) {
    redirect("/", "replace");
  }

  return <OtpSection userId={userId} purpose="REGISTER" dev={dev} />;
}
