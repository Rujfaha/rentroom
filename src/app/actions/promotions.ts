"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updatePromotion(formData: FormData) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const image_url = formData.get("image_url") as string;
  const discount_type = (formData.get("discount_type") as string) === "fixed" ? "fixed" : "percent";
  const discount_percentage_str = formData.get("discount_percentage") as string;
  const discount_amount_str = formData.get("discount_amount") as string;
  const discount_code = ((formData.get("discount_code") as string) || "").trim().toUpperCase();
  const discount_text = formData.get("discount_text") as string;
  const valid_until_str = formData.get("valid_until") as string;
  const is_active = formData.get("is_active") === "true";

  if (!title) return { error: "Title is required" };

  const valid_until = valid_until_str ? new Date(valid_until_str).toISOString().split('T')[0] : null;
  const discount_percentage = discount_type === "percent" && discount_percentage_str
    ? Number(discount_percentage_str)
    : null;
  const discount_amount = discount_type === "fixed" && discount_amount_str
    ? Number(discount_amount_str)
    : null;

  const supabase = await createServiceClient();

  if (id === "new") {
    const { error } = await (supabase.from("promotions") as any).insert({
      hotel_id: session.hotelId,
      title,
      description,
      image_url,
      discount_type,
      discount_percentage,
      discount_amount,
      discount_code: discount_code || null,
      discount_text,
      valid_until,
      is_active,
    });
    if (error) {
      console.error("create promotion error:", error);
      return { error: "Failed to create promotion: " + (error.message || "Unknown error") };
    }
  } else {
    const { error } = await (supabase.from("promotions") as any)
      .update({
        title,
        description,
        image_url,
        discount_type,
        discount_percentage,
        discount_amount,
        discount_code: discount_code || null,
        discount_text,
        valid_until,
        is_active,
      })
      .eq("id", id)
      .eq("hotel_id", session.hotelId);
    
    if (error) {
      console.error("update promotion error:", error);
      return { error: "Failed to update promotion: " + (error.message || "Unknown error") };
    }
  }

  revalidatePath("/admin/cms/promotions");
  revalidatePath("/");
  return { success: true };
}

export async function deletePromotion(id: string) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const supabase = await createServiceClient();
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
