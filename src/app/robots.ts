import type { MetadataRoute } from "next";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/booking"],
        disallow: ["/admin", "/dashboard", "/login", "/check-booking", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
