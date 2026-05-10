import { getSession } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { ContactsTabs } from "@/components/admin/cms/ContactsTabs";
import { redirect } from "next/navigation";

export const metadata = {
  title: "ข้อมูลติดต่อและการชำระเงิน | Arkkarawin",
};

export default async function ContactsCmsPage() {
  const session = await getSession();
  if (!session?.hotelId) redirect("/admin");

  const supabase = await createServiceClient();

  // Fetch Contacts
  const { data: contacts } = await supabase
    .from("cms_hotel_contacts")
    .select("*")
    .eq("hotel_id", session.hotelId)
    .order("sort_order", { ascending: true });

  // Fetch Settings for PromptPay
  const { data: hotelData } = await supabase
    .from("hotels")
    .select("settings")
    .eq("id", session.hotelId)
    .single();

  const hotel = hotelData as any;
  const settings = (hotel?.settings as Record<string, any>) || {};
  const promptpay = settings.promptpay || {
    accountId: "",
    accountName: "",
    type: "phone",
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a]">ข้อมูลติดต่อ & การชำระเงิน</h1>
        <p className="text-[#8b7355] text-sm mt-1">
          แก้ไขเบอร์โทร โซเชียลมีเดีย และบัญชี PromptPay สำหรับหน้า Landing Page
        </p>
      </div>

      <ContactsTabs contacts={contacts || []} promptpay={promptpay} />
    </div>
  );
}
