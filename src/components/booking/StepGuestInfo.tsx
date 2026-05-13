"use client";

import { useState } from "react";
import Image from "next/image";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";
import type { BookingLabels } from "./booking-i18n";

interface StepGuestInfoProps {
  room: RoomTypeDisplay;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  childrenCount: number;
  onSubmit: (info: GuestInfo) => void;
  onBack: () => void;
  labels: BookingLabels;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

export default function StepGuestInfo(props: StepGuestInfoProps) {
  const labels = props.labels.guestInfo;
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmount = props.room.stayTotal ?? props.room.basePrice * props.totalNights;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors["fullName"] = labels.errors.fullName;
    if (!phone.trim()) newErrors["phone"] = labels.errors.phone;
    if (!email.trim()) newErrors["email"] = labels.errors.email;
    else if (email.indexOf("@") === -1) newErrors["email"] = labels.errors.invalidEmail;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    window.setTimeout(function () {
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
                onChange={function (e) { setFullName(e.target.value); }}
                placeholder={labels.fullNamePlaceholder}
                className={inputClass}
              />
              {errors["fullName"] && <p className="text-red-500 text-xs mt-1">{errors["fullName"]}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{labels.phone}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={function (e) { setPhone(e.target.value); }}
                  placeholder={labels.phonePlaceholder}
                  className={inputClass}
                />
                {errors["phone"] && <p className="text-red-500 text-xs mt-1">{errors["phone"]}</p>}
              </div>
              <div>
                <label className={labelClass}>{labels.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={function (e) { setEmail(e.target.value); }}
                  placeholder={labels.emailPlaceholder}
                  className={inputClass}
                />
                {errors["email"] && <p className="text-red-500 text-xs mt-1">{errors["email"]}</p>}
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
