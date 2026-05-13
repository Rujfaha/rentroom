"use client";

import { useState } from "react";
import { Save, X, Plus } from "lucide-react";
import type { CmsRoomType } from "./room-type-types";

const PREDEFINED_AMENITIES = [
  "WiFi",
  "แอร์",
  "TV",
  "ตู้เย็น",
  "ระเบียง",
  "อ่างอาบน้ำ",
  "เครื่องทำน้ำอุ่น",
  "ไดร์เป่าผม",
  "ตู้นิรภัย",
  "โต๊ะทำงาน",
];

const BED_TYPE_OPTIONS = [
  "King Size",
  "Queen Size",
  "Twin",
  "King + Twin",
  "Double",
  "Single",
];

interface RoomTypeFormProps {
  roomType?: CmsRoomType;
  onSave: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function RoomTypeForm({ roomType, onSave, onCancel }: RoomTypeFormProps) {
  const isEdit = !!roomType && roomType.id !== "new";
  const [name, setName] = useState(roomType?.name || "");
  const [description, setDescription] = useState(roomType?.description || "");
  const [basePrice, setBasePrice] = useState(roomType?.base_price?.toString() || "");
  const [maxGuests, setMaxGuests] = useState(roomType?.max_guests?.toString() || "2");
  const [bedType, setBedType] = useState(roomType?.bed_type || "King Size");
  const [roomSize, setRoomSize] = useState(roomType?.room_size?.toString() || "");
  const [isActive, setIsActive] = useState(roomType?.is_active !== false);
  const [amenities, setAmenities] = useState<string[]>(roomType?.amenities || []);
  const [customAmenity, setCustomAmenity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities((prev) => [...prev, trimmed]);
      setCustomAmenity("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "กรุณากรอกชื่อประเภทห้อง";
    if (!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) <= 0) {
      newErrors.basePrice = "ราคาต้องเป็นตัวเลขมากกว่า 0";
    }
    if (!maxGuests || isNaN(parseInt(maxGuests)) || parseInt(maxGuests) <= 0) {
      newErrors.maxGuests = "จำนวนผู้เข้าพักต้องเป็นจำนวนเต็มมากกว่า 0";
    }
    if (roomSize && (isNaN(parseFloat(roomSize)) || parseFloat(roomSize) <= 0)) {
      newErrors.roomSize = "ขนาดห้องต้องเป็นตัวเลขมากกว่า 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.set("name", name.trim());
    formData.set("description", description.trim());
    formData.set("base_price", basePrice);
    formData.set("max_guests", maxGuests);
    formData.set("bed_type", bedType);
    formData.set("room_size", roomSize || "0");
    formData.set("is_active", isActive.toString());
    formData.set("amenities", JSON.stringify(amenities));
    if (isEdit && roomType?.id) {
      formData.set("id", roomType.id);
    }

    await onSave(formData);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1 flex flex-col">
      <div>
        <label className="block text-xs font-medium text-[#8b7355] mb-1">ชื่อประเภทห้อง <span className="text-red-400">*</span></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
          placeholder="เช่น Standard, Deluxe, Villa"
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#8b7355] mb-1">คำอธิบาย</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
          placeholder="รายละเอียดประเภทห้อง"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">ราคาต่อคืน (บาท) <span className="text-red-400">*</span></label>
          <input
            type="number"
            step="0.01"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
            placeholder="0.00"
          />
          {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">จำนวนผู้เข้าพักสูงสุด <span className="text-red-400">*</span></label>
          <input
            type="number"
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value)}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
            placeholder="2"
          />
          {errors.maxGuests && <p className="text-xs text-red-500 mt-1">{errors.maxGuests}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">ประเภทเตียง</label>
          <select
            value={bedType}
            onChange={(e) => setBedType(e.target.value)}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
          >
            {BED_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">ขนาดห้อง (ตร.ม.)</label>
          <input
            type="number"
            step="0.01"
            value={roomSize}
            onChange={(e) => setRoomSize(e.target.value)}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
            placeholder="45.00"
          />
          {errors.roomSize && <p className="text-xs text-red-500 mt-1">{errors.roomSize}</p>}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-xs font-medium text-[#8b7355] mb-2">สิ่งอำนวยความสะดวก</label>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_AMENITIES.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                amenities.includes(amenity)
                  ? "bg-[#1a3c2a] text-[#faf7f0]"
                  : "bg-[#f0ece4] text-[#8b7355] hover:bg-[#e8e2d6]"
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAmenity())}
            className="flex-1 px-3 py-1.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
            placeholder="เพิ่มสิ่งอำนวยความสะดวกอื่น"
          />
          <button
            type="button"
            onClick={addCustomAmenity}
            className="px-3 py-1.5 bg-[#1a3c2a] text-[#faf7f0] rounded-md text-xs font-medium hover:bg-[#0f2418] transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            เพิ่ม
          </button>
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {amenities.filter(a => !PREDEFINED_AMENITIES.includes(a)).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#c9a84c]/10 text-[#1a3c2a] rounded-full text-xs"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Active toggle */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`rt-active-${roomType?.id || "new"}`}
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 text-[#1a3c2a] rounded border-[#e8e2d6] focus:ring-[#1a3c2a]"
        />
        <label htmlFor={`rt-active-${roomType?.id || "new"}`} className="ml-2 text-sm text-[#2c2c2c]">
          แสดงผล
        </label>
      </div>

      <div className="flex justify-end gap-2 mt-auto pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm border border-[#e8e2d6] text-[#8b7355] rounded-md hover:bg-[#faf7f0] cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 text-sm bg-[#1a3c2a] text-[#faf7f0] rounded-md hover:bg-[#0f2418] flex items-center cursor-pointer disabled:opacity-60"
        >
          <Save className="w-4 h-4 mr-1" /> บันทึก
        </button>
      </div>
    </form>
  );
}
