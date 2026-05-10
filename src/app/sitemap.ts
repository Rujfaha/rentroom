import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { getCanonicalBaseUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServiceClient();
  const { data: hotel } = await (supabase
    .from("hotels") as any)
    .select("updated_at, settings")
    .eq("is_active", true)
    .limit(1)
    .single();

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
