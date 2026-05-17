"use client";

import { useState } from "react";
import Image from "next/image";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import type { BookingLabels } from "./booking-i18n";
import { useGuestInfoDraft } from "./useGuestInfoDraft";

interface StepGuestInfoProps {
  room: RoomTypeDisplay;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  childrenCount: number;
  /** ข้อมูลที่กรอกไว้ก่อนหน้า (กรณีกลับมาจาก step ถัดไป) */
  initialInfo?: GuestInfo | null;
  onSubmit: (info: GuestInfo) => void;
  onBack: () => void;
  labels: BookingLabels;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

export default function StepGuestInfo(props: StepGuestInfoProps) {
  const labels = props.labels.guestInfo;
  const {
    fullName, setFullName,
    phone, setPhone,
    email, setEmail,
    specialRequests, setSpecialRequests,
    clearDraft,
    hasDraft,
  } = useGuestInfoDraft(props.initialInfo);
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = props.room.stayTotal ?? props.room.basePrice * props.totalNights;

  function getPhoneError(value: string): string {
    if (!value.trim()) return labels.errors.phone;
    if (!/^\d{8,20}$/.test(value)) return labels.errors.invalidPhone;
    return "";
  }

  function getEmailError(value: string): string {
    const trimmedEmail = value.trim();
    if (!trimmedEmail) return labels.errors.email;
    if (trimmedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return labels.errors.invalidEmail;
    }
    return "";
  }

  function setFieldError(field: string, message: string) {
    setErrors(function (current) {
      const next = { ...current };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors["fullName"] = labels.errors.fullName;
    const phoneError = getPhoneError(phone);
    if (phoneError) newErrors["phone"] = phoneError;
    const emailError = getEmailError(email);
    if (emailError) newErrors["email"] = emailError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handlePhoneChange(value: string) {
    const numbersOnly = value.replace(/\D/g, "");
    setPhone(numbersOnly);
    setFieldError("phone", value !== numbersOnly ? labels.errors.invalidPhone : getPhoneError(numbersOnly));
  }

  function handleEmailChange(value: string) {
    const nextEmail = value.trim();
    setEmail(nextEmail);
    setFieldError("email", getEmailError(nextEmail));
  }

  function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    window.setTimeout(function () {
      // ล้าง draft หลัง submit สำเร็จ — ข้อมูลถูกส่งต่อไปแล้ว
      clearDraft();
      props.onSubmit({
        fullName: fullName,
        phone: phone,
        email: email,
        specialRequests: specialRequests,
        companyName: companyName,
      });
    }, 150);
  }

  const inputClass = "w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors";
  const labelClass = "text-xs text-earth uppercase tracking-wider font-medium block mb-1.5";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-semibold text-forest-dark text-lg mb-6">{labels.title}</h3>
          {hasDraft && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-xs text-earth">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gold shrink-0" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              <span>กรอกข้อมูลไว้แล้ว — ตรวจสอบและแก้ไขได้เลย</span>
            </div>
          )}
          <div className="space-y-4">
            <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="booking-company-name">Company</label>
              <input
                id="booking-company-name"
                type="text"
                value={companyName}
                onChange={function (e) { setCompanyName(e.target.value); }}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div>
              <label className={labelClass}>{labels.fullName}</label>
              <input
                type="text"
                value={fullName}
                onChange={function (e) {
                  setFullName(e.target.value);
                  setFieldError("fullName", e.target.value.trim() ? "" : labels.errors.fullName);
                }}
                onBlur={function () { setFieldError("fullName", fullName.trim() ? "" : labels.errors.fullName); }}
                placeholder={labels.fullNamePlaceholder}
                className={inputClass + (errors["fullName"] ? " border-red-400 focus:border-red-400 focus:ring-red-200" : "")}
                aria-invalid={Boolean(errors["fullName"])}
                aria-describedby={errors["fullName"] ? "booking-full-name-error" : undefined}
              />
              {errors["fullName"] && <p id="booking-full-name-error" className="text-red-500 text-xs mt-1">{errors["fullName"]}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{labels.phone}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={function (e) { handlePhoneChange(e.target.value); }}
                  onBlur={function () { setFieldError("phone", getPhoneError(phone)); }}
                  placeholder={labels.phonePlaceholder}
                  className={inputClass + (errors["phone"] ? " border-red-400 focus:border-red-400 focus:ring-red-200" : "")}
                  aria-invalid={Boolean(errors["phone"])}
                  aria-describedby={errors["phone"] ? "booking-phone-error" : undefined}
                />
                {errors["phone"] && <p id="booking-phone-error" className="text-red-500 text-xs mt-1">{errors["phone"]}</p>}
              </div>
              <div>
                <label className={labelClass}>{labels.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={function (e) { handleEmailChange(e.target.value); }}
                  onBlur={function () { setFieldError("email", getEmailError(email)); }}
                  placeholder={labels.emailPlaceholder}
                  className={inputClass + (errors["email"] ? " border-red-400 focus:border-red-400 focus:ring-red-200" : "")}
                  aria-invalid={Boolean(errors["email"])}
                  aria-describedby={errors["email"] ? "booking-email-error" : undefined}
                />
                {errors["email"] && <p id="booking-email-error" className="text-red-500 text-xs mt-1">{errors["email"]}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}>{labels.specialRequests}</label>
              <textarea
                value={specialRequests}
                onChange={function (e) { setSpecialRequests(e.target.value); }}
                placeholder={labels.specialRequestsPlaceholder}
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={props.onBack} disabled={isSubmitting} className="px-6 py-3 border-2 border-stone text-earth rounded-lg hover:bg-stone-light/50 transition-colors font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              {labels.back}
            </button>
            <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors font-semibold shadow-lg shadow-gold/20 cursor-pointer disabled:opacity-70 disabled:cursor-wait">
              {isSubmitting && (
                <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
              )}
              <span>{isSubmitting ? "กำลังโหลด..." : labels.continue}</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl p-5 shadow-md sticky top-24">
          <h4 className="font-semibold text-forest-dark mb-3">{labels.summary}</h4>
          <div className="relative h-32 rounded-lg overflow-hidden mb-3">
            <Image src={props.room.coverImageUrl} alt={props.room.name} fill className="object-cover" sizes="300px" />
          </div>
          <p className="font-[family-name:var(--font-serif)] text-lg font-semibold text-forest-dark">{props.room.name}</p>
          <div className="mt-3 space-y-2 text-sm text-earth">
            <div className="flex justify-between">
              <span>{props.labels.shared.checkIn}</span>
              <span className="font-medium text-forest-dark">{props.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span>{props.labels.shared.checkOut}</span>
              <span className="font-medium text-forest-dark">{props.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span>{labels.guests}</span>
              <span className="font-medium text-forest-dark">{labels.guestCount(props.adults, props.childrenCount)}</span>
            </div>
            <div className="flex justify-between">
              <span>{labels.duration}</span>
              <span className="font-medium text-forest-dark">{labels.nights(props.totalNights)}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-light">
            <div className="flex justify-between text-sm text-earth">
              <span>{props.labels.shared.thb + formatPrice(props.room.basePrice) + " x " + labels.nights(props.totalNights)}</span>
            </div>
            <div className="flex justify-between mt-2 text-lg font-bold text-forest-dark">
              <span>{labels.total}</span>
              <span>{props.labels.shared.thb + formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
