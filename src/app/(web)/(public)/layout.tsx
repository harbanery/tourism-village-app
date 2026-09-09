import { Navbar } from "@/components/web/navbar";
import { Footer } from "@/components/web/footer";
import { ScrollToTop } from "@/components/web/scroll-to-top";

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
