import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { HotelSettingsEditor } from "@/components/admin/cms/HotelSettingsEditor";

export const metadata = {
  title: "CMS | ตั้งค่าทั่วไป",
};

export default async function SettingsCMSPage() {
  const session = await getSession();
  if (!session || !session.hotelId) {
    redirect("/login");
  }

  const supabase = await createServiceClient();

  const { data: hotel } = await supabase
    .from("hotels")
    .select("name, description, address")
    .eq("id", session.hotelId)
    .single();

  return (
    <div className="w-full min-h-full flex flex-col justify-center pb-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a]">ตั้งค่าโรงแรม</h1>
          <p className="text-[#8b7355] text-sm mt-1">จัดการชื่อ คำอธิบาย และที่อยู่ของโรงแรม</p>
        </div>

        <div className="max-w-3xl">
          <HotelSettingsEditor initialData={hotel} />
        </div>
      </div>
    </div>
  );
}
