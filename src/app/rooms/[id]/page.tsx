import { notFound } from "next/navigation";
import Link from "next/link";
import { getRoomTypeDetail } from "@/app/actions/rooms";
import RoomDetailClient from "@/components/rooms/RoomDetailClient";
import { buildHotelMetadata } from "@/lib/seo";

export const revalidate = 60;

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RoomPageProps) {
  const { id } = await params;
  const room = await getRoomTypeDetail(id);
  if (!room) return {};

  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();
  const { data: hotelData } = await supabase
    .from("hotels")
    .select("id, name, description, address, province, district, sub_district, postal_code, logo_url, cover_image_url, settings")
    .limit(1)
    .single();

  return buildHotelMetadata({
    hotel: hotelData as Parameters<typeof buildHotelMetadata>[0]["hotel"],
    rooms: [{ name: room.name, description: room.description, base_price: room.basePrice }],
    images: room.galleryUrls.slice(0, 3).map((url) => ({ image_url: url, alt_text: room.name })),
    pathname: `/rooms/${id}`,
    pageTitle: `${room.name} — ${(hotelData as { name?: string } | null)?.name ?? ""}`,
    pageDescription: room.shortDescription || room.description,
  });
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params;
  const room = await getRoomTypeDetail(id);

  if (!room) notFound();

  // fetch hotel name
  const { createServiceClient } = await import("@/lib/supabase/service");
  const supabase = await createServiceClient();
  const { data: hotelData } = await supabase
    .from("hotels")
    .select("name")
    .limit(1)
    .single();
  const hotelName = (hotelData as { name?: string } | null)?.name ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-[#fbf7ec] to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/40 bg-forest-dark/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-stone-light transition-colors hover:border-gold/60 hover:text-gold"
              aria-label="กลับหน้าแรก"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <Link
              href="/"
              className="truncate font-[family-name:var(--font-serif)] text-lg font-bold tracking-wider text-white sm:text-2xl"
            >
              {hotelName}
            </Link>
          </div>

          <Link
            href="/booking"
            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-gold text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-gold-dark transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            จองห้องพัก
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-earth" aria-label="breadcrumb">
          <Link href="/" className="hover:text-gold transition-colors">หน้าแรก</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <Link href="/#rooms" className="hover:text-gold transition-colors">ห้องพัก</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-forest-dark font-medium truncate max-w-[160px]">{room.name}</span>
        </nav>

        <RoomDetailClient room={room} hotelName={hotelName} />
      </main>
    </div>
  );
}
