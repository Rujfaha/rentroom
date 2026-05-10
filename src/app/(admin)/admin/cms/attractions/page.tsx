import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { AttractionEditor } from "@/components/admin/cms/AttractionEditor";

export const metadata = {
  title: "CMS | สถานที่ท่องเที่ยวใกล้เคียง",
};

export default async function AttractionsCMSPage() {
  const session = await getSession();
  if (!session || !session.hotelId) {
    redirect("/login");
  }

  const supabase = await createServiceClient();

  const { data: attractions } = await supabase
    .from("local_attractions")
    .select("*")
    .eq("hotel_id", session.hotelId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a]">
          สถานที่ท่องเที่ยวใกล้เคียง
        </h1>
        <p className="text-[#8b7355] text-sm mt-1">
          เพิ่ม/ลบ/แก้ไขสถานที่ท่องเที่ยวใกล้โรงแรมเพื่อแสดงบนหน้าเว็บไซต์
        </p>
      </div>

      <AttractionEditor initialAttractions={attractions || []} />
    </div>
  );
}
