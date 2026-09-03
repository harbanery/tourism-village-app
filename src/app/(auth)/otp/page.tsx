import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { OtpSection } from "./section/OtpSection";

/**
 * Halaman OTP — dipakai dua alur:
 * - REGISTER (belum login): verifikasi email setelah register.
 * - EMAIL_CHANGE (wajib login): verifikasi email baru dari pengaturan.
 * Guard menyesuaikan purpose; purpose selain itu kembali ke beranda.
 */
export default async function OtpPage({
  searchParams,
}: PageProps<"/otp">) {
  const params = await searchParams;
  const userId = Number(
    typeof params.userId === "string" ? params.userId : NaN,
  );
  const purpose = typeof params.purpose === "string" ? params.purpose : "";
  const dev = typeof params.dev === "string" ? params.dev : undefined;

  if (!Number.isInteger(userId)) {
    redirect("/login");
  }

  const user = await getCurrentUser();

  if (purpose === "EMAIL_CHANGE") {
    // Ganti email hanya untuk user yang sedang login.
    if (!user) {
      redirect("/login?redirect=/profile");
    }
    // OTP ganti email selalu milik user sesi (bukan userId dari query).
    return <OtpSection userId={user.id} purpose="EMAIL_CHANGE" dev={dev} />;
  }

  if (purpose !== "REGISTER") {
    redirect("/");
  }

  // Halaman auth tidak untuk user yang sudah login.
  if (user) {
    redirect("/");
  }

  return <OtpSection userId={userId} purpose="REGISTER" dev={dev} />;
}
