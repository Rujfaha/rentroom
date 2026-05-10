"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updatePromptPay(formData: FormData) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized or no hotel assigned" };

  const accountId = formData.get("accountId") as string;
  const accountName = formData.get("accountName") as string;
  const type = formData.get("type") as "phone" | "national_id";

  if (!accountId || !accountName) {
    return { error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  const supabase = await createClient();

  // 1. Fetch current settings to preserve other settings
  const { data: hotelData, error: fetchErr } = await supabase
    .from("hotels")
    .select("settings")
    .eq("id", session.hotelId)
    .single();

  if (fetchErr) return { error: "Failed to fetch hotel settings" };

  const hotel = hotelData as any;
  const currentSettings = (hotel?.settings as Record<string, any>) || {};

  // 2. Update PromptPay setting
  const newSettings = {
    ...currentSettings,
    promptpay: {
      accountId,
      accountName,
      type,
    },
  };

  const { error: updateErr } = await (supabase.from("hotels") as any)
    .update({ settings: newSettings })
    .eq("id", session.hotelId);

  if (updateErr) return { error: "Failed to update PromptPay settings" };

  revalidatePath("/admin/cms/contacts");
  revalidatePath("/"); // revalidate landing page
  
  return { success: true };
}

export async function updateContact(formData: FormData) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized or no hotel assigned" };

  const id = formData.get("id") as string;
  const type = formData.get("type") as string;
  const value = formData.get("value") as string;
  const label = formData.get("label") as string;
  const isVisible = formData.get("isVisible") === "true";

  const supabase = await createClient();

  if (id === "new") {
    // Insert new
    const { error } = await (supabase.from("cms_hotel_contacts") as any).insert({
      hotel_id: session.hotelId,
      contact_type: type,
      value,
      label,
      is_visible: isVisible,
    });
    if (error) return { error: "Failed to create contact" };
  } else {
    // Update existing
    const { error } = await (supabase.from("cms_hotel_contacts") as any)
      .update({
        value,
        label,
        is_visible: isVisible,
      })
      .eq("id", id)
      .eq("hotel_id", session.hotelId); // security check

    if (error) return { error: "Failed to update contact" };
  }

  revalidatePath("/admin/cms/contacts");
  revalidatePath("/"); 
  return { success: true };
}

export async function deleteContact(id: string) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_hotel_contacts")
    .delete()
    .eq("id", id)
    .eq("hotel_id", session.hotelId);

  if (error) return { error: "Failed to delete contact" };
  
  revalidatePath("/admin/cms/contacts");
  revalidatePath("/");
  return { success: true };
}

export async function updateHotelGeneralSettings(formData: FormData) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const address = formData.get("address") as string;

  if (!name) return { error: "Hotel name is required" };

  const supabase = await createClient();

  const { error } = await (supabase.from("hotels") as any)
    .update({ name, description, address })
    .eq("id", session.hotelId);

  if (error) return { error: "Failed to update hotel settings" };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateSeoSettings(formData: FormData) {
  const session = await getSession();
  if (!session?.hotelId) return { error: "Unauthorized" };

  const seo = {
    siteName: String(formData.get("siteName") || "").trim(),
    titleTemplate: String(formData.get("titleTemplate") || "").trim(),
    metaTitle: String(formData.get("metaTitle") || "").trim(),
    metaDescription: String(formData.get("metaDescription") || "").trim(),
    keywords: String(formData.get("keywords") || "").trim(),
    ogImageUrl: String(formData.get("ogImageUrl") || "").trim(),
    canonicalBaseUrl: String(formData.get("canonicalBaseUrl") || "").trim().replace(/\/+$/, ""),
    googleSiteVerification: String(formData.get("googleSiteVerification") || "").trim(),
    allowIndex: formData.get("allowIndex") === "on",
  };

  const supabase = await createClient();
  const { data: hotelData, error: fetchErr } = await supabase
    .from("hotels")
    .select("settings")
    .eq("id", session.hotelId)
    .single();

  if (fetchErr) return { error: "Failed to fetch SEO settings" };

  const currentSettings = ((hotelData as any)?.settings as Record<string, any>) || {};
  const { error: updateErr } = await (supabase.from("hotels") as any)
    .update({
      settings: {
        ...currentSettings,
        seo,
      },
    })
    .eq("id", session.hotelId);

  if (updateErr) return { error: "Failed to update SEO settings" };

  revalidatePath("/", "layout");
  revalidatePath("/booking");
  revalidatePath("/admin/cms/seo");
  return { success: true };
}
