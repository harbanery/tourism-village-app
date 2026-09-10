import { Navbar } from "@/features/web/components/layout/navbar";
import { Footer } from "@/features/web/components/layout/footer";
import { ScrollToTop } from "@/features/web/components/ui/scroll-to-top";

export default function WebLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
