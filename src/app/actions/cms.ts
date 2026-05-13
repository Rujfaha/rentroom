"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { ContactType, Hotel } from "@/types/database.types";

interface DbError {
  message?: string;
}

interface HotelSettingsRow {
  settings: Record<string, unknown> | null;
}

interface InsertOnlyTable<TInsert> {
  insert(value: TInsert): Promise<{ error: DbError | null }>;
}

interface UpdateByHotelTable<TUpdate> {
  update(value: TUpdate): {
    eq(column: string, value: string): Promise<{ error: DbError | null }>;
  };
}

interface UpdateScopedTable<TUpdate> {
  update(value: TUpdate): {
    eq(column: string, value: string): {
      eq(column: string, value: string): Promise<{ error: DbError | null }>;
    };
  };
}

interface ContactInsert {
  hotel_id: string;
  contact_type: ContactType;
  value: string;
  label: string | null;
  is_visible: boolean;
}

function toContactType(value: string): ContactType {
  const allowed: ContactType[] = ["phone", "email", "facebook", "line", "instagram", "website", "tiktok", "whatsapp", "map_url", "other"];
  return allowed.includes(value as ContactType) ? value as ContactType : "other";
}

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

  const hotel = hotelData as unknown as HotelSettingsRow | null;
  const currentSettings = hotel?.settings || {};

  // 2. Update PromptPay setting
  const newSettings = {
    ...currentSettings,
    promptpay: {
      accountId,
      accountName,
      type,
    },
  };

  const hotelsTable = supabase.from("hotels") as unknown as UpdateByHotelTable<Partial<Hotel>>;
  const { error: updateErr } = await hotelsTable
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
  const type = toContactType(String(formData.get("type") || ""));
  const value = formData.get("value") as string;
  const label = formData.get("label") as string;
  const isVisible = formData.get("isVisible") === "true";

  const supabase = await createClient();

  if (id === "new") {
    // Insert new
    const contactsInsertTable = supabase.from("cms_hotel_contacts") as unknown as InsertOnlyTable<ContactInsert>;
    const { error } = await contactsInsertTable.insert({
      hotel_id: session.hotelId,
      contact_type: type,
      value,
      label: label || null,
      is_visible: isVisible,
    });
    if (error) return { error: "Failed to create contact" };
  } else {
    // Update existing
    const contactsUpdateTable = supabase.from("cms_hotel_contacts") as unknown as UpdateScopedTable<Partial<ContactInsert>>;
    const { error } = await contactsUpdateTable
      .update({
        value,
        label: label || null,
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

  const hotelsTable = supabase.from("hotels") as unknown as UpdateByHotelTable<Partial<Hotel>>;
  const { error } = await hotelsTable
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

  const hotel = hotelData as unknown as HotelSettingsRow | null;
  const currentSettings = hotel?.settings || {};
  const hotelsTable = supabase.from("hotels") as unknown as UpdateByHotelTable<Partial<Hotel>>;
  const { error: updateErr } = await hotelsTable
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
