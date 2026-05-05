"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { RoomTypeDisplay, GuestInfo } from "@/types/landing.types";

interface StepPaymentProps {
  room: RoomTypeDisplay;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  childrenCount: number;
  guest: GuestInfo;
  onConfirm: (slipUrl: string) => void;
  onBack: () => void;
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

export default function StepPayment(props: StepPaymentProps) {
  const totalAmount = props.room.basePrice * props.totalNights;
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slipPreview, setSlipPreview] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(function () {
    setLoading(true);
    setError("");
    fetch("/api/promptpay-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: totalAmount }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) {
          setError(data.error);
        } else {
          setQrDataUrl(data.qrDataUrl);
          setAccountName(data.accountName);
          setAccountId(data.accountId);
        }
        setLoading(false);
      })
      .catch(function () {
        setError("Failed to generate QR code");
        setLoading(false);
      });
  }, [totalAmount]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSlipFile(file);
    const reader = new FileReader();
    reader.onload = function (ev) {
      setSlipPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleConfirm() {
    if (!slipFile) return;
    // Mock: ในอนาคตอัปโหลดไป Supabase Storage แล้วได้ URL กลับมา
    const mockSlipUrl = "/uploads/slips/" + Date.now() + "-" + slipFile.name;
    props.onConfirm(mockSlipUrl);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-semibold text-forest-dark text-lg mb-2">Payment via PromptPay</h3>
          <p className="text-sm text-earth mb-6">Scan the QR code below with your banking app to pay</p>

          <div className="flex flex-col items-center">
            {loading && (
              <div className="w-64 h-64 bg-stone-light/50 rounded-xl flex items-center justify-center animate-pulse">
                <span className="text-earth text-sm">Generating QR Code...</span>
              </div>
            )}

            {error && (
              <div className="w-64 h-64 bg-red-50 rounded-xl flex items-center justify-center">
                <span className="text-red-500 text-sm">{error}</span>
              </div>
            )}

            {!loading && !error && qrDataUrl && (
              <div className="flex flex-col items-center">
                <div className="bg-white border-2 border-gold/30 rounded-2xl p-4 shadow-lg">
                  <Image
                    src={qrDataUrl}
                    alt="PromptPay QR Code"
                    width={280}
                    height={280}
                    unoptimized
                  />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-earth uppercase tracking-wider">Account</p>
                  <p className="text-forest-dark font-semibold">{accountName}</p>
                  <p className="text-sm text-earth">{accountId}</p>
                </div>
              </div>
            )}

            <div className="mt-6 bg-gold/10 rounded-xl px-6 py-4 text-center w-full max-w-sm">
              <p className="text-xs text-earth uppercase tracking-wider">Amount to Pay</p>
              <p className="text-3xl font-bold text-gold mt-1">
                {"THB " + formatPrice(totalAmount)}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-stone-light pt-6">
            <h4 className="font-semibold text-forest-dark mb-3">Upload Payment Slip</h4>
            <p className="text-sm text-earth mb-4">After payment, upload your transfer slip for verification</p>

            {slipPreview ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-full max-w-xs h-64 rounded-xl overflow-hidden border-2 border-forest/20">
                  <Image
                    src={slipPreview}
                    alt="Payment slip preview"
                    fill
                    className="object-contain bg-white"
                    unoptimized
                  />
                </div>
                <button
                  onClick={function () {
                    setSlipPreview("");
                    setSlipFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Remove and upload another
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone rounded-xl cursor-pointer hover:border-gold hover:bg-gold/5 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-earth mb-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-earth font-medium">Click to upload slip</span>
                <span className="text-xs text-earth-light mt-1">JPG, PNG (max 5MB)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={props.onBack}
              className="px-6 py-3 border-2 border-stone text-earth rounded-lg hover:bg-stone-light/50 transition-colors font-medium cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!slipFile}
              className={"flex-1 px-6 py-3 rounded-lg font-semibold transition-all " + (slipFile ? "bg-gold text-white hover:bg-gold-dark shadow-lg shadow-gold/20 cursor-pointer" : "bg-stone-light text-earth cursor-not-allowed")}
            >
              Confirm Payment
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
              <span>Guest</span>
              <span className="font-medium text-forest-dark">{props.guest.fullName}</span>
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
              <span className="text-gold">{"THB " + formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-light">
            <div className="flex items-center gap-2">
              <div className={"w-2.5 h-2.5 rounded-full " + (slipFile ? "bg-forest" : "bg-stone")} />
              <span className="text-xs text-earth">
                {slipFile ? "Slip uploaded - ready to confirm" : "Awaiting slip upload"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
