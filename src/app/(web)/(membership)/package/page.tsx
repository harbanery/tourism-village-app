import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PackageClientSection from "./section/PackageClientSection";

/** Halaman paket wisata — area membership, wajib login. */
export default async function PackagePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/package");
  }

  return <PackageClientSection />;
}
