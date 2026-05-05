import Image from "next/image";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";
import type { RoomTypeDisplay } from "@/types/landing.types";

interface RoomTypesSectionProps {
  roomTypes: RoomTypeDisplay[];
}

function formatPrice(price: number): string {
  return price.toLocaleString("th-TH");
}

function AmenityIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, string> = {
    wifi: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
    tv: "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM17 21H7",
    bath: "M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 2-2h3",
    coffee: "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 2v2M10 2v2M14 2v2",
    ac: "M12 3v18M3 12h18",
    balcony: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    jacuzzi: "M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z",
    minibar: "M4 4h16v16H4z",
    robe: "M12 2L6 7v15h12V7z",
    kitchen: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    garden: "M12 22V8M5 12H2a10 10 0 0 0 20 0h-3",
    crib: "M2 8h20v10H2zM6 8V6M18 8V6",
    parking: "M6 20V4h6a4 4 0 0 1 0 8H6",
  };
  const d = iconMap[icon] || "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z";
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
      <path d={d} />
    </svg>
  );
}

export default function RoomTypesSection({ roomTypes }: RoomTypesSectionProps) {
  return (
    <section id="rooms" className="py-20 md:py-28 bg-cream px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title="Room Types"
          subtitle="Each room is designed to provide the ultimate comfort with stunning mountain views"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {roomTypes.map(function (room) {
            return (
              <div
                key={room.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg shadow-forest-dark/5 hover:shadow-2xl hover:shadow-forest-dark/10 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={room.coverImageUrl}
                    alt={room.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <span className="text-forest-dark font-semibold text-sm">
                      {"THB " + formatPrice(room.basePrice) + "/night"}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="font-[family-name:var(--font-serif)] text-2xl font-semibold text-forest-dark">
                    {room.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-4 text-sm text-earth">
                    <span>{String(room.roomSize) + " sqm"}</span>
                    <span className="w-1 h-1 bg-stone rounded-full" />
                    <span>{room.bedType}</span>
                    <span className="w-1 h-1 bg-stone rounded-full" />
                    <span>{"Max " + String(room.maxGuests) + " guests"}</span>
                  </div>

                  <p className="mt-3 text-sm text-earth-light leading-relaxed line-clamp-2">
                    {room.shortDescription}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {room.amenities.slice(0, 4).map(function (amenity) {
                      return (
                        <div
                          key={amenity.label}
                          className="flex items-center gap-1.5 text-xs text-earth bg-cream px-2.5 py-1 rounded-full"
                        >
                          <AmenityIcon icon={amenity.icon} />
                          <span>{amenity.label}</span>
                        </div>
                      );
                    })}
                    {room.amenities.length > 4 && (
                      <span className="text-xs text-earth-light px-2.5 py-1">
                        {"+" + String(room.amenities.length - 4) + " more"}
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <Button
                      href={"/booking?room=" + room.id}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Book This Room
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
