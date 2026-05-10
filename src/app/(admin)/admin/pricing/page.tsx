import { redirect } from "next/navigation";
import { Tags, CalendarRange, Info } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { PricingManager } from "@/components/admin/pricing/PricingManager";
import type { PricingRule, RoomType, Season } from "@/types/database.types";

export const metadata = {
  title: "ราคาและฤดูกาล | Arkkarawin",
};

interface PricingRuleView extends PricingRule {
  room_types?: { name: string; base_price: number | string | null } | null;
  seasons?: { name: string; start_date: string; end_date: string } | null;
}

interface OrderedQuery<T> {
  eq(column: string, value: string | boolean): OrderedQuery<T>;
  order(column: string, options: { ascending: boolean }): Promise<{ data: T[] | null; error: { message?: string } | null }>;
}

interface SelectTable<T> {
  select(columns: string): OrderedQuery<T>;
}

export default async function AdminPricingPage() {
  const session = await getSession();
  if (!session?.hotelId) redirect("/login");

  if (session.role !== "admin" && session.role !== "super_admin") {
    redirect("/admin");
  }

  const supabase = await createServiceClient();
  const hotelId = session.hotelId;
  const roomTypesTable = supabase.from("room_types") as unknown as SelectTable<RoomType>;
  const seasonsTable = supabase.from("seasons") as unknown as SelectTable<Season>;
  const pricingRulesTable = supabase.from("pricing_rules") as unknown as SelectTable<PricingRuleView>;

  const [{ data: roomTypes }, { data: seasons }, { data: pricingRules }] = await Promise.all([
    roomTypesTable
      .select("id, hotel_id, name, description, base_price, max_guests, amenities, is_active, created_at, updated_at")
      .eq("hotel_id", hotelId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    seasonsTable
      .select("*")
      .eq("hotel_id", hotelId)
      .order("start_date", { ascending: true }),
    pricingRulesTable
      .select(`
        *,
        room_types(name, base_price),
        seasons(name, start_date, end_date)
      `)
      .eq("hotel_id", hotelId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[#1a3c2a]/10 flex items-center justify-center text-[#1a3c2a]">
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-[#1a3c2a]">ราคาและฤดูกาล</h1>
              <p className="text-[#8b7355] text-sm mt-1">
                ตั้งราคาพื้นฐาน ราคาวันหยุด และราคาตามช่วงฤดูกาลสำหรับแต่ละประเภทห้อง
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e8e2d6] bg-white px-4 py-3 text-sm text-[#8b7355] flex items-start gap-3 max-w-xl">
          <Info className="h-4 w-4 text-[#c9a84c] mt-0.5 flex-shrink-0" />
          <p>
            แนะนำให้สร้างกฎราคาแบบราคาพื้นฐานก่อน แล้วเพิ่มราคาตามฤดูกาลเฉพาะช่วงที่ต่างจากปกติ
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#e8e2d6] bg-[#1a3c2a] p-4 text-white flex flex-col md:flex-row md:items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
          <CalendarRange className="h-5 w-5 text-[#c9a84c]" />
        </div>
        <div>
          <p className="font-semibold">โครงสร้างที่ใช้จริง</p>
          <p className="text-sm text-white/75 mt-0.5">
            ประเภทห้อง + ฤดูกาล + ประเภทวัน = ราคา ถ้าไม่เลือกฤดูกาล ระบบถือเป็นราคาพื้นฐาน
          </p>
        </div>
      </div>

      <PricingManager
        roomTypes={(roomTypes || []) as RoomType[]}
        seasons={(seasons || []) as Season[]}
        pricingRules={(pricingRules || []) as PricingRuleView[]}
      />
    </div>
  );
}
