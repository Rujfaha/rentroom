"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";

const ROOM_STATUS_OPTIONS = [
  { value: "available", label: "ว่าง" },
  { value: "occupied", label: "มีผู้เข้าพัก" },
  { value: "maintenance", label: "ซ่อมบำรุง" },
  { value: "out_of_order", label: "ไม่พร้อมใช้งาน" },
];

const HK_STATUS_OPTIONS = [
  { value: "clean", label: "สะอาด" },
  { value: "dirty", label: "รอทำความสะอาด" },
  { value: "in_progress", label: "กำลังทำความสะอาด" },
  { value: "inspected", label: "ตรวจสอบแล้ว" },
  { value: "out_of_service", label: "ไม่ให้บริการ" },
];

interface PhysicalRoomFormProps {
  room?: any;
  roomTypes: any[];
  defaultRoomTypeId?: string;
  onSave: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function PhysicalRoomForm({ room, roomTypes, defaultRoomTypeId, onSave, onCancel }: PhysicalRoomFormProps) {
  const isEdit = !!room && room.id !== "new";
  const [roomTypeId, setRoomTypeId] = useState(room?.room_type_id || defaultRoomTypeId || "");
  const [roomNumber, setRoomNumber] = useState(room?.room_number || "");
  const [floor, setFloor] = useState(room?.floor || "");
  const [status, setStatus] = useState(room?.status || "available");
  const [housekeeping, setHousekeeping] = useState(room?.housekeeping || "clean");
  const [notes, setNotes] = useState(room?.notes || "");
  const [isActive, setIsActive] = useState(room?.is_active !== false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!roomTypeId) newErrors.roomTypeId = "กรุณาเลือกประเภทห้อง";
    if (!roomNumber.trim()) newErrors.roomNumber = "กรุณากรอกเลขห้อง";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    formData.set("room_type_id", roomTypeId);
    formData.set("room_number", roomNumber.trim());
    formData.set("floor", floor.trim());
    formData.set("status", status);
    formData.set("housekeeping", housekeeping);
    formData.set("notes", notes.trim());
    formData.set("is_active", isActive.toString());
    if (isEdit && room?.id) {
      formData.set("id", room.id);
    }

    await onSave(formData);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-white rounded-xl border border-[#e8e2d6] h-full">
      <div>
        <label className="block text-xs font-medium text-[#8b7355] mb-1">ประเภทห้อง <span className="text-red-400">*</span></label>
        <select
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value)}
          className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
        >
          <option value="">เลือกประเภทห้อง</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>
              {rt.name}
            </option>
          ))}
        </select>
        {errors.roomTypeId && <p className="text-xs text-red-500 mt-1">{errors.roomTypeId}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">เลขห้อง <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
            placeholder="เช่น 101, A1"
          />
          {errors.roomNumber && <p className="text-xs text-red-500 mt-1">{errors.roomNumber}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">ชั้น</label>
          <input
            type="text"
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
            placeholder="เช่น 1, 2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">สถานะห้อง</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
          >
            {ROOM_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">สถานะความสะอาด</label>
          <select
            value={housekeeping}
            onChange={(e) => setHousekeeping(e.target.value)}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
          >
            {HK_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#8b7355] mb-1">หมายเหตุ</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
          placeholder="บันทึกเพิ่มเติม"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id={`rm-active-${room?.id || "new"}`}
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 text-[#1a3c2a] rounded border-[#e8e2d6] focus:ring-[#1a3c2a]"
        />
        <label htmlFor={`rm-active-${room?.id || "new"}`} className="ml-2 text-sm text-[#2c2c2c]">
          แสดงผล
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
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
