import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroSlideEditor } from "@/components/admin/cms/HeroSlideEditor";

export default async function HeroCMSPage() {
  const session = await getSession();
  if (!session || !session.hotelId) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: slides } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("hotel_id", session.hotelId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a]">รูปภาพแบนเนอร์ (Hero Slides)</h1>
        <p className="text-[#8b7355] text-sm mt-1">จัดการรูปภาพสไลด์และข้อความพาดหัวที่แสดงผลบนหน้าแรกสุดของเว็บไซต์</p>
      </div>

      <HeroSlideEditor initialSlides={slides || []} />
    </div>
  );
}
