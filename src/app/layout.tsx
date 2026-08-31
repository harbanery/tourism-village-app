import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Analytics } from "@/components/vercel";
import { geistSans, geistMono } from "@/utils/fonts/next-google";
import "@/assets/global/index.css";

export const metadata: Metadata = {
  title: {
    default: "Desa Wisata Tempellemahbang",
    template: "%s | Desa Wisata Tempellemahbang",
  },
  description:
    "Website desa wisata (tourism village) Tempellemahbang — paket wisata, galeri, vlog, dan artikel.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AntdRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </AntdRegistry>
        <Analytics />
      </body>
    </html>
  );
}
