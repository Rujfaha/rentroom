"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import type { Promotion } from "@/types/landing.types";

interface PromotionsSectionProps {
  promotions: Promotion[];
}

function CopyCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/14 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white backdrop-blur-md shadow-[0_0_18px_rgba(255,255,255,0.18)] transition-all duration-300 hover:bg-white/22 hover:shadow-[0_0_24px_rgba(255,255,255,0.24)] cursor-pointer"
      aria-label={"Copy promotion code " + code}
      title={copied ? "Copied" : "Copy code"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0"
      >
        {copied ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      <span>{copied ? "COPIED" : "CODE " + code}</span>
    </button>
  );
}

function PromotionCard({ promo }: { promo: Promotion }) {
  return (
    <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-500">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={promo.imageUrl}
          alt={promo.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent" />
        {promo.discountCode && <CopyCodeBadge code={promo.discountCode} />}
        {promo.discountText && (
          <div className="absolute top-4 left-4 bg-gold text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {promo.discountText}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-[family-name:var(--font-serif)] text-xl font-semibold text-white">
          {promo.title}
        </h3>
        <p className="mt-2 text-sm text-stone-light/70 leading-relaxed">
          {promo.description}
        </p>
        <p className="mt-4 text-xs text-gold">
          {"Valid until " + new Date(promo.validUntil).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}

export default function PromotionsSection({ promotions }: PromotionsSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const activePromos = promotions.filter(function (p) { return p.isActive; });

  useEffect(function () {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return function () {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  if (activePromos.length === 0) return null;

  const displayed = activePromos.slice(0, 3);
  const remaining = activePromos.slice(3);

  return (
    <section id="promotions" className="py-20 md:py-28 bg-forest-dark px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title="Special Offers"
          subtitle="Exclusive deals and packages for an unforgettable stay"
          light
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayed.map(function (promo) {
            return <PromotionCard key={promo.id} promo={promo} />;
          })}
        </div>

        {remaining.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={function () { setShowModal(true); }}
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white font-medium rounded-full hover:bg-white hover:text-forest-dark transition-colors duration-300 cursor-pointer"
            >
              <span>เพิ่มเติม</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="promotions-modal-title"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={function () { setShowModal(false); }}
        >
          <div
            className="relative w-full max-w-6xl mx-4 my-10"
            onClick={function (e) { e.stopPropagation(); }}
          >
            <button
              onClick={function () { setShowModal(false); }}
              className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-forest-dark hover:bg-forest-dark hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-forest-dark rounded-2xl p-6 md:p-10 shadow-2xl border border-white/10">
              <h2 id="promotions-modal-title" className="font-[family-name:var(--font-serif)] text-3xl md:text-4xl font-semibold text-white text-center mb-8">
                All Special Offers
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {remaining.map(function (promo) {
                  return <PromotionCard key={promo.id} promo={promo} />;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
