"use client";

import { useEffect, useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Hash,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Tag,
  UserRound,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import {
  approveBooking,
  checkInBooking,
  checkOutBooking,
  markNoShowBooking,
} from "@/app/actions/booking";
import {
  rejectBookingWithReason,
  updateBookingInternalNote,
} from "@/app/actions/booking-admin";
import type { AdminBookingRow, BookingStatus, PaymentStatus } from "./AdminBookingsClient";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  checked_in: "bg-sky-50 text-sky-700 border-sky-200",
  checked_out: "bg-slate-50 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันแล้ว",
  checked_in: "เช็คอินแล้ว",
  checked_out: "เช็คเอาท์แล้ว",
  cancelled: "ยกเลิก",
  no_show: "ไม่เข้าพัก",
};

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  pending: "รอตรวจ",
  verified: "ชำระแล้ว",
  rejected: "ถูกปฏิเสธ",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  verified: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  rejected: "bg-red-50 text-red-700 border border-red-200",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "เงินสด",
  bank_transfer: "โอนธนาคาร",
  credit_card: "บัตรเครดิต",
  promptpay: "พร้อมเพย์",
  other: "อื่น ๆ",
};

const SOURCE_LABELS: Record<string, string> = {
  website: "เว็บไซต์",
  walk_in: "Walk-in",
  phone: "โทรศัพท์",
  ota: "OTA",
  other: "อื่น ๆ",
};

function formatPrice(value: number | string | null | undefined): string {
  return Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}

function getPaymentStatus(booking: AdminBookingRow): PaymentStatus {
  return booking.payments?.[0]?.status || "pending";
}

interface BookingDetailModalProps {
  booking: AdminBookingRow;
  onClose: () => void;
}

export function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const initialNote = booking.notes ?? "";
  const [internalNote, setInternalNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, isPending]);

  const paymentStatus = getPaymentStatus(booking);
  const payment = booking.payments?.[0] ?? null;
  const promotion = booking.booking_promotions?.[0] ?? null;
  const nights = calculateNights(booking.check_in_date, booking.check_out_date);
  const customerEmail = booking.customers?.email || "";
  const customerPhone = booking.customers?.phone || "";

  const canApprove = booking.status === "pending";
  const canReject = booking.status === "pending";
  const canCheckIn = booking.status === "confirmed";
  const canCheckOut = booking.status === "checked_in";
  const canMarkNoShow = booking.status === "confirmed" || booking.status === "checked_in";
  const sourceLabel = SOURCE_LABELS[booking.source] || booking.source;
  const paymentMethodLabel = payment?.method ? PAYMENT_METHOD_LABELS[payment.method] || payment.method : "-";
  const noteChanged = (internalNote || "") !== (savedNote || "");

  const runFormAction = (action: (formData: FormData) => void | Promise<unknown>) => {
    return (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      setFeedback(null);
      startTransition(async () => {
        try {
          await action(formData);
          setFeedback({ type: "success", message: "อัปเดตข้อมูลสำเร็จ" });
        } catch (err) {
          console.error("Booking detail action error:", err);
          setFeedback({ type: "error", message: "ไม่สามารถดำเนินการได้ กรุณาลองอีกครั้ง" });
        }
      });
    };
  };

  const handleConfirmAction = (
    confirmMessage: string,
    action: (formData: FormData) => void | Promise<unknown>
  ) => runFormAction((formData) => {
    if (!window.confirm(confirmMessage)) return;
    return action(formData);
  });

  const handleRejectSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = rejectReason.trim();
    if (!reason) {
      setFeedback({ type: "error", message: "กรุณากรอกเหตุผลการปฏิเสธ" });
      return;
    }
    if (!window.confirm(`ยืนยันปฏิเสธรายการ ${booking.booking_number}?`)) return;

    const formData = new FormData();
    formData.set("booking_id", booking.id);
    formData.set("reason", reason);
    setFeedback(null);
    startTransition(async () => {
      const result = await rejectBookingWithReason(formData);
      if (result.success) {
        setFeedback({ type: "success", message: "ปฏิเสธการจองและบันทึกเหตุผลแล้ว" });
        setShowRejectForm(false);
        setRejectReason("");
      } else {
        setFeedback({ type: "error", message: result.error || "ไม่สามารถปฏิเสธการจองได้" });
      }
    });
  };

  const handleNoteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("booking_id", booking.id);
    formData.set("note", internalNote);
    setFeedback(null);
    startTransition(async () => {
      const result = await updateBookingInternalNote(formData);
      if (result.success) {
        setSavedNote(internalNote);
        setFeedback({ type: "success", message: "บันทึกบันทึกภายในแล้ว" });
      } else {
        setFeedback({ type: "error", message: result.error || "ไม่สามารถบันทึกได้" });
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
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8b7355]">รายละเอียดการจอง</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h2 className="text-lg sm:text-xl font-serif text-[#1a3c2a] truncate">{booking.booking_number}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_STYLES[booking.status]}`}>
                {STATUS_LABELS[booking.status]}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${PAYMENT_STYLES[paymentStatus]}`}>
                {PAYMENT_LABELS[paymentStatus]}
              </span>
            </div>
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

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5 space-y-5 flex-1">
          {feedback && (
            <div
              className={`rounded-lg px-3 py-2 text-sm border ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Customer */}
          <Section title="ข้อมูลลูกค้า" icon={UserRound}>
            <Field label="ชื่อ" value={booking.customers?.full_name || "-"} />
            <Field
              label="เบอร์โทร"
              value={
                customerPhone ? (
                  <a href={`tel:${customerPhone}`} className="text-[#1a3c2a] hover:underline inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {customerPhone}
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <Field
              label="อีเมล"
              value={
                customerEmail ? (
                  <a href={`mailto:${customerEmail}`} className="text-[#1a3c2a] hover:underline inline-flex items-center gap-1 break-all">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="break-all">{customerEmail}</span>
                  </a>
                ) : (
                  "-"
                )
              }
            />
            <Field label="ผู้เข้าพัก" value={`${booking.num_guests} คน`} />
          </Section>

          {/* Stay */}
          <Section title="ห้องพักและช่วงเวลา" icon={MapPin}>
            <Field label="ประเภทห้อง" value={booking.rooms?.room_types?.name || "-"} />
            <Field label="หมายเลขห้อง" value={booking.rooms?.room_number || "-"} />
            <Field label="เช็คอิน" value={formatDate(booking.check_in_date)} />
            <Field label="เช็คเอาท์" value={formatDate(booking.check_out_date)} />
            <Field label="จำนวนคืน" value={`${nights} คืน`} />
            <Field label="ช่องทาง" value={sourceLabel} />
          </Section>

          {/* Pricing */}
          <Section title="ราคาและการชำระเงิน" icon={CreditCard}>
            <Field label="ยอดรวม" value={`THB ${formatPrice(booking.total_amount)}`} />
            <Field label="ส่วนลด" value={`THB ${formatPrice(booking.discount_amount)}`} />
            <Field
              label="ยอดสุทธิ"
              value={<span className="text-[#1a3c2a] font-bold">THB {formatPrice(booking.net_amount)}</span>}
            />
            <Field label="ยอดชำระ" value={payment ? `THB ${formatPrice(payment.amount)}` : "-"} />
            <Field label="ช่องทางชำระ" value={paymentMethodLabel} />
            <Field
              label="สถานะชำระ"
              value={
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${PAYMENT_STYLES[paymentStatus]}`}>
                  {PAYMENT_LABELS[paymentStatus]}
                </span>
              }
            />
            {payment?.slip_image_url && (
              <div className="sm:col-span-2">
                <a
                  href={payment.slip_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#1a3c2a] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  ดูสลิปการชำระเงิน
                </a>
              </div>
            )}
            {payment?.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-[#8b7355]">หมายเหตุการชำระ</p>
                <p className="mt-0.5 text-sm text-[#2c2c2c] whitespace-pre-wrap">{payment.notes}</p>
              </div>
            )}
          </Section>

          {/* Promotion */}
          {promotion && (
            <Section title="โปรโมชั่น" icon={Tag}>
              <Field label="ชื่อโปรโมชั่น" value={promotion.promotion_name || "-"} />
              <Field label="โค้ดส่วนลด" value={promotion.promotion_code || "-"} />
              <Field label="ยอดส่วนลดที่ใช้" value={`THB ${formatPrice(promotion.discount_amount)}`} />
            </Section>
          )}

          {/* Timeline */}
          <Section title="เวลาทำรายการ" icon={CalendarDays}>
            <Field label="สร้างเมื่อ" value={formatDateTime(booking.created_at)} />
            <Field label="ยืนยันเมื่อ" value={formatDateTime(booking.confirmed_at)} />
            <Field label="เช็คอินเมื่อ" value={formatDateTime(booking.checked_in_at)} />
            <Field label="เช็คเอาท์เมื่อ" value={formatDateTime(booking.checked_out_at)} />
            <Field label="ยกเลิก/ไม่เข้าพัก" value={formatDateTime(booking.cancelled_at)} />
          </Section>

          {/* Special requests / cancel reason */}
          {(booking.special_requests || booking.cancel_reason) && (
            <Section title="ข้อมูลเพิ่มเติม" icon={Hash}>
              {booking.special_requests && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-[#8b7355]">คำขอพิเศษจากลูกค้า</p>
                  <p className="mt-0.5 text-sm text-[#2c2c2c] whitespace-pre-wrap">{booking.special_requests}</p>
                </div>
              )}
              {booking.cancel_reason && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-[#8b7355]">เหตุผลการยกเลิก/ปฏิเสธ</p>
                  <p className="mt-0.5 text-sm text-red-700 whitespace-pre-wrap">{booking.cancel_reason}</p>
                </div>
              )}
            </Section>
          )}

          {/* Internal Note */}
          <form onSubmit={handleNoteSubmit} className="rounded-xl border border-[#e8e2d6] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1a3c2a]">
              <NotebookPen className="w-4 h-4 text-[#c9a84c]" />
              บันทึกภายใน (เห็นเฉพาะแอดมิน)
            </div>
            <textarea
              value={internalNote}
              onChange={(event) => setInternalNote(event.currentTarget.value)}
              maxLength={1000}
              rows={3}
              placeholder="เช่น ลูกค้าต้องการเตียงเสริม หรือเงื่อนไขพิเศษอื่น ๆ"
              className="mt-2 w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#8b7355]">{internalNote.length}/1000</p>
              <button
                type="submit"
                disabled={isPending || !noteChanged}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#e8e2d6] bg-white px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {canApprove && (
              <form
                onSubmit={handleConfirmAction(`ยืนยันการจอง ${booking.booking_number}?`, approveBooking)}
                className="flex-1 sm:flex-initial"
              >
                <input type="hidden" name="booking_id" value={booking.id} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ยืนยัน
                </button>
              </form>
            )}

            {canReject && (
              <button
                type="button"
                onClick={() => {
                  setShowRejectForm((value) => !value);
                  setFeedback(null);
                }}
                disabled={isPending}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                ปฏิเสธ
              </button>
            )}

            {canCheckIn && (
              <form
                onSubmit={handleConfirmAction(
                  `ยืนยันเช็คอิน ${booking.booking_number}?`,
                  checkInBooking
                )}
                className="flex-1 sm:flex-initial"
              >
                <input type="hidden" name="booking_id" value={booking.id} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  เช็คอิน
                </button>
              </form>
            )}

            {canCheckOut && (
              <form
                onSubmit={handleConfirmAction(
                  `ยืนยันเช็คเอาท์ ${booking.booking_number}? ห้องจะถูกคืนเป็นว่าง`,
                  checkOutBooking
                )}
                className="flex-1 sm:flex-initial"
              >
                <input type="hidden" name="booking_id" value={booking.id} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  เช็คเอาท์
                </button>
              </form>
            )}

            {canMarkNoShow && (
              <form
                onSubmit={handleConfirmAction(
                  `ยืนยันว่าลูกค้าไม่เข้าพัก ${booking.booking_number}? ห้องจะถูกคืนเป็นว่าง`,
                  markNoShowBooking
                )}
                className="flex-1 sm:flex-initial"
              >
                <input type="hidden" name="booking_id" value={booking.id} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  ไม่เข้าพัก
                </button>
              </form>
            )}
          </div>

          {showRejectForm && canReject && (
            <form onSubmit={handleRejectSubmit} className="mt-3 rounded-xl border border-red-200 bg-red-50/40 p-3">
              <label htmlFor="reject-reason" className="text-xs font-semibold text-red-700">
                เหตุผลการปฏิเสธ <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.currentTarget.value)}
                rows={3}
                maxLength={500}
                placeholder="เช่น สลิปไม่ตรงยอด ห้องไม่ว่าง หรือเหตุผลอื่น ๆ"
                className="mt-1 w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-red-600/80">{rejectReason.length}/500</p>
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm border border-[#e8e2d6] text-[#8b7355] rounded-lg hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !rejectReason.trim()}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ยืนยันการปฏิเสธ
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[#8b7355]">{label}</p>
      <div className="mt-0.5 text-[#2c2c2c]">{value}</div>
    </div>
  );
}
