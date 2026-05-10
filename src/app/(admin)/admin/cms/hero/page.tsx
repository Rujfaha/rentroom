import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { HeroSlideEditor } from "@/components/admin/cms/HeroSlideEditor";

export const metadata = {
  title: "CMS | รูปภาพต้อนรับ (Hero Slides)",
};

export default async function HeroSlidesCMSPage() {
  const session = await getSession();
  if (!session || !session.hotelId) {
    redirect("/login");
  }

  const supabase = await createServiceClient();

  const { data: slides } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("hotel_id", session.hotelId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-serif text-[#1a3c2a]">รูปภาพแบนเนอร์</h1>
        <p className="text-[#8b7355] text-sm mt-1">จัดการรูปภาพสไลด์และข้อความพาดหัวที่แสดงผลบนหน้าแรกสุดของเว็บไซต์</p>
      </div>

      <HeroSlideEditor initialSlides={slides || []} />
    </div>
  );
}
