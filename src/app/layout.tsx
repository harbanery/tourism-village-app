import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { ThemeProvider } from "@/components/ui/theme/ThemeProvider";
import { Analytics } from "@/components/ui/vercel";
import { geistSans, geistMono } from "@/utils/fonts/next-google";
import {
  BASE_URL,
  META_APP,
  META_DESCRIPTION,
  META_TITLE,
} from "@/utils/config/variables";
import "@/assets/global/index.css";

/** Fallback meta (pola progress-self: nilai dari env, fallback konstanta). */
const APP_NAME = META_APP ?? "DesakuWisataku";
const TITLE = META_TITLE ?? APP_NAME;
const DESCRIPTION =
  META_DESCRIPTION ??
  "Website desa wisata DesakuWisataku — paket wisata, galeri, vlog, dan artikel.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: `%s | ${APP_NAME}`,
  },
  applicationName: APP_NAME,
  description: DESCRIPTION,
  metadataBase: new URL(BASE_URL),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: APP_NAME,
    countryName: "Indonesia",
    locale: "id-ID",
    url: `/`,
  },
  creator: "Raihan Yusuf",
  authors: [
    { name: "Raihan Yusuf", url: "https://www.linkedin.com/in/raihan-yusuf" },
  ],
  icons: [
    {
      rel: "icon",
      type: "image/x-icon",
      url: `/favicon.ico`,
      sizes: "any",
    },
    {
      rel: "apple-touch-icon",
      type: "image/png",
      url: `/ios/180.png`,
      sizes: "180x180",
    },
    {
      rel: "apple-touch-icon",
      type: "image/png",
      url: `/ios/120.png`,
      sizes: "120x120",
    },
    {
      rel: "apple-touch-icon",
      type: "image/png",
      url: `/ios/152.png`,
      sizes: "152x152",
    },
    {
      rel: "apple-touch-icon",
      type: "image/png",
      url: `/ios/1024.png`,
      sizes: "1024x1024",
    },
    {
      rel: "shortcut icon",
      type: "image/x-icon",
      url: `/favicon.ico`,
    },
  ],
};

/**
 * Viewport config. `themeColor` wajib didefinisikan di sini (bukan di
 * metadata) agar warna chrome browser mengikuti tema terang/gelap
 * aplikasi.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
          <LocaleProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </LocaleProvider>
        </AntdRegistry>
        <Analytics />
      </body>
    </html>
  );
}
