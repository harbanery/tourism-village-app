import { Navbar } from "@/components/web/Navbar";

/**
 * Layout halaman membership (profile, package, checkout, payment,
 * review-confirm). Navbar TANPA Footer sesuai kebutuhan area member,
 * dan seluruh halamannya wajib login (guard per page + proxy).
 */
export default function MembershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
