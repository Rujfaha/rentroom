import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { ContactsTabs } from "@/components/admin/cms/ContactsTabs";
import { redirect } from "next/navigation";
import type { CmsContactRow } from "@/components/admin/cms/ContactEditor";

interface ContactsHotelSettingsRow {
  settings: Record<string, unknown> | null;
}

interface PromptPaySettings {
  accountId: string;
  accountName: string;
  type: "phone" | "national_id";
}

function getPromptPaySettings(settings: Record<string, unknown> | null | undefined): PromptPaySettings {
  const promptpay = settings?.promptpay;
  if (!promptpay || typeof promptpay !== "object") {
    return { accountId: "", accountName: "", type: "phone" };
  }

  const data = promptpay as Record<string, unknown>;
  return {
    accountId: typeof data.accountId === "string" ? data.accountId : "",
    accountName: typeof data.accountName === "string" ? data.accountName : "",
    type: data.type === "national_id" ? "national_id" : "phone",
  };
}

export const metadata = {
  title: "ข้อมูลติดต่อและการชำระเงิน | Arkkarawin",
};

export default async function ContactsCmsPage() {
  const session = await getSession();
  if (!session?.hotelId) redirect("/admin");

  const supabase = await createServiceClient();

  // Fetch Contacts
  const { data: contactsData } = await supabase
    .from("cms_hotel_contacts")
    .select("*")
    .eq("hotel_id", session.hotelId)
    .order("sort_order", { ascending: true });
  const contacts = (contactsData ?? []) as unknown as CmsContactRow[];

  // Fetch Settings for PromptPay
  const { data: hotelData } = await supabase
    .from("hotels")
    .select("settings")
    .eq("id", session.hotelId)
    .single();

  const hotel = hotelData as unknown as ContactsHotelSettingsRow | null;
  const promptpay = getPromptPaySettings(hotel?.settings);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a]">ข้อมูลติดต่อ & การชำระเงิน</h1>
        <p className="text-[#8b7355] text-sm mt-1">
          แก้ไขเบอร์โทร โซเชียลมีเดีย และบัญชี PromptPay สำหรับหน้า Landing Page
        </p>
      </div>

      <ContactsTabs contacts={contacts} promptpay={promptpay} />
    </div>
  );
}
