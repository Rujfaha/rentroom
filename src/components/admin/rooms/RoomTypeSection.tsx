"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Users,
  Tag,
  Image as ImageIcon,
  DoorOpen,
  BedDouble,
} from "lucide-react";
import { RoomTypeImageGallery } from "../cms/RoomTypeImageGallery";
import { createRoomType, updateRoomType, deleteRoomType } from "@/app/actions/rooms";
import type { AdminRoom, AdminRoomType, AdminRoomTypeImage } from "./types";

const PREDEFINED_AMENITIES = [
  "WiFi", "แอร์", "TV", "ตู้เย็น", "ระเบียง", "อ่างอาบน้ำ",
  "เครื่องทำน้ำอุ่น", "ไดร์เป่าผม", "ตู้นิรภัย", "โต๊ะทำงาน",
];

interface RoomTypeSectionProps {
  roomTypes: AdminRoomType[];
  rooms: AdminRoom[];
  onRoomTypesChange: (types: AdminRoomType[]) => void;
  onRoomsChange: (rooms: AdminRoom[]) => void;
}

interface RoomTypeFormData {
  name: string;
  description: string;
  base_price: string;
  max_guests: string;
  extra_bed_price: string;
  max_extra_beds: string;
  amenities: string[];
  is_active: boolean;
  id?: string;
}

function safeString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizeRoomType(roomType: Partial<AdminRoomType>): AdminRoomType {
  return {
    ...roomType,
    id: safeString(roomType?.id),
    name: safeString(roomType?.name),
    description: safeString(roomType?.description),
    base_price: roomType?.base_price ?? "",
    max_guests: roomType?.max_guests ?? 2,
    extra_bed_price: roomType?.extra_bed_price ?? "",
    max_extra_beds: roomType?.max_extra_beds ?? "",
    amenities: Array.isArray(roomType?.amenities) ? roomType.amenities : [],
    is_active: safeBoolean(roomType?.is_active, true),
    images: Array.isArray(roomType?.images) ? roomType.images : [],
  };
}

function hasImageId(image: { id?: string }): image is AdminRoomTypeImage {
  return typeof image.id === "string" && image.id.length > 0;
}

export function RoomTypeSection({ roomTypes, rooms, onRoomTypesChange, onRoomsChange }: RoomTypeSectionProps) {
  const safeRoomTypes = Array.isArray(roomTypes) ? roomTypes : [];
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<AdminRoomType | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const getRoomCount = (typeId: string) => safeRooms.filter((r) => r.room_type_id === typeId).length;

  const openCreate = () => {
    setEditingType(null);
    setModalOpen(true);
    setError("");
  };

  const openEdit = (rt: AdminRoomType) => {
    setEditingType(rt);
    setModalOpen(true);
    setError("");
  };

  const handleDelete = (id: string) => {
    const roomCount = getRoomCount(id);
    const message = roomCount > 0
      ? `แน่ใจหรือไม่ว่าต้องการลบประเภทห้องนี้?\nระบบจะลบห้องพักที่อยู่ในประเภทนี้ทั้งหมด ${roomCount} ห้องโดยอัตโนมัติ`
      : "แน่ใจหรือไม่ว่าต้องการลบประเภทห้องนี้?";
    if (!confirm(message)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteRoomType(id);
      if (result.error) {
        setError(result.error);
      } else {
        onRoomTypesChange(safeRoomTypes.filter((rt) => rt.id !== id));
        onRoomsChange(safeRooms.filter((r) => r.room_type_id !== id));
      }
    });
  };

  const handleSave = async (data: RoomTypeFormData) => {
    setError("");
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("description", data.description);
    formData.set("base_price", data.base_price);
    formData.set("max_guests", data.max_guests);
    formData.set("extra_bed_price", data.extra_bed_price);
    formData.set("max_extra_beds", data.max_extra_beds);
    formData.set("amenities", JSON.stringify(data.amenities));
    formData.set("is_active", data.is_active.toString());
    if (data.id) formData.set("id", data.id);

    startTransition(async () => {
      const result = data.id ? await updateRoomType(formData) : await createRoomType(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setModalOpen(false);
        setEditingType(null);
        if (!data.id) {
          const newRT = normalizeRoomType({ ...result.data, images: [] });
          onRoomTypesChange([newRT, ...safeRoomTypes]);
        } else {
          onRoomTypesChange(
            safeRoomTypes.map((rt) =>
              rt.id === data.id ? normalizeRoomType({ ...result.data, images: rt.images || [] }) : rt
            )
          );
        }
      }
    });
  };

  return (
    <>
      {/* Error banner */}
      {error && !modalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="cursor-pointer ml-2"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-[#8b7355]">
          กำหนดประเภทห้องพักและรายละเอียดที่แสดงในหน้าเว็บ
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors cursor-pointer text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          เพิ่มประเภทห้อง
        </button>
      </div>

      {/* Empty state */}
      {safeRoomTypes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl">
          <DoorOpen className="w-10 h-10 mx-auto mb-3 text-[#c4b9a8]" />
          <p className="text-[#8b7355] font-medium">ยังไม่มีประเภทห้อง</p>
          <p className="text-sm text-[#a89279] mt-1">เริ่มต้นสร้างประเภทห้องแรกของคุณ</p>
          <button
            onClick={openCreate}
            className="mt-4 px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg text-sm cursor-pointer hover:bg-[#0f2418] transition-colors"
          >
            สร้างประเภทห้องแรก
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {safeRoomTypes.map((rt) => {
            const coverImage = rt.images?.find((img) => img.is_cover);
            const roomCount = getRoomCount(rt.id);
            const displayAmenities = (rt.amenities || []).slice(0, 4);
            const moreCount = (rt.amenities || []).length - 4;

            return (
              <div key={rt.id} className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] overflow-hidden flex flex-col group">
                {/* Cover Image */}
                <div className="relative h-40 bg-[#f0ece4] flex items-center justify-center overflow-hidden">
                  {coverImage?.image_url ? (
                    <Image src={coverImage.image_url} alt={rt.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-[#c4b9a8]" />
                  )}
                  {!rt.is_active && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      ซ่อนอยู่
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-serif text-[#1a3c2a] text-lg font-semibold">{rt.name}</h3>
                  <p className="text-sm text-[#8b7355] line-clamp-2 mt-1">{rt.description || "ไม่มีคำอธิบาย"}</p>

                  {/* Price & Guests */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-[#1a3c2a]">
                      <Tag className="w-3.5 h-3.5 text-[#c9a84c]" />
                      <span className="font-semibold">{Number(rt.base_price).toLocaleString()}</span>
                      <span className="text-[#8b7355]">บาท/คืน</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[#2c2c2c]">
                      <Users className="w-3.5 h-3.5 text-[#8b7355]" />
                      <span>{rt.max_guests} คน</span>
                    </div>
                  </div>
                  {Number(rt.max_extra_beds) > 0 && (
                    <div className="mt-2 text-xs text-[#8b7355] flex flex-wrap gap-x-3 gap-y-1">
                      <span>เตียงเสริมสูงสุด: {rt.max_extra_beds} เตียง</span>
                      <span>({Number(rt.extra_bed_price).toLocaleString()} บาท/เตียง/คืน)</span>
                    </div>
                  )}

                  {/* Amenities */}
                  {displayAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {displayAmenities.map((a: string) => (
                        <span key={a} className="px-2 py-0.5 bg-[#f0ece4] text-[#5a4d3a] rounded text-[11px]">{a}</span>
                      ))}
                      {moreCount > 0 && (
                        <span className="px-2 py-0.5 bg-[#f0ece4] text-[#8b7355] rounded text-[11px]">+{moreCount}</span>
                      )}
                    </div>
                  )}

                  {/* Room count */}
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-[#8b7355]">
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>{roomCount} ห้องพัก</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between mt-auto pt-4 border-t border-[#f0ece4]">
                    <button
                      onClick={() => handleDelete(rt.id)}
                      disabled={isPending}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="ลบประเภทห้องและห้องพักที่เกี่ยวข้อง"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(rt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[#1a3c2a] hover:bg-[#f0ece4] border border-[#e8e2d6] rounded-lg transition-colors text-sm cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> แก้ไข
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <RoomTypeModal
          roomType={editingType}
          error={error}
          isPending={isPending}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingType(null); setError(""); }}
          onImagesChange={(rtId, newImages) => {
            setEditingType((current) =>
              current?.id === rtId ? { ...current, images: newImages } : current
            );
            onRoomTypesChange(
              safeRoomTypes.map((rt) => rt.id === rtId ? { ...rt, images: newImages } : rt)
            );
          }}
        />
      )}
    </>
  );
}

/* ─── Room Type Modal ───────────────────────────────────── */

function RoomTypeModal({
  roomType,
  error,
  isPending,
  onSave,
  onClose,
  onImagesChange,
}: {
  roomType: AdminRoomType | null;
  error: string;
  isPending: boolean;
  onSave: (data: RoomTypeFormData) => Promise<void>;
  onClose: () => void;
  onImagesChange: (rtId: string, images: AdminRoomTypeImage[]) => void;
}) {
  const isEdit = !!roomType;
  const [name, setName] = useState(safeString(roomType?.name));
  const [description, setDescription] = useState(safeString(roomType?.description));
  const [basePrice, setBasePrice] = useState(safeString(roomType?.base_price));
  const [maxGuests, setMaxGuests] = useState(safeString(roomType?.max_guests, "2"));
  const [extraBedPrice, setExtraBedPrice] = useState(safeString(roomType?.extra_bed_price));
  const [maxExtraBeds, setMaxExtraBeds] = useState(safeString(roomType?.max_extra_beds, "0"));
  const [isActive, setIsActive] = useState(safeBoolean(roomType?.is_active, true));
  const [amenities, setAmenities] = useState<string[]>(Array.isArray(roomType?.amenities) ? roomType.amenities : []);
  const [customAmenity, setCustomAmenity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleAmenity = (a: string) => {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const addCustom = () => {
    const t = customAmenity.trim();
    if (t && !amenities.includes(t)) {
      setAmenities((prev) => [...prev, t]);
      setCustomAmenity("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "กรุณากรอกชื่อประเภทห้อง";
    if (!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0) errs.basePrice = "ราคาต้องเป็นตัวเลขมากกว่า 0";
    if (!maxGuests || isNaN(parseInt(maxGuests)) || parseInt(maxGuests) <= 0) errs.maxGuests = "ต้องมากกว่า 0";
    if (extraBedPrice && (isNaN(parseFloat(extraBedPrice)) || parseFloat(extraBedPrice) < 0)) errs.extraBedPrice = "ราคาต้องไม่ติดลบ";
    if (maxExtraBeds && (isNaN(parseInt(maxExtraBeds)) || parseInt(maxExtraBeds) < 0)) errs.maxExtraBeds = "จำนวนต้องไม่ติดลบ";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSave({
      name: name.trim(),
      description: description.trim(),
      base_price: basePrice,
      max_guests: maxGuests,
      extra_bed_price: extraBedPrice,
      max_extra_beds: maxExtraBeds,
      amenities,
      is_active: isActive,
      id: roomType?.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e8e2d6] px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-lg font-serif font-semibold text-[#1a3c2a]">
            {isEdit ? "แก้ไขประเภทห้อง" : "เพิ่มประเภทห้อง"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f0ece4] rounded-lg cursor-pointer transition-colors">
            <X className="w-5 h-5 text-[#8b7355]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#8b7355] mb-1.5">ชื่อประเภทห้อง <span className="text-red-400">*</span></label>
            <input
              type="text" value={name ?? ""} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm transition-colors"
              placeholder="เช่น Standard, Deluxe, Villa"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#8b7355] mb-1.5">คำอธิบาย</label>
            <textarea
              value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm transition-colors"
              placeholder="รายละเอียดประเภทห้อง"
            />
          </div>

          {/* Price & Guests */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">ราคาต่อคืน (บาท) <span className="text-red-400">*</span></label>
              <input
                type="number" step="0.01" value={basePrice ?? ""} onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm transition-colors"
                placeholder="0.00"
              />
              {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">ผู้เข้าพักสูงสุด <span className="text-red-400">*</span></label>
              <input
                type="number" value={maxGuests ?? ""} onChange={(e) => setMaxGuests(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm transition-colors"
                placeholder="2"
              />
              {errors.maxGuests && <p className="text-xs text-red-500 mt-1">{errors.maxGuests}</p>}
            </div>
          </div>

          {/* Extra Bed Settings */}
          <div className="grid grid-cols-2 gap-3 border-t border-[#e8e2d6] pt-4">
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">ราคาเตียงเสริม/คืน (บาท)</label>
              <input
                type="number" step="0.01" value={extraBedPrice ?? ""} onChange={(e) => setExtraBedPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm transition-colors"
                placeholder="0.00"
              />
              {errors.extraBedPrice && <p className="text-xs text-red-500 mt-1">{errors.extraBedPrice}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">จำนวนเตียงเสริมสูงสุด</label>
              <input
                type="number" value={maxExtraBeds ?? ""} onChange={(e) => setMaxExtraBeds(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm transition-colors"
                placeholder="0"
              />
              {errors.maxExtraBeds && <p className="text-xs text-red-500 mt-1">{errors.maxExtraBeds}</p>}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-xs font-medium text-[#8b7355] mb-2">สิ่งอำนวยความสะดวก</label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_AMENITIES.map((a) => (
                <button
                  key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    amenities.includes(a) ? "bg-[#1a3c2a] text-[#faf7f0]" : "bg-[#f0ece4] text-[#8b7355] hover:bg-[#e8e2d6]"
                  }`}
                >{a}</button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="text" value={customAmenity ?? ""} onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
                className="flex-1 px-3 py-1.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 outline-none text-sm"
                placeholder="เพิ่มสิ่งอำนวยความสะดวกอื่น"
              />
              <button type="button" onClick={addCustom}
                className="px-3 py-1.5 bg-[#1a3c2a] text-[#faf7f0] rounded-lg text-xs font-medium hover:bg-[#0f2418] cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่ม
              </button>
            </div>
            {amenities.filter((a) => !PREDEFINED_AMENITIES.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {amenities.filter((a) => !PREDEFINED_AMENITIES.includes(a)).map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#c9a84c]/10 text-[#1a3c2a] rounded-full text-xs">
                    {a}
                    <button type="button" onClick={() => toggleAmenity(a)} className="hover:text-red-500 cursor-pointer"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Active toggle */}
          <div className="flex items-center">
            <input
              type="checkbox" id="rt-active-modal" checked={Boolean(isActive)} onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#1a3c2a] rounded border-[#e8e2d6] focus:ring-[#1a3c2a]"
            />
            <label htmlFor="rt-active-modal" className="ml-2 text-sm text-[#2c2c2c]">แสดงผล</label>
          </div>

          {/* Image Gallery (edit mode only) */}
          {isEdit && roomType && (
            <div className="border-t border-[#e8e2d6] pt-4">
              <label className="block text-xs font-medium text-[#8b7355] mb-2">รูปภาพประเภทห้อง</label>
              <RoomTypeImageGallery
                roomTypeId={roomType.id}
                images={roomType.images || []}
                onImagesChange={(imgs) => onImagesChange(roomType.id, imgs.filter(hasImageId))}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm border border-[#e8e2d6] text-[#8b7355] rounded-lg hover:bg-[#faf7f0] cursor-pointer transition-colors"
            >ยกเลิก</button>
            <button type="submit" disabled={isPending}
              className="px-5 py-2.5 text-sm bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              {isPending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
