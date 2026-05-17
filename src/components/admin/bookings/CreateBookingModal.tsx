"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CalendarDays,
  CreditCard,
  MapPin,
  NotebookPen,
  UserRound,
  X,
} from "lucide-react";
import { createAdminBooking } from "@/app/actions/booking";
import type {
  AdminBookingRoomTypeOption,
} from "@/app/actions/booking";

const SOURCE_OPTIONS: Array<{ value: "walk_in" | "phone" | "ota" | "other"; label: string }> = [
  { value: "walk_in", label: "Walk-in" },
  { value: "phone", label: "โทรศัพท์" },
  { value: "ota", label: "OTA" },
  { value: "other", label: "อื่น ๆ" },
];

const PAYMENT_METHOD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "cash", label: "เงินสด" },
  { value: "bank_transfer", label: "โอนธนาคาร" },
  { value: "credit_card", label: "บัตรเครดิต" },
  { value: "promptpay", label: "พร้อมเพย์" },
  { value: "other", label: "อื่น ๆ" },
];

function todayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return formatIso(d);
}

function tomorrowIsoFrom(value: string): string {
  const start = new Date(`${value}T00:00:00`);
  if (Number.isNaN(start.getTime())) return value;
  start.setDate(start.getDate() + 1);
  return formatIso(start);
}

function formatIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T00:00:00`).getTime();
  const end = new Date(`${checkOut}T00:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

export interface CreateBookingPrefill {
  roomId?: string;
  roomTypeId?: string;
  checkIn?: string;
  checkOut?: string;
}

interface CreateBookingModalProps {
  options: AdminBookingRoomTypeOption[];
  prefill?: CreateBookingPrefill;
  onClose: () => void;
  onSuccess: (result: { bookingNumber: string }) => void;
}

export function CreateBookingModal({ options, prefill, onClose, onSuccess }: CreateBookingModalProps) {
  const safeOptions = options.filter((option) => option.rooms.length > 0);

  const resolveInitialRoomTypeId = (): string => {
    if (prefill?.roomTypeId && safeOptions.some((option) => option.id === prefill.roomTypeId)) {
      return prefill.roomTypeId;
    }
    if (prefill?.roomId) {
      const match = safeOptions.find((option) => option.rooms.some((room) => room.id === prefill.roomId));
      if (match) return match.id;
    }
    return safeOptions[0]?.id || "";
  };

  const initialRoomTypeId = resolveInitialRoomTypeId();

  const resolveInitialRoomId = (): string => {
    if (!initialRoomTypeId) return "";
    const roomType = safeOptions.find((option) => option.id === initialRoomTypeId);
    if (!roomType) return "";
    if (prefill?.roomId && roomType.rooms.some((room) => room.id === prefill.roomId)) {
      return prefill.roomId;
    }
    return "";
  };

  const initialRoomId = resolveInitialRoomId();

  const initialCheckIn = prefill?.checkIn || todayIso();
  const initialCheckOut = prefill?.checkOut || tomorrowIsoFrom(initialCheckIn);

  const [roomTypeId, setRoomTypeId] = useState(initialRoomTypeId);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [source, setSource] = useState<"walk_in" | "phone" | "ota" | "other">("walk_in");
  const [numGuests, setNumGuests] = useState("2");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [overrideTotal, setOverrideTotal] = useState("");
  const [collectPayment, setCollectPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "verified">("verified");
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, isPending]);

  const selectedRoomType = safeOptions.find((option) => option.id === roomTypeId) || null;
  const availableRooms = selectedRoomType?.rooms ?? [];
  const nights = calculateNights(checkIn, checkOut);
  const calculatedTotal = nights > 0 && selectedRoomType ? nights * selectedRoomType.basePrice : 0;
  const overrideTotalValue = Number(overrideTotal) || 0;
  const effectiveTotal = overrideTotalValue > 0 ? overrideTotalValue : calculatedTotal;
  const checkOutMin = checkIn ? tomorrowIsoFrom(checkIn) : "";

  const handleRoomTypeChange = (value: string) => {
    setRoomTypeId(value);
    setRoomId("");
  };

  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    if (value && (!checkOut || checkOut <= value)) {
      setCheckOut(tomorrowIsoFrom(value));
    }
  };

  const noOptions = safeOptions.length === 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await createAdminBooking({ success: false }, formData);
        if (result.success && result.bookingNumber) {
          onSuccess({ bookingNumber: result.bookingNumber });
        } else {
          setErrorMessage(result.error || "ไม่สามารถสร้างการจองได้");
        }
      } catch (err) {
        console.error("createAdminBooking error:", err);
        setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองอีกครั้ง");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 cursor-pointer"
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        className="bg-[#faf7f0] w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col cursor-default"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#e8e2d6] bg-white">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8b7355]">สร้างการจอง</p>
            <h2 className="text-lg sm:text-xl font-serif text-[#1a3c2a] truncate">
              สร้างการจอง Walk-in / โทรศัพท์
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 -mr-1 text-[#8b7355] hover:bg-[#faf7f0] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {noOptions ? (
          <div className="px-5 py-10 text-center text-sm text-[#8b7355]">
            ยังไม่มีประเภทห้องหรือห้องที่ใช้งานในระบบ ให้ไปเพิ่มในเมนูห้องพักก่อนสร้างการจอง
            <div className="mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#e8e2d6] text-[#1a3c2a] rounded-lg hover:bg-white transition-colors text-sm font-medium cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto px-5 py-5 space-y-5 flex-1"
          >
            {errorMessage && (
              <div className="rounded-lg px-3 py-2 text-sm border bg-red-50 border-red-200 text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Stay */}
            <Section title="ห้องพักและช่วงเวลา" icon={MapPin}>
              <Field label="ประเภทห้อง" required className="sm:col-span-2">
                <select
                  name="room_type_id"
                  value={roomTypeId}
                  onChange={(event) => handleRoomTypeChange(event.currentTarget.value)}
                  required
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    เลือกประเภทห้อง
                  </option>
                  {safeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name} (สูงสุด {option.maxGuests} คน · ราคา {option.basePrice.toLocaleString("th-TH")}/คืน)
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="หมายเลขห้อง (ถ้าระบุ)">
                <select
                  name="room_id"
                  value={roomId}
                  onChange={(event) => setRoomId(event.currentTarget.value)}
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer"
                >
                  <option value="">ให้ระบบเลือกห้องว่างให้</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      ห้อง {room.roomNumber}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="จำนวนผู้เข้าพัก" required>
                <input
                  name="num_guests"
                  type="number"
                  min={1}
                  max={20}
                  value={numGuests}
                  onChange={(event) => setNumGuests(event.currentTarget.value)}
                  required
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
              <Field label="เช็คอิน" required>
                <input
                  name="check_in"
                  type="date"
                  value={checkIn}
                  onChange={(event) => handleCheckInChange(event.currentTarget.value)}
                  required
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
              <Field label="เช็คเอาท์" required>
                <input
                  name="check_out"
                  type="date"
                  value={checkOut}
                  min={checkOutMin}
                  onChange={(event) => setCheckOut(event.currentTarget.value)}
                  required
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
              <Field label="ช่องทาง" required>
                <select
                  name="source"
                  value={source}
                  onChange={(event) => setSource(event.currentTarget.value as typeof source)}
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer"
                >
                  {SOURCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="จำนวนคืน">
                <div className="px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm text-[#8b7355]">
                  {nights > 0 ? `${nights} คืน` : "เลือกวันที่"}
                </div>
              </Field>
            </Section>

            {/* Customer */}
            <Section title="ข้อมูลลูกค้า" icon={UserRound}>
              <Field label="ชื่อลูกค้า" required className="sm:col-span-2">
                <input
                  name="full_name"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.currentTarget.value)}
                  required
                  maxLength={100}
                  placeholder="ชื่อ-นามสกุล"
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
              <Field label="เบอร์โทร">
                <input
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.currentTarget.value)}
                  inputMode="tel"
                  placeholder="0812345678"
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
              <Field label="อีเมล">
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  placeholder="guest@example.com"
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
              <Field label="คำขอพิเศษ (เห็นในใบจอง)" className="sm:col-span-2">
                <textarea
                  name="special_requests"
                  rows={2}
                  maxLength={500}
                  value={specialRequests}
                  onChange={(event) => setSpecialRequests(event.currentTarget.value)}
                  placeholder="เช่น ขอเตียงเสริม / ขอชั้นล่าง"
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
              <p className="sm:col-span-2 text-[11px] text-[#8b7355]">
                ต้องระบุเบอร์โทรหรืออีเมลอย่างน้อยหนึ่งอย่าง
              </p>
            </Section>

            {/* Pricing */}
            <Section title="ราคา" icon={CalendarDays}>
              <Field label="ยอดที่ระบบคำนวณ">
                <div className="px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm text-[#1a3c2a] font-semibold">
                  THB {calculatedTotal.toLocaleString("th-TH")}
                </div>
              </Field>
              <Field label="แทนที่ยอดรวม (ถ้าจำเป็น)">
                <input
                  name="total_amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={overrideTotal}
                  onChange={(event) => setOverrideTotal(event.currentTarget.value)}
                  placeholder="ปล่อยว่างเพื่อใช้ยอดที่คำนวณ"
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
              <Field label="ยอดสุทธิที่จะบันทึก" className="sm:col-span-2">
                <div className="px-3 py-2 bg-white border border-[#e8e2d6] rounded-lg text-sm">
                  <span className="text-[#1a3c2a] font-bold">THB {effectiveTotal.toLocaleString("th-TH")}</span>
                  {overrideTotalValue > 0 && (
                    <span className="ml-2 text-[11px] text-[#c9a84c]">(แทนที่ยอดที่คำนวณ)</span>
                  )}
                </div>
              </Field>
            </Section>

            {/* Payment (optional) */}
            <Section title="การชำระเงิน (เลือกได้)" icon={CreditCard}>
              <label className="sm:col-span-2 flex items-start gap-2 text-sm text-[#2c2c2c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectPayment}
                  onChange={(event) => setCollectPayment(event.currentTarget.checked)}
                  className="mt-1 accent-[#1a3c2a]"
                />
                <span>
                  <span className="font-medium">บันทึกการชำระเงินตอนนี้</span>
                  <span className="block text-[11px] text-[#8b7355]">
                    หากไม่บันทึก booking จะอยู่สถานะ pending เพื่อให้ตรวจสลิปทีหลังได้
                  </span>
                </span>
              </label>

              {collectPayment && (
                <>
                  <Field label="ยอดที่ชำระ" required>
                    <input
                      name="payment_amount"
                      type="number"
                      min={0}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.currentTarget.value)}
                      required
                      className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                    />
                  </Field>
                  <Field label="ช่องทาง">
                    <select
                      name="payment_method"
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.currentTarget.value)}
                      className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer"
                    >
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="สถานะ">
                    <select
                      name="payment_status"
                      value={paymentStatus}
                      onChange={(event) => setPaymentStatus(event.currentTarget.value as "pending" | "verified")}
                      className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer"
                    >
                      <option value="verified">ยืนยันแล้ว</option>
                      <option value="pending">รอตรวจ</option>
                    </select>
                  </Field>
                  <Field label="เลขอ้างอิง (ถ้ามี)">
                    <input
                      name="transaction_ref"
                      type="text"
                      maxLength={100}
                      value={transactionRef}
                      onChange={(event) => setTransactionRef(event.currentTarget.value)}
                      placeholder="REF-12345"
                      className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                    />
                  </Field>
                  <Field label="หมายเหตุการชำระ" className="sm:col-span-2">
                    <textarea
                      name="payment_notes"
                      rows={2}
                      maxLength={500}
                      value={paymentNotes}
                      onChange={(event) => setPaymentNotes(event.currentTarget.value)}
                      className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                    />
                  </Field>
                </>
              )}
            </Section>

            {/* Internal Note */}
            <Section title="บันทึกภายใน" icon={NotebookPen}>
              <Field label="บันทึก (เห็นเฉพาะแอดมิน)" className="sm:col-span-2">
                <textarea
                  name="booking_notes"
                  rows={2}
                  maxLength={1000}
                  value={bookingNotes}
                  onChange={(event) => setBookingNotes(event.currentTarget.value)}
                  placeholder="เช่น ลูกค้า VIP / ขอ early check-in"
                  className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
                />
              </Field>
            </Section>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#e8e2d6]">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="px-4 py-2.5 border border-[#e8e2d6] text-[#8b7355] rounded-lg hover:bg-white transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "กำลังสร้าง..." : "สร้างการจอง"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function Section({ title, icon: Icon, children }: SectionProps) {
  return (
    <section className="rounded-xl border border-[#e8e2d6] bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1a3c2a]">
        <Icon className="w-4 h-4 text-[#c9a84c]" />
        {title}
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-[#8b7355] mb-1">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
