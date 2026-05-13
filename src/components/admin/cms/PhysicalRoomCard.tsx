"use client";

import { Edit2, Trash2 } from "lucide-react";
import type { CmsPhysicalRoom } from "./physical-room-types";

const STATUS_LABELS: Record<string, string> = {
  available: "ว่าง",
  occupied: "มีผู้เข้าพัก",
  maintenance: "ซ่อมบำรุง",
  out_of_order: "ไม่พร้อมใช้งาน",
};

const STATUS_COLORS: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  occupied: "bg-amber-50 text-amber-700 border-amber-200",
  maintenance: "bg-orange-50 text-orange-700 border-orange-200",
  out_of_order: "bg-red-50 text-red-700 border-red-200",
};

const HK_LABELS: Record<string, string> = {
  clean: "สะอาด",
  dirty: "รอทำความสะอาด",
  in_progress: "กำลังทำความสะอาด",
  inspected: "ตรวจสอบแล้ว",
  out_of_service: "ไม่ให้บริการ",
};

const HK_COLORS: Record<string, string> = {
  clean: "bg-emerald-50 text-emerald-700",
  dirty: "bg-rose-50 text-rose-700",
  in_progress: "bg-sky-50 text-sky-700",
  inspected: "bg-violet-50 text-violet-700",
  out_of_service: "bg-gray-100 text-gray-600",
};

interface PhysicalRoomCardProps {
  room: CmsPhysicalRoom;
  roomTypeName?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function PhysicalRoomCard({ room, roomTypeName, onEdit, onDelete }: PhysicalRoomCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e8e2d6] p-4 flex flex-col gap-3 h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-serif font-semibold text-[#1a3c2a]">
              ห้อง {room.room_number}
            </h4>
            {!room.is_active && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                ซ่อนอยู่
              </span>
            )}
          </div>
          {roomTypeName && (
            <p className="text-xs text-[#8b7355] mt-0.5">{roomTypeName}</p>
          )}
          {room.floor && (
            <p className="text-xs text-[#8b7355]">ชั้น {room.floor}</p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-[#1a3c2a] hover:bg-[#faf7f0] border border-[#e8e2d6] rounded-md transition-colors cursor-pointer"
            title="แก้ไข"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            title="ลบ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${STATUS_COLORS[room.status] || STATUS_COLORS.available}`}>
          {STATUS_LABELS[room.status] || room.status}
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${HK_COLORS[room.housekeeping] || HK_COLORS.clean}`}>
          {HK_LABELS[room.housekeeping] || room.housekeeping}
        </span>
      </div>

      {room.notes && (
        <p className="text-xs text-[#8b7355] line-clamp-2">{room.notes}</p>
      )}
    </div>
  );
}
