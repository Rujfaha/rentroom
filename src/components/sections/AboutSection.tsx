import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import type { LocalAttraction } from "@/types/landing.types";

interface AboutSectionProps {
  hotelName: string;
  description: string;
  attractions: LocalAttraction[];
}

export default function AboutSection({ hotelName, description, attractions }: AboutSectionProps) {
  return (
    <section id="about" className="py-20 md:py-28 bg-cream px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title={"About " + hotelName}
          subtitle="A sanctuary nestled in the heart of the mountains"
        />

        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-earth leading-relaxed text-base md:text-lg">
            {description}
          </p>
        </div>

        {attractions.length > 0 && (
          <div>
            <h3 className="font-[family-name:var(--font-serif)] text-2xl md:text-3xl font-semibold text-forest-dark text-center mb-10">
              Nearby Attractions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {attractions.map(function (attraction) {
                return (
                  <div
                    key={attraction.id}
                    className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={attraction.imageUrl}
                        alt={attraction.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-5">
                      <h4 className="font-semibold text-forest-dark text-lg">
                        {attraction.name}
                      </h4>
                      <p className="mt-1 text-sm text-earth leading-relaxed">
                        {attraction.description}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-gold font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{String(attraction.distanceKm) + " km from resort"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
