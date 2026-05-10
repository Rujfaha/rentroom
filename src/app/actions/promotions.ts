"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updatePromotion(formData: FormData) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const image_url = formData.get("image_url") as string;
  const discount_text = formData.get("discount_text") as string;
  const valid_until_str = formData.get("valid_until") as string;
  const is_active = formData.get("is_active") === "true";

  if (!title) return { error: "Title is required" };

  const valid_until = valid_until_str ? new Date(valid_until_str).toISOString().split('T')[0] : null;

  const supabase = await createClient();

  if (id === "new") {
    const { error } = await (supabase.from("promotions") as any).insert({
      hotel_id: session.hotelId,
      title,
      description,
      image_url,
      discount_text,
      valid_until,
      is_active,
    });
    if (error) return { error: "Failed to create promotion" };
  } else {
    const { error } = await (supabase.from("promotions") as any)
      .update({
        title,
        description,
        image_url,
        discount_text,
        valid_until,
        is_active,
      })
      .eq("id", id)
      .eq("hotel_id", session.hotelId);
    
    if (error) return { error: "Failed to update promotion" };
  }

  revalidatePath("/admin/cms/promotions");
  revalidatePath("/");
  return { success: true };
}

export async function deletePromotion(id: string) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", id)
    .eq("hotel_id", session.hotelId);

  if (error) return { error: "Failed to delete promotion" };

  revalidatePath("/admin/cms/promotions");
  revalidatePath("/");
  return { success: true };
}
