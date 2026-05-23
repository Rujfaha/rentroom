import { notFound } from "next/navigation";
import Link from "next/link";
import { getRoomTypeDetail } from "@/app/actions/rooms";
import RoomDetailClient from "@/components/rooms/RoomDetailClient";
import RoomBackButton from "@/components/rooms/RoomBackButton";
import RoomTopBookCta from "@/components/rooms/RoomTopBookCta";
import { buildHotelMetadata } from "@/lib/seo";

export const revalidate = 60;

interface RoomPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const room = await getRoomTypeDetail(id);

  if (!room) notFound();

  // ตรวจว่า user มาจากไหน — ใช้ ?from=booking หรือ ?from=app
  // วัน/จำนวนคนเก็บใน sessionStorage ฝั่ง client (ไม่ส่งผ่าน URL)
  const from = typeof sp.from === "string" ? sp.from : undefined;

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
            <RoomBackButton
              from={from}
              label={from === "booking" ? "กลับหน้าจอง" : "กลับหน้าแรก"}
            />
            <Link
              href="/"
              className="truncate font-[family-name:var(--font-serif)] text-lg font-bold tracking-wider text-white sm:text-2xl"
            >
              {hotelName}
            </Link>
          </div>

          <RoomTopBookCta
            roomId={id}
            disabled={room.availableRoomsCount <= 0}
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-earth" aria-label="breadcrumb">
          <Link href="/" className="hover:text-gold transition-colors">หน้าแรก</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
          {from === "booking" ? (
            <Link
              href="/booking"
              className="hover:text-gold transition-colors"
            >
              จองห้องพัก
            </Link>
          ) : (
            <Link href="/#rooms" className="hover:text-gold transition-colors">ห้องพัก</Link>
          )}
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
