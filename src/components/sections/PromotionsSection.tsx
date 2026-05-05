import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import type { Promotion } from "@/types/landing.types";

interface PromotionsSectionProps {
  promotions: Promotion[];
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activePromos.map(function (promo) {
            return (
              <div
                key={promo.id}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-500"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={promo.imageUrl}
                    alt={promo.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent" />
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
          })}
        </div>
      </div>
    </section>
  );
}
