import type { MetadataRoute } from "next";
import { BASE_URL } from "@/utils/config/variables";

/**
 * robots.txt (rekomendasi 1.2): halaman publik boleh diindeks; area
 * membership, admin, dan API tidak.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/profile", "/package", "/checkout", "/payment", "/review-confirm"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
