"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { LocalAttraction } from "@/types/database.types";

type AttractionPayload = Pick<LocalAttraction, "hotel_id" | "name" | "description" | "image_url" | "distance_km" | "map_url" | "is_visible">;

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

export async function updateAttraction(formData: FormData) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const image_url = formData.get("image_url") as string;
  const distance_km_str = formData.get("distance_km") as string;
  const map_url = formData.get("map_url") as string;
  const is_visible = formData.get("is_visible") === "true";

  if (!name) return { error: "Name is required" };

  const distance_km = distance_km_str ? Number(distance_km_str) : null;

  const supabase = await createServiceClient();

  if (id === "new") {
    const attractionsInsertTable = supabase.from("local_attractions") as unknown as InsertOnlyTable<AttractionPayload>;
    const { error } = await attractionsInsertTable.insert({
      hotel_id: session.hotelId,
      name,
      description,
      image_url,
      distance_km,
      map_url,
      is_visible,
    });
    if (error) {
      console.error("Insert error:", error);
      return { error: `Failed to create attraction: ${error.message}` };
    }
  } else {
    const attractionsUpdateTable = supabase.from("local_attractions") as unknown as UpdateScopedTable<Partial<AttractionPayload>>;
    const { error } = await attractionsUpdateTable
      .update({
        name,
        description,
        image_url,
        distance_km,
        map_url,
        is_visible,
      })
      .eq("id", id)
      .eq("hotel_id", session.hotelId);

    if (error) {
      console.error("Update error:", error);
      return { error: `Failed to update attraction: ${error.message}` };
    }
  }

  revalidatePath("/admin/cms/attractions");
  revalidatePath("/");
  return { success: true };
}

export async function deleteAttraction(id: string) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("local_attractions")
    .delete()
    .eq("id", id)
    .eq("hotel_id", session.hotelId);

  if (error) return { error: "Failed to delete attraction" };

  revalidatePath("/admin/cms/attractions");
  revalidatePath("/");
  return { success: true };
}
