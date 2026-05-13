import { redirect } from "next/navigation";
import { Tags, Info } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/session";
import { getPromotionEngineRows } from "@/app/actions/promotion-engine";
import { PromotionManager } from "@/components/admin/promotions/PromotionManager";
import type { RoomType } from "@/types/database.types";

export const metadata = {
  title: "โปรโมชั่น | Arkkarawin",
};

interface OrderedQuery<T> {
  eq(column: string, value: string | boolean): OrderedQuery<T>;
  order(column: string, options: { ascending: boolean }): Promise<{ data: T[] | null; error: { message?: string } | null }>;
}

interface SelectTable<T> {
  select(columns: string): OrderedQuery<T>;
}

export default async function AdminPromotionsPage() {
  const session = await getSession();
  if (!session?.hotelId) redirect("/login");

  if (session.role !== "admin" && session.role !== "super_admin") {
    redirect("/admin");
  }

  const supabase = await createServiceClient();
  const roomTypesTable = supabase.from("room_types") as unknown as SelectTable<RoomType>;
  const [{ data: roomTypes }, promotions] = await Promise.all([
    roomTypesTable
      .select("id, hotel_id, name, description, base_price, max_guests, amenities, is_active, created_at, updated_at")
      .eq("hotel_id", session.hotelId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    getPromotionEngineRows(session.hotelId, { includePrivate: true }),
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
              <h1 className="text-2xl font-serif text-[#1a3c2a]">โปรโมชั่น</h1>
              <p className="text-[#8b7355] text-sm mt-1">
                สร้างส่วนลดอัตโนมัติหรือ code ส่วนลดตามช่วงวันที่ ประเภทห้อง จำนวนคืน และเงื่อนไขการจอง
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e8e2d6] bg-white px-4 py-3 text-sm text-[#8b7355] flex items-start gap-3 max-w-xl">
          <Info className="h-4 w-4 text-[#c9a84c] mt-0.5 flex-shrink-0" />
          <p>ระบบจะคำนวณส่วนลดซ้ำที่ server ตอนสร้าง booking เสมอ และบันทึก snapshot ของ promotion ที่ใช้</p>
        </div>
      </div>

      <PromotionManager roomTypes={(roomTypes || []) as RoomType[]} promotions={promotions} />
    </div>
  );
}
