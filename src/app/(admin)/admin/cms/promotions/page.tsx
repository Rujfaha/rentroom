import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PromotionEditor } from "@/components/admin/cms/PromotionEditor";

export default async function PromotionsCMSPage() {
  const session = await getSession();
  if (!session || !session.hotelId) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: promotions } = await supabase
    .from("promotions")
    .select("*")
    .eq("hotel_id", session.hotelId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a]">จัดการโปรโมชั่น (Promotions)</h1>
        <p className="text-[#8b7355] text-sm mt-1">เพิ่ม/ลบ ส่วนลดหรือแพ็กเกจพิเศษ เพื่อแสดงบนหน้าเว็บไซต์</p>
      </div>

      <PromotionEditor initialPromotions={promotions || []} />
    </div>
  );
}
