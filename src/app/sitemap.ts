import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { getCanonicalBaseUrl } from "@/lib/seo";

interface SitemapHotelRow {
  updated_at: string | null;
  settings: Record<string, unknown> | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServiceClient();
  const { data: hotelData } = await supabase
    .from("hotels")
    .select("updated_at, settings")
    .eq("is_active", true)
    .limit(1)
    .single();
  const hotel = hotelData as unknown as SitemapHotelRow | null;

  const baseUrl = getCanonicalBaseUrl(hotel);
  const lastModified = hotel?.updated_at ? new Date(hotel.updated_at) : new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
}
