"use client";

import { useState } from "react";
import Image from "next/image";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";

interface StepGuestInfoProps {
  room: RoomTypeDisplay;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  childrenCount: number;
  onSubmit: (info: GuestInfo) => void;
  onBack: () => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

export default function StepGuestInfo(props: StepGuestInfoProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalAmount = props.room.basePrice * props.totalNights;

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors["fullName"] = "Please enter your full name";
    if (!phone.trim()) newErrors["phone"] = "Please enter your phone number";
    if (!email.trim()) newErrors["email"] = "Please enter your email";
    else if (email.indexOf("@") === -1) newErrors["email"] = "Please enter a valid email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    props.onSubmit({
      fullName: fullName,
      phone: phone,
      email: email,
      specialRequests: specialRequests,
    });
  }

  const inputClass = "w-full px-4 py-3 border border-stone rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors";
  const labelClass = "text-xs text-earth uppercase tracking-wider font-medium block mb-1.5";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-semibold text-forest-dark text-lg mb-6">Guest Information</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={function (e) { setFullName(e.target.value); }}
                placeholder="John Doe"
                className={inputClass}
              />
              {errors["fullName"] && <p className="text-red-500 text-xs mt-1">{errors["fullName"]}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={function (e) { setPhone(e.target.value); }}
                  placeholder="+66 81 234 5678"
                  className={inputClass}
                />
                {errors["phone"] && <p className="text-red-500 text-xs mt-1">{errors["phone"]}</p>}
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={function (e) { setEmail(e.target.value); }}
                  placeholder="you@example.com"
                  className={inputClass}
                />
                {errors["email"] && <p className="text-red-500 text-xs mt-1">{errors["email"]}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Special Requests</label>
              <textarea
                value={specialRequests}
                onChange={function (e) { setSpecialRequests(e.target.value); }}
                placeholder="Any special requests or notes..."
                rows={3}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={props.onBack} className="px-6 py-3 border-2 border-stone text-earth rounded-lg hover:bg-stone-light/50 transition-colors font-medium cursor-pointer">
              Back
            </button>
            <button onClick={handleSubmit} className="flex-1 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors font-semibold shadow-lg shadow-gold/20 cursor-pointer">
              Continue to Confirmation
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white rounded-xl p-5 shadow-md sticky top-24">
          <h4 className="font-semibold text-forest-dark mb-3">Booking Summary</h4>
          <div className="relative h-32 rounded-lg overflow-hidden mb-3">
            <Image src={props.room.coverImageUrl} alt={props.room.name} fill className="object-cover" sizes="300px" />
          </div>
          <p className="font-[family-name:var(--font-serif)] text-lg font-semibold text-forest-dark">{props.room.name}</p>
          <div className="mt-3 space-y-2 text-sm text-earth">
            <div className="flex justify-between">
              <span>Check-in</span>
              <span className="font-medium text-forest-dark">{props.checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out</span>
              <span className="font-medium text-forest-dark">{props.checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests</span>
              <span className="font-medium text-forest-dark">{String(props.adults) + " Adults, " + String(props.childrenCount) + " Children"}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration</span>
              <span className="font-medium text-forest-dark">{String(props.totalNights) + " night(s)"}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-light">
            <div className="flex justify-between text-sm text-earth">
              <span>{"THB " + formatPrice(props.room.basePrice) + " x " + String(props.totalNights) + " nights"}</span>
            </div>
            <div className="flex justify-between mt-2 text-lg font-bold text-forest-dark">
              <span>Total</span>
              <span>{"THB " + formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
