"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Edit3, Plus, Save, Tag, Trash2, XCircle } from "lucide-react";
import { deletePromotionEngine, upsertPromotionEngine } from "@/app/actions/promotion-engine";
import type { RoomType } from "@/types/database.types";
import type { PromotionBenefit, PromotionCondition, PromotionRow } from "@/lib/promotions/types";

interface PromotionManagerProps {
  roomTypes: RoomType[];
  promotions: PromotionRow[];
}

const inputClass = "w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm";
const dayOptions = [
  { value: "sun", label: "อาทิตย์" },
  { value: "mon", label: "จันทร์" },
  { value: "tue", label: "อังคาร" },
  { value: "wed", label: "พุธ" },
  { value: "thu", label: "พฤหัส" },
  { value: "fri", label: "ศุกร์" },
  { value: "sat", label: "เสาร์" },
];
const money = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
type TierFormRow = { min_nights: string; discount_percent: string };

export function PromotionManager({ roomTypes, promotions }: PromotionManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const activePromotions = promotions.filter((promotion) => promotion.is_active).length;
  const codePromotions = promotions.filter((promotion) => promotion.promotion_type === "code_required").length;
  const automaticPromotions = promotions.filter((promotion) => promotion.promotion_type !== "code_required").length;

  function runAction(action: () => Promise<{ success?: boolean; error?: string }>, successText: string) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: successText });
      setEditingId(null);
      window.setTimeout(() => setMessage(null), 2500);
    });
  }

  function submitPromotion(formData: FormData) {
    runAction(() => upsertPromotionEngine(formData), "บันทึกโปรโมชั่นเรียบร้อยแล้ว");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="โปรโมชั่นทั้งหมด" value={promotions.length} />
        <SummaryCard label="เปิดใช้งาน" value={activePromotions} />
        <SummaryCard label="อัตโนมัติ" value={automaticPromotions} />
        <SummaryCard label="ใช้ code" value={codePromotions} />
      </div>

      {message && (
        <div className={"rounded-xl border px-4 py-3 text-sm flex items-center gap-2 " + (message.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700")}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(420px,520px)_1fr] gap-5 items-start">
        <PromotionForm
          key={editingId || "new-promotion"}
          promotion={promotions.find((promotion) => promotion.id === editingId) || null}
          roomTypes={roomTypes}
          isPending={isPending}
          onSubmit={submitPromotion}
          onCancel={() => setEditingId(null)}
        />

        <div className="bg-white rounded-xl border border-[#e8e2d6] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e8e2d6] flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[#1a3c2a]">โปรโมชั่นทั้งหมด</h2>
              <p className="text-xs text-[#8b7355] mt-0.5">เลือกแก้ไขหรือปิดใช้งาน promotion ได้จากรายการนี้</p>
            </div>
            <Tag className="h-5 w-5 text-[#c9a84c]" />
          </div>
          <div className="divide-y divide-[#f0eadf]">
            {promotions.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#8b7355]">ยังไม่มีโปรโมชั่น เพิ่มรายการแรกจากฟอร์มด้านซ้ายได้เลย</div>
            ) : (
              promotions.map((promotion) => (
                <PromotionRowItem
                  key={promotion.id}
                  promotion={promotion}
                  roomTypes={roomTypes}
                  onEdit={() => setEditingId(promotion.id)}
                  onDelete={() => runAction(() => deletePromotionEngine(promotion.id), "ลบโปรโมชั่นเรียบร้อยแล้ว")}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#e8e2d6] bg-white p-4">
      <p className="text-xs font-medium text-[#8b7355]">{label}</p>
      <p className="mt-2 text-2xl font-serif text-[#1a3c2a]">{value}</p>
    </div>
  );
}

function PromotionForm(props: {
  promotion: PromotionRow | null;
  roomTypes: RoomType[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const promotion = props.promotion;
  const rule = promotion?.promotion_rules?.[0];
  const conditions = (rule?.conditions_json || {}) as PromotionCondition;
  const benefits = (rule?.benefits_json || {}) as PromotionBenefit;
  const [promotionType, setPromotionType] = useState(promotion?.promotion_type === "code_required" ? "code_required" : "automatic");
  const [benefitType, setBenefitType] = useState<PromotionBenefit["type"]>(benefits.type || (promotion?.discount_type === "fixed" ? "fixed" : "percent"));
  const [allRoomTypes, setAllRoomTypes] = useState(promotion?.applies_to_all_room_types !== false);
  const selectedRoomTypeIds = new Set(promotion?.promotion_room_types?.map((item) => item.room_type_id) || []);
  const selectedDays = new Set(conditions.days_of_week || []);
  const selectedChannels = new Set(conditions.booking_channels || ["website"]);
  const firstCode = promotion?.promotion_codes?.[0]?.code || promotion?.discount_code || "";

  const tiersDefault = useMemo<TierFormRow[]>(() => {
    if (!benefits.tiers?.length) return [{ min_nights: "2", discount_percent: "5" }];
    return benefits.tiers.map((tier) => ({
      min_nights: String(tier.min_nights || ""),
      discount_percent: String(tier.discount_percent || ""),
    }));
  }, [benefits.tiers]);
  const [tiers, setTiers] = useState<TierFormRow[]>(tiersDefault);
  const tiersJson = useMemo(() => JSON.stringify(tiers
    .map((tier) => ({
      min_nights: Number(tier.min_nights) || 0,
      discount_percent: Number(tier.discount_percent) || 0,
    }))
    .filter((tier) => tier.min_nights > 0 && tier.discount_percent > 0)
  ), [tiers]);

  function updateTier(index: number, key: keyof TierFormRow, value: string) {
    setTiers((current) => current.map((tier, tierIndex) => tierIndex === index ? { ...tier, [key]: value } : tier));
  }

  function addTier() {
    setTiers((current) => [...current, { min_nights: "", discount_percent: "" }]);
  }

  function removeTier(index: number) {
    setTiers((current) => current.length <= 1 ? [{ min_nights: "", discount_percent: "" }] : current.filter((_, tierIndex) => tierIndex !== index));
  }

  return (
    <form action={props.onSubmit} className="bg-white rounded-xl border border-[#e8e2d6] overflow-hidden h-fit">
      <input type="hidden" name="id" value={promotion?.id || "new"} />
      <div className="flex items-center justify-between gap-3 border-b border-[#e8e2d6] bg-[#faf7f0] px-4 py-3">
        <div>
          <h2 className="font-semibold text-[#1a3c2a]">{promotion ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่น"}</h2>
          <p className="text-xs text-[#8b7355] mt-0.5">กรอกข้อมูลหลักก่อน ส่วนขั้นสูงเปิดใช้เมื่อจำเป็น</p>
        </div>
        <Plus className="h-5 w-5 text-[#c9a84c]" />
      </div>

      <div className="p-4 space-y-4">
        <FormSection title="ข้อมูลหลัก" description="ตั้งชื่อ เลือกว่าจะใช้ code หรือให้ระบบใช้ส่วนลดอัตโนมัติ">
          <Field label="ชื่อโปรโมชั่น">
            <input name="title" defaultValue={promotion?.title || ""} required placeholder="เช่น พัก 3 คืน ลด 10%" className={inputClass} />
          </Field>

          <Field label="รายละเอียด">
            <textarea name="description" defaultValue={promotion?.description || ""} rows={2} placeholder="ข้อความสั้น ๆ สำหรับให้ทีมงานเข้าใจโปรนี้" className={inputClass} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="วิธีใช้โปรโมชั่น">
              <select name="promotion_type" value={promotionType} onChange={(event) => setPromotionType(event.target.value as "automatic" | "code_required")} className={inputClass}>
                <option value="automatic">ใช้ให้อัตโนมัติ</option>
                <option value="code_required">ลูกค้าต้องกรอก code</option>
              </select>
            </Field>
            <Field label="สิ้นสุดโปรโมชั่น">
              <input name="ends_at" type="date" defaultValue={promotion?.ends_at?.split("T")[0] || promotion?.valid_until || ""} className={inputClass} />
            </Field>
          </div>

          {promotionType === "code_required" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-[#e8e2d6] bg-[#faf7f0] p-3">
              <Field label="Code ส่วนลด">
                <input name="code" defaultValue={firstCode} className={inputClass + " uppercase bg-white"} placeholder="SUMMER10" />
              </Field>
              <Field label="จำนวนใช้ code สูงสุด">
                <input name="code_max_uses" type="number" min="1" defaultValue={promotion?.promotion_codes?.[0]?.max_uses || ""} placeholder="ไม่จำกัดถ้าเว้นว่าง" className={inputClass + " bg-white"} />
              </Field>
            </div>
          )}
        </FormSection>

        <FormSection title="ส่วนลด" description="เลือกรูปแบบส่วนลด แล้วกรอกค่าที่ต้องใช้">
          <Field label="รูปแบบส่วนลด">
            <select name="benefit_type" value={benefitType} onChange={(event) => setBenefitType(event.target.value as PromotionBenefit["type"])} className={inputClass}>
              <option value="percent">ลดเป็นเปอร์เซ็นต์</option>
              <option value="fixed">ลดเป็นจำนวนเงิน</option>
              <option value="per_night">ลดต่อคืน</option>
              <option value="stay_x_pay_y">พัก X คืน จ่าย Y คืน</option>
              <option value="fixed_price">ราคาพิเศษต่อคืน</option>
              <option value="tiered_percent">ขั้นบันไดตามจำนวนคืน</option>
            </select>
          </Field>

          {benefitType === "percent" && <Field label="ลดกี่เปอร์เซ็นต์"><input name="discount_percent" type="number" min="0" max="100" step="0.01" defaultValue={benefits.discount_percent || promotion?.discount_percentage || ""} placeholder="เช่น 10" className={inputClass} /></Field>}
          {benefitType === "fixed" && <Field label="ลดกี่บาท"><input name="discount_amount" type="number" min="0" step="0.01" defaultValue={benefits.discount_amount || promotion?.discount_amount || ""} placeholder="เช่น 500" className={inputClass} /></Field>}
          {benefitType === "per_night" && <Field label="ลดกี่บาทต่อคืน"><input name="per_night_amount" type="number" min="0" step="0.01" defaultValue={benefits.per_night_amount || ""} placeholder="เช่น 200" className={inputClass} /></Field>}
          {benefitType === "stay_x_pay_y" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="พักกี่คืน"><input name="stay_nights" type="number" min="1" defaultValue={benefits.stay_nights || ""} placeholder="เช่น 3" className={inputClass} /></Field>
              <Field label="จ่ายกี่คืน"><input name="pay_nights" type="number" min="0" defaultValue={benefits.pay_nights || ""} placeholder="เช่น 2" className={inputClass} /></Field>
            </div>
          )}
          {benefitType === "fixed_price" && <Field label="ราคาพิเศษต่อคืน"><input name="fixed_price" type="number" min="0" step="0.01" defaultValue={benefits.fixed_price || ""} placeholder="เช่น 1200" className={inputClass} /></Field>}
          {benefitType === "tiered_percent" && (
            <div className="space-y-2">
              <input type="hidden" name="tiers_json" value={tiersJson} />
              <div className="flex items-center justify-between gap-3">
                <span className="block text-xs font-medium text-[#8b7355]">ขั้นส่วนลดตามจำนวนคืน</span>
                <button type="button" onClick={addTier} className="inline-flex items-center gap-1 rounded-md border border-[#e8e2d6] px-2 py-1 text-xs text-[#1a3c2a] hover:bg-[#faf7f0] cursor-pointer">
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่มขั้น
                </button>
              </div>
              <div className="space-y-2 rounded-lg border border-[#e8e2d6] bg-[#faf7f0] p-3">
                {tiers.map((tier, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 rounded-md bg-white p-2 border border-[#f0eadf]">
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8b7355] mb-1">พักอย่างน้อยกี่คืน</span>
                      <input
                        type="number"
                        min="1"
                        value={tier.min_nights}
                        onChange={(event) => updateTier(index, "min_nights", event.target.value)}
                        className={inputClass}
                        placeholder="เช่น 2"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-medium text-[#8b7355] mb-1">ลดกี่เปอร์เซ็นต์</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={tier.discount_percent}
                        onChange={(event) => updateTier(index, "discount_percent", event.target.value)}
                        className={inputClass}
                        placeholder="เช่น 5"
                        required
                      />
                    </label>
                    <button type="button" onClick={() => removeTier(index)} className="sm:self-end inline-flex items-center justify-center rounded-md border border-red-100 px-3 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#8b7355]">ตัวอย่าง: พักอย่างน้อย 2 คืน ลด 5%, พักอย่างน้อย 5 คืน ลด 12%</p>
            </div>
          )}

          <Field label="ข้อความส่วนลดที่แสดงผล">
            <input name="discount_text" defaultValue={promotion?.discount_text || ""} placeholder="เช่น ลด 10% เมื่อพัก 3 คืน" className={inputClass} />
          </Field>
        </FormSection>

        <FormSection title="เงื่อนไขใช้งาน" description="เลือกห้องและเงื่อนไขหลัก ถ้าไม่กำหนดจะใช้ได้กับทุก booking">
          <Field label="ประเภทห้อง">
            <div className="space-y-2 rounded-lg border border-[#e8e2d6] bg-[#faf7f0] p-3">
              <label className="flex items-center gap-2 text-sm text-[#1a3c2a]">
                <input type="checkbox" name="applies_to_all_room_types" value="true" checked={allRoomTypes} onChange={(event) => setAllRoomTypes(event.target.checked)} />
                ใช้ได้ทุกประเภทห้อง
              </label>
              {!allRoomTypes && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {props.roomTypes.map((roomType) => (
                    <label key={roomType.id} className="flex items-center gap-2 text-xs text-[#8b7355]">
                      <input type="checkbox" name="room_type_ids" value={roomType.id} defaultChecked={selectedRoomTypeIds.has(roomType.id)} />
                      {roomType.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="จำนวนคืนขั้นต่ำ">
              <input name="min_nights" type="number" min="1" defaultValue={conditions.min_nights || ""} placeholder="ไม่กำหนด" className={inputClass} />
            </Field>
            <Field label="ยอดจองขั้นต่ำ">
              <input name="min_subtotal" type="number" min="0" defaultValue={conditions.min_subtotal || ""} placeholder="ไม่กำหนด" className={inputClass} />
            </Field>
          </div>
        </FormSection>

        <details className="group rounded-xl border border-[#e8e2d6] bg-[#faf7f0]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
            <span>
              <span className="block text-sm font-semibold text-[#1a3c2a]">ตั้งค่าขั้นสูง</span>
              <span className="block text-xs text-[#8b7355]">กำหนดวันเข้าพัก ช่องทาง โควตา และลำดับความสำคัญ</span>
            </span>
            <span className="text-xs font-medium text-[#8b7355] group-open:hidden">เปิด</span>
            <span className="hidden text-xs font-medium text-[#8b7355] group-open:block">ปิด</span>
          </summary>
          <div className="space-y-4 border-t border-[#e8e2d6] bg-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="เริ่มใช้งาน">
                <input name="starts_at" type="date" defaultValue={promotion?.starts_at?.split("T")[0] || ""} className={inputClass} />
              </Field>
              <Field label="จำนวนคืนสูงสุด">
                <input name="max_nights" type="number" min="1" defaultValue={conditions.max_nights || ""} placeholder="ไม่กำหนด" className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="วันที่เข้าพักเริ่มต้น">
                <input name="stay_start_date" type="date" defaultValue={promotion?.stay_start_date || ""} className={inputClass} />
              </Field>
              <Field label="วันที่เข้าพักสิ้นสุด">
                <input name="stay_end_date" type="date" defaultValue={promotion?.stay_end_date || ""} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="ส่วนลดสูงสุด">
                <input name="max_discount_amount" type="number" min="0" defaultValue={benefits.max_discount_amount || ""} placeholder="ไม่จำกัด" className={inputClass} />
              </Field>
              <Field label="ลำดับความสำคัญ">
                <input name="priority" type="number" step="1" defaultValue={promotion?.priority || 0} className={inputClass} />
              </Field>
            </div>

            <Field label="ใช้ได้ในวัน">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg border border-[#e8e2d6] bg-[#faf7f0] p-3">
                {dayOptions.map((day) => (
                  <label key={day.value} className="flex items-center gap-2 text-xs text-[#8b7355]">
                    <input type="checkbox" name="days_of_week" value={day.value} defaultChecked={selectedDays.has(day.value)} />
                    {day.label}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="ช่องทางการจอง">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-[#e8e2d6] bg-[#faf7f0] p-3">
                {[
                  { value: "website", label: "Website" },
                  { value: "admin", label: "Admin" },
                  { value: "walk_in", label: "Walk-in" },
                  { value: "partner", label: "Partner" },
                ].map((channel) => (
                  <label key={channel.value} className="flex items-center gap-2 text-xs text-[#8b7355]">
                    <input type="checkbox" name="booking_channels" value={channel.value} defaultChecked={selectedChannels.has(channel.value as "website" | "admin" | "walk_in" | "partner")} />
                    {channel.label}
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="จำนวนใช้สูงสุดทั้งหมด">
                <input name="max_uses" type="number" min="1" defaultValue={promotion?.max_uses || ""} placeholder="ไม่จำกัด" className={inputClass} />
              </Field>
              <Field label="จำนวนใช้สูงสุดต่อลูกค้า">
                <input name="max_uses_per_customer" type="number" min="1" defaultValue={promotion?.max_uses_per_customer || ""} placeholder="ไม่จำกัด" className={inputClass} />
              </Field>
            </div>

            <Toggle name="exclusive" defaultChecked={promotion?.exclusive ?? false} label="ไม่ใช้ร่วมกับโปรโมชั่นอื่น" />
          </div>
        </details>

        <Toggle name="is_active" defaultChecked={promotion?.is_active ?? true} label="เปิดใช้งานโปรโมชั่นนี้" />
      </div>

      <div className="flex justify-end gap-2 border-t border-[#e8e2d6] bg-[#faf7f0] px-4 py-3">
        {promotion && <button type="button" onClick={props.onCancel} className="px-3 py-2 text-sm border border-[#e8e2d6] bg-white text-[#8b7355] rounded-md hover:bg-[#faf7f0] cursor-pointer">ยกเลิก</button>}
        <button type="submit" disabled={props.isPending} className="px-4 py-2 text-sm bg-[#1a3c2a] text-[#faf7f0] rounded-md hover:bg-[#0f2418] flex items-center gap-2 cursor-pointer disabled:opacity-60">
          <Save className="w-4 h-4" />
          {props.isPending ? "กำลังบันทึก..." : "บันทึกโปรโมชั่น"}
        </button>
      </div>
    </form>
  );
}

function PromotionRowItem(props: { promotion: PromotionRow; roomTypes: RoomType[]; onEdit: () => void; onDelete: () => void }) {
  const rule = props.promotion.promotion_rules?.[0];
  const benefits = (rule?.benefits_json || {}) as PromotionBenefit;
  const roomTypeNames = props.promotion.applies_to_all_room_types !== false
    ? "ทุกประเภทห้อง"
    : (props.promotion.promotion_room_types || [])
        .map((item) => props.roomTypes.find((roomType) => roomType.id === item.room_type_id)?.name)
        .filter(Boolean)
        .join(", ") || "ยังไม่เลือกประเภทห้อง";

  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-[#1a3c2a]">{props.promotion.title}</h3>
          <StatusBadge active={props.promotion.is_active} />
          <span className="rounded-full bg-[#faf7f0] px-2 py-0.5 text-[11px] font-medium text-[#8b7355]">
            {props.promotion.promotion_type === "code_required" ? "ใช้ code" : "อัตโนมัติ"}
          </span>
        </div>
        <p className="text-sm text-[#8b7355] mt-1 line-clamp-2">{props.promotion.description || "-"}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#8b7355]">
          <span>{roomTypeNames}</span>
          {props.promotion.discount_code && <span>{"Code: " + props.promotion.discount_code}</span>}
          <span>{formatBenefit(benefits, props.promotion)}</span>
          <span>{"ใช้แล้ว " + String(props.promotion.used_count || 0) + " ครั้ง"}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={props.onEdit} className="p-2 rounded-lg border border-[#e8e2d6] text-[#1a3c2a] hover:bg-[#faf7f0] cursor-pointer">
          <Edit3 className="h-4 w-4" />
        </button>
        <button type="button" onClick={props.onDelete} className="p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 cursor-pointer">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function formatBenefit(benefit: PromotionBenefit, promotion: PromotionRow): string {
  const type = benefit.type || (promotion.discount_type === "fixed" ? "fixed" : "percent");
  if (type === "fixed") return "ลด " + money.format(Number(benefit.discount_amount || promotion.discount_amount || 0)) + " บาท";
  if (type === "percent") return "ลด " + String(Number(benefit.discount_percent || promotion.discount_percentage || 0)) + "%";
  if (type === "per_night") return "ลดคืนละ " + money.format(Number(benefit.per_night_amount || 0)) + " บาท";
  if (type === "stay_x_pay_y") return "พัก " + String(benefit.stay_nights || 0) + " จ่าย " + String(benefit.pay_nights || 0);
  if (type === "fixed_price") return "ราคาพิเศษ " + money.format(Number(benefit.fixed_price || 0)) + " บาท/คืน";
  return "ลดแบบขั้นบันได";
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={"rounded-full px-2 py-0.5 text-[11px] font-medium " + (active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
      {active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
    </span>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#e8e2d6] bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold text-[#1a3c2a]">{title}</h3>
        <p className="mt-0.5 text-xs text-[#8b7355]">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#8b7355] mb-1">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#1a3c2a]">
      <input type="checkbox" name={name} value="true" defaultChecked={defaultChecked} className="w-4 h-4" />
      {label}
    </label>
  );
}
