"use client";

import { Edit2, Trash2, Image as ImageIcon, Users, Tag } from "lucide-react";

interface RoomTypeCardProps {
  roomType: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoomTypeCard({ roomType, onEdit, onDelete }: RoomTypeCardProps) {
  const coverImage = roomType.images?.find((img: any) => img.is_cover);
  const amenityIcons: Record<string, string> = {
    "WiFi": "wifi",
    "แอร์": "wind",
    "TV": "tv",
    "ตู้เย็น": "refrigerator",
    "ระเบียง": "sun",
    "อ่างอาบน้ำ": "droplets",
    "เครื่องทำน้ำอุ่น": "flame",
    "ไดร์เป่าผม": "wind",
    "ตู้นิรภัย": "lock",
    "โต๊ะทำงาน": "monitor",
  };

  const displayAmenities = (roomType.amenities || []).slice(0, 5);
  const moreAmenitiesCount = (roomType.amenities || []).length - 5;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] overflow-hidden flex flex-col h-full">
      {/* Cover Image */}
      <div className="relative h-44 bg-[#f0ece4] flex items-center justify-center overflow-hidden">
        {coverImage?.image_url ? (
          <img src={coverImage.image_url} alt={roomType.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-10 h-10 text-[#c4b9a8]" />
        )}
        {!roomType.is_active && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            ซ่อนอยู่
          </div>
        )}
        {coverImage && (
          <div className="absolute bottom-2 left-2 bg-[#c9a84c] text-[#1a3c2a] text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
            รูปหน้าปก
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif text-[#1a3c2a] text-lg truncate">{roomType.name}</h3>
            <p className="text-sm text-[#8b7355] line-clamp-2 mt-1">{roomType.description || "ไม่มีคำอธิบาย"}</p>
          </div>
        </div>

        {/* Price & Guests */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-[#1a3c2a]">
            <Tag className="w-3.5 h-3.5 text-[#c9a84c]" />
            <span className="font-semibold">{Number(roomType.base_price).toLocaleString()} บาท</span>
            <span className="text-[#8b7355]">/คืน</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#2c2c2c]">
            <Users className="w-3.5 h-3.5 text-[#8b7355]" />
            <span>{roomType.max_guests} คน</span>
          </div>
        </div>

        {/* Room Details */}
        {(roomType.bed_type || roomType.room_size) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-[#8b7355]">
            {roomType.bed_type && <span>{roomType.bed_type}</span>}
            {roomType.bed_type && roomType.room_size && <span>•</span>}
            {roomType.room_size && <span>{Number(roomType.room_size).toFixed(0)} ตร.ม.</span>}
          </div>
        )}

        {/* Amenities */}
        {displayAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {displayAmenities.map((amenity: string) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0ece4] text-[#5a4d3a] rounded text-[11px]"
              >
                {amenity}
              </span>
            ))}
            {moreAmenitiesCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#f0ece4] text-[#8b7355] rounded text-[11px]">
                +{moreAmenitiesCount} รายการ
              </span>
            )}
          </div>
        )}

        {/* Image count */}
        {(roomType.images?.length || 0) > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-[#8b7355]">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{roomType.images.length} รูปภาพ</span>
          </div>
        )}

        <div className="flex justify-between mt-auto pt-4">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            title="ลบ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-[#1a3c2a] hover:bg-[#faf7f0] border border-[#e8e2d6] rounded-md transition-colors flex items-center gap-1 text-sm cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" /> แก้ไข
          </button>
        </div>
      </div>
    </div>
  );
}
