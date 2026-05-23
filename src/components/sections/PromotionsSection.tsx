"use client";

import { useState } from "react";
import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import CardSlider from "@/components/ui/CardSlider";
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

function PromotionCard({ promo, isActiveCard }: { promo: Promotion; isActiveCard: boolean }) {
  return (
    <div className="group relative h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-500">
      <div className={"relative overflow-hidden " + (isActiveCard ? "h-64 sm:h-72" : "h-48")}>
        <Image
          src={promo.imageUrl}
          alt={promo.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes={isActiveCard ? "(max-width: 768px) 100vw, 52vw" : "22vw"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent" />
        {promo.discountCode && isActiveCard && <CopyCodeBadge code={promo.discountCode} />}
        {promo.discountText && (
          <div className={"absolute top-4 left-4 bg-gold text-white font-bold rounded-full " + (isActiveCard ? "text-xs px-3 py-1.5" : "text-[10px] px-2.5 py-1")}>
            {promo.discountText}
          </div>
        )}
      </div>

      <div className={isActiveCard ? "p-6 sm:p-7" : "p-4"}>
        <h3 className={"font-[family-name:var(--font-serif)] font-semibold text-white " + (isActiveCard ? "text-2xl" : "text-lg line-clamp-2")}>
          {promo.title}
        </h3>
        <p className={"mt-2 text-stone-light/70 leading-relaxed " + (isActiveCard ? "text-sm" : "text-xs line-clamp-2")}>
          {promo.description}
        </p>
        <p className={"mt-4 text-gold " + (isActiveCard ? "text-xs" : "text-[11px]")}>
          {"Valid until " + new Date(promo.validUntil).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}

export default function PromotionsSection({ promotions }: PromotionsSectionProps) {
  const activePromos = promotions.filter(function (p) { return p.isActive; });

  if (activePromos.length === 0) return null;

  return (
    <section id="promotions" className="py-20 md:py-28 bg-forest-dark px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title="Special Offers"
          subtitle="Exclusive deals and packages for an unforgettable stay"
          light
        />

        <CardSlider
          items={activePromos}
          getItemKey={function (promo) { return promo.id; }}
          getItemLabel={function (promo) { return promo.title; }}
          ariaLabel="Special offers slider"
          renderItem={function (promo, context) {
            return <PromotionCard promo={promo} isActiveCard={context.isActive} />;
          }}
        />
      </div>
    </section>
  );
}
