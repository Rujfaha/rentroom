"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarRange, CheckCircle2, Edit3, Plus, Save, Trash2, XCircle } from "lucide-react";
import { deletePricingRule, deleteSeason, upsertPricingRule, upsertSeason } from "@/app/actions/pricing";
import type { DayType, PricingRule, RoomType, Season } from "@/types/database.types";

interface PricingRuleView extends PricingRule {
  room_types?: { name: string; base_price: number | string | null } | null;
  seasons?: { name: string; start_date: string; end_date: string } | null;
}

interface PricingManagerProps {
  roomTypes: RoomType[];
  seasons: Season[];
  pricingRules: PricingRuleView[];
}

const dayTypeOptions: Array<{ value: DayType; label: string; hint: string }> = [
  { value: "weekday", label: "วันธรรมดา", hint: "จันทร์-พฤหัส" },
  { value: "weekend", label: "สุดสัปดาห์", hint: "ศุกร์-อาทิตย์" },
  { value: "holiday", label: "วันหยุด", hint: "นักขัตฤกษ์" },
  { value: "special", label: "พิเศษ", hint: "อีเวนต์" },
];

const money = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });

export function PricingManager({ roomTypes, seasons, pricingRules }: PricingManagerProps) {
  const [activeTab, setActiveTab] = useState<"seasons" | "rules">("rules");
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeSeasons = seasons.filter((season) => season.is_active).length;
  const activeRules = pricingRules.filter((rule) => rule.is_active).length;
  const baseRuleCount = pricingRules.filter((rule) => !rule.season_id).length;
  const averagePrice = useMemo(() => {
    const prices = pricingRules.filter((rule) => rule.is_active).map((rule) => Number(rule.price) || 0);
    if (!prices.length) return 0;
    return Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  }, [pricingRules]);

  function runAction(action: () => Promise<{ success?: boolean; error?: string }>, successText: string) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: successText });
      setEditingSeasonId(null);
      setEditingRuleId(null);
      window.setTimeout(() => setMessage(null), 2500);
    });
  }

  function submitSeason(formData: FormData) {
    runAction(() => upsertSeason(formData), "บันทึกฤดูกาลเรียบร้อยแล้ว");
  }

  function submitRule(formData: FormData) {
    runAction(() => upsertPricingRule(formData), "บันทึกกฎราคาเรียบร้อยแล้ว");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="ประเภทห้อง" value={roomTypes.length} />
        <SummaryCard label="ฤดูกาลที่เปิดใช้" value={activeSeasons} />
        <SummaryCard label="กฎราคาที่เปิดใช้" value={activeRules} />
        <SummaryCard label="ราคาเฉลี่ย" value={averagePrice ? "฿" + money.format(averagePrice) : "-"} />
      </div>

      {message && (
        <div className={"rounded-xl border px-4 py-3 text-sm flex items-center gap-2 " + (message.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700")}>
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div className="flex rounded-xl border border-[#e8e2d6] bg-white p-1">
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={"flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors " + (activeTab === "rules" ? "bg-[#1a3c2a] text-white" : "text-[#8b7355] hover:bg-[#faf7f0]")}
        >
          กฎราคา
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seasons")}
          className={"flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors " + (activeTab === "seasons" ? "bg-[#1a3c2a] text-white" : "text-[#8b7355] hover:bg-[#faf7f0]")}
        >
          ฤดูกาล
        </button>
      </div>

      {activeTab === "rules" ? (
        <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
          <RuleForm
            key={editingRuleId || "new-rule"}
            rule={pricingRules.find((rule) => rule.id === editingRuleId) || null}
            roomTypes={roomTypes}
            seasons={seasons}
            isPending={isPending}
            onSubmit={submitRule}
            onCancel={() => setEditingRuleId(null)}
          />
          <div className="bg-white rounded-xl border border-[#e8e2d6] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e2d6] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#1a3c2a]">กฎราคาทั้งหมด</h2>
                <p className="text-xs text-[#8b7355] mt-0.5">มี base price {baseRuleCount} รายการ และ season-specific {pricingRules.length - baseRuleCount} รายการ</p>
              </div>
              <CalendarRange className="h-5 w-5 text-[#c9a84c]" />
            </div>
            <div className="divide-y divide-[#f0eadf]">
              {pricingRules.length === 0 ? (
                <EmptyState text="ยังไม่มีกฎราคา เพิ่ม base price หรือราคาตามฤดูกาลด้านซ้ายได้เลย" />
              ) : (
                pricingRules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onEdit={() => setEditingRuleId(rule.id)}
                    onDelete={() => runAction(() => deletePricingRule(rule.id), "ลบกฎราคาเรียบร้อยแล้ว")}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
          <SeasonForm
            key={editingSeasonId || "new-season"}
            season={seasons.find((season) => season.id === editingSeasonId) || null}
            isPending={isPending}
            onSubmit={submitSeason}
            onCancel={() => setEditingSeasonId(null)}
          />
          <div className="bg-white rounded-xl border border-[#e8e2d6] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e2d6]">
              <h2 className="font-semibold text-[#1a3c2a]">ฤดูกาลทั้งหมด</h2>
              <p className="text-xs text-[#8b7355] mt-0.5">ใช้กำหนดช่วงราคาสำหรับ high season, low season หรือเทศกาล</p>
            </div>
            <div className="divide-y divide-[#f0eadf]">
              {seasons.length === 0 ? (
                <EmptyState text="ยังไม่มีฤดูกาล เพิ่มช่วงวันที่ด้านซ้ายเพื่อเริ่มใช้งาน" />
              ) : (
                seasons.map((season) => (
                  <SeasonRow
                    key={season.id}
                    season={season}
                    onEdit={() => setEditingSeasonId(season.id)}
                    onDelete={() => runAction(() => deleteSeason(season.id), "ลบฤดูกาลเรียบร้อยแล้ว")}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}
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

function SeasonForm(props: {
  season: Season | null;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={props.onSubmit} className="bg-white rounded-xl border border-[#e8e2d6] p-4 space-y-4 h-fit">
      <input type="hidden" name="id" value={props.season?.id || "new"} />
      <FormTitle title={props.season ? "แก้ไขฤดูกาล" : "เพิ่มฤดูกาล"} />
      <Field label="ชื่อฤดูกาล">
        <input name="name" defaultValue={props.season?.name || ""} required placeholder="เช่น High Season" className={inputClass} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="เริ่มต้น">
          <input name="start_date" type="date" defaultValue={props.season?.start_date || ""} required className={inputClass} />
        </Field>
        <Field label="สิ้นสุด">
          <input name="end_date" type="date" defaultValue={props.season?.end_date || ""} required className={inputClass} />
        </Field>
      </div>
      <Toggle name="is_active" defaultChecked={props.season?.is_active ?? true} label="เปิดใช้งานฤดูกาลนี้" />
      <FormActions isPending={props.isPending} onCancel={props.onCancel} showCancel={Boolean(props.season)} />
    </form>
  );
}

function RuleForm(props: {
  rule: PricingRuleView | null;
  roomTypes: RoomType[];
  seasons: Season[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={props.onSubmit} className="bg-white rounded-xl border border-[#e8e2d6] p-4 space-y-4 h-fit">
      <input type="hidden" name="id" value={props.rule?.id || "new"} />
      <FormTitle title={props.rule ? "แก้ไขกฎราคา" : "เพิ่มกฎราคา"} />
      <Field label="ประเภทห้อง">
        <select name="room_type_id" defaultValue={props.rule?.room_type_id || ""} required className={inputClass}>
          <option value="">เลือกประเภทห้อง</option>
          {props.roomTypes.map((roomType) => (
            <option key={roomType.id} value={roomType.id}>{roomType.name}</option>
          ))}
        </select>
      </Field>
      <Field label="ฤดูกาล">
        <select name="season_id" defaultValue={props.rule?.season_id || "base"} className={inputClass}>
          <option value="base">ราคาพื้นฐาน ไม่ผูกฤดูกาล</option>
          {props.seasons.map((season) => (
            <option key={season.id} value={season.id}>{season.name}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="ประเภทวัน">
          <select name="day_type" defaultValue={props.rule?.day_type || "weekday"} className={inputClass}>
            {dayTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="ราคา">
          <input name="price" type="number" min="1" step="1" defaultValue={props.rule ? Number(props.rule.price) : ""} required placeholder="1500" className={inputClass} />
        </Field>
      </div>
      <Toggle name="is_active" defaultChecked={props.rule?.is_active ?? true} label="เปิดใช้กฎราคานี้" />
      <FormActions isPending={props.isPending} onCancel={props.onCancel} showCancel={Boolean(props.rule)} />
    </form>
  );
}

function RuleRow({ rule, onEdit, onDelete }: { rule: PricingRuleView; onEdit: () => void; onDelete: () => void }) {
  const day = dayTypeOptions.find((option) => option.value === rule.day_type);
  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-[#1a3c2a]">{rule.room_types?.name || "ไม่พบประเภทห้อง"}</h3>
          <StatusBadge active={rule.is_active} />
        </div>
        <p className="text-sm text-[#8b7355] mt-1">{rule.seasons?.name || "ราคาพื้นฐาน"} · {day?.label || rule.day_type} · {day?.hint}</p>
      </div>
      <p className="text-xl font-serif text-[#a0842e] md:w-32 md:text-right">฿{money.format(Number(rule.price) || 0)}</p>
      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function SeasonRow({ season, onEdit, onDelete }: { season: Season; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-[#1a3c2a]">{season.name}</h3>
          <StatusBadge active={season.is_active} />
        </div>
        <p className="text-sm text-[#8b7355] mt-1">{formatDate(season.start_date)} - {formatDate(season.end_date)}</p>
      </div>
      <RowActions onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onEdit} className="h-9 w-9 rounded-lg border border-[#e8e2d6] text-[#8b7355] hover:text-[#1a3c2a] hover:border-[#c9a84c]" aria-label="แก้ไข">
        <Edit3 className="h-4 w-4 mx-auto" />
      </button>
      <button type="button" onClick={onDelete} className="h-9 w-9 rounded-lg border border-[#e8e2d6] text-[#8b7355] hover:text-red-600 hover:border-red-200" aria-label="ลบ">
        <Trash2 className="h-4 w-4 mx-auto" />
      </button>
    </div>
  );
}

function FormTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-[#f0eadf]">
      <Plus className="h-4 w-4 text-[#c9a84c]" />
      <h2 className="font-semibold text-[#1a3c2a]">{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#8b7355] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-[#e8e2d6] px-3 py-2">
      <span className="text-sm font-medium text-[#2c2c2c]">{label}</span>
      <select name={name} defaultValue={defaultChecked ? "true" : "false"} className="rounded-md border border-[#e8e2d6] bg-white px-2 py-1 text-sm text-[#1a3c2a] outline-none">
        <option value="true">เปิด</option>
        <option value="false">ปิด</option>
      </select>
    </label>
  );
}

function FormActions({ isPending, onCancel, showCancel }: { isPending: boolean; onCancel: () => void; showCancel: boolean }) {
  return (
    <div className="flex gap-2 pt-2">
      {showCancel && (
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-[#e8e2d6] px-3 py-2 text-sm font-semibold text-[#8b7355] hover:bg-[#faf7f0]">
          ยกเลิก
        </button>
      )}
      <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-[#1a3c2a] px-3 py-2 text-sm font-semibold text-white hover:bg-[#0f2418] disabled:opacity-60 flex items-center justify-center gap-2">
        <Save className="h-4 w-4" />
        {isPending ? "กำลังบันทึก" : "บันทึก"}
      </button>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (active ? "bg-emerald-50 text-emerald-700" : "bg-[#f0eadf] text-[#8b7355]")}>
      {active ? "เปิดใช้" : "ปิดอยู่"}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="p-8 text-center text-sm text-[#8b7355]">{text}</div>;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

const inputClass = "w-full rounded-lg border border-[#e8e2d6] bg-white px-3 py-2 text-sm text-[#2c2c2c] outline-none transition-colors focus:border-[#1a3c2a] focus:ring-1 focus:ring-[#1a3c2a]";
