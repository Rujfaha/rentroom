"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

interface HeroSlidePayload {
  hotel_id: string;
  image_url: string;
  headline: string;
  subheadline: string;
  is_active: boolean;
}

interface DbError {
  message?: string;
}

interface InsertOnlyTable<TInsert> {
  insert(value: TInsert): Promise<{ error: DbError | null }>;
}

interface UpdateScopedTable<TUpdate> {
  update(value: TUpdate): {
    eq(column: string, value: string): {
      eq(column: string, value: string): Promise<{ error: DbError | null }>;
    };
  };
}

export async function updateHeroSlide(formData: FormData) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const id = formData.get("id") as string;
  const image_url = formData.get("image_url") as string;
  const headline = formData.get("headline") as string;
  const subheadline = formData.get("subheadline") as string;
  const is_active = formData.get("is_active") === "true";

  if (!image_url) return { error: "Image URL is required" };

  const supabase = await createClient();

  if (id === "new") {
    const heroSlidesInsertTable = supabase.from("hero_slides") as unknown as InsertOnlyTable<HeroSlidePayload>;
    const { error } = await heroSlidesInsertTable.insert({
      hotel_id: session.hotelId,
      image_url,
      headline,
      subheadline,
      is_active,
    });
    if (error) return { error: "Failed to create slide" };
  } else {
    const heroSlidesUpdateTable = supabase.from("hero_slides") as unknown as UpdateScopedTable<Partial<HeroSlidePayload>>;
    const { error } = await heroSlidesUpdateTable
      .update({
        image_url,
        headline,
        subheadline,
        is_active,
      })
      .eq("id", id)
      .eq("hotel_id", session.hotelId);
    
    if (error) return { error: "Failed to update slide" };
  }

  revalidatePath("/admin/cms/hero");
  revalidatePath("/");
  return { success: true };
}

export async function deleteHeroSlide(id: string) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("hero_slides")
    .delete()
    .eq("id", id)
    .eq("hotel_id", session.hotelId);

  if (error) return { error: "Failed to delete slide" };

  revalidatePath("/admin/cms/hero");
  revalidatePath("/");
  return { success: true };
}
