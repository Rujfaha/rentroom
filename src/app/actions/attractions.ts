"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

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
    const { error } = await (supabase.from("local_attractions") as any).insert({
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
    const { error } = await (supabase.from("local_attractions") as any)
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
