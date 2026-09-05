import { Navbar } from "@/components/web/navbar";
import { Footer } from "@/components/web/footer";

export default function WebLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
