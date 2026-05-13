"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  ChevronDown,
  DoorOpen,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { createRoom, updateRoom, deleteRoom, bulkCreateRooms } from "@/app/actions/rooms";
import type { RoomStatus } from "@/types/database.types";
import type { AdminRoom, AdminRoomType } from "./types";

const ROOM_STATUS_OPTIONS = [
  { value: "available", label: "ว่าง", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "occupied", label: "มีผู้เข้าพัก", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "maintenance", label: "ซ่อมบำรุง", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "out_of_order", label: "ไม่พร้อมใช้งาน", color: "bg-red-50 text-red-700 border-red-200" },
];

const HK_STATUS_OPTIONS = [
  { value: "clean", label: "สะอาด", color: "bg-emerald-50 text-emerald-700" },
  { value: "dirty", label: "รอทำความสะอาด", color: "bg-rose-50 text-rose-700" },
  { value: "in_progress", label: "กำลังทำความสะอาด", color: "bg-sky-50 text-sky-700" },
  { value: "inspected", label: "ตรวจสอบแล้ว", color: "bg-violet-50 text-violet-700" },
  { value: "out_of_service", label: "ไม่ให้บริการ", color: "bg-gray-100 text-gray-600" },
];

interface RoomSectionProps {
  rooms: AdminRoom[];
  roomTypes: AdminRoomType[];
  onRoomsChange: (rooms: AdminRoom[]) => void;
}

interface RoomFormData {
  room_type_id: string;
  room_number: string;
  floor: string;
  status: string;
  housekeeping: string;
  notes: string;
  is_active: boolean;
  id?: string;
}

interface BulkRoomFormData {
  room_type_id: string;
  prefix: string;
  start_number: string;
  count: string;
  floor: string;
  status: string;
  housekeeping: string;
}

function safeString(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function safeBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function safeRoomStatus(value: unknown): RoomStatus {
  return value === "occupied" || value === "maintenance" || value === "out_of_order"
    ? value
    : "available";
}

function normalizeRoom(room: Partial<AdminRoom>): AdminRoom {
  return {
    ...room,
    id: safeString(room?.id),
    room_type_id: safeString(room?.room_type_id),
    room_number: safeString(room?.room_number),
    floor: safeString(room?.floor),
    status: safeRoomStatus(room?.status),
    housekeeping: safeString(room?.housekeeping, "clean"),
    notes: safeString(room?.notes),
    is_active: safeBoolean(room?.is_active, true),
    bookings: Array.isArray(room?.bookings) ? room.bookings : [],
    currentBooking: room?.currentBooking ?? null,
  };
}

export function RoomSection({ rooms, roomTypes, onRoomsChange }: RoomSectionProps) {
  const safeRooms = useMemo(() => Array.isArray(rooms) ? rooms : [], [rooms]);
  const safeRoomTypes = useMemo(() => Array.isArray(roomTypes) ? roomTypes : [], [roomTypes]);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalMode, setModalMode] = useState<"single" | "bulk" | null>(null);
  const [editingRoom, setEditingRoom] = useState<AdminRoom | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const filteredRooms = useMemo(() => {
    let result = [...safeRooms];
    if (filterType) result = result.filter((r) => r.room_type_id === filterType);
    if (filterStatus) result = result.filter((r) => r.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((r) => safeString(r.room_number).toLowerCase().includes(q));
    }
    return result.sort((a, b) => safeString(a.room_number).localeCompare(safeString(b.room_number), undefined, { numeric: true }));
  }, [safeRooms, filterType, filterStatus, searchQuery]);

  const getRoomTypeName = (typeId: string) => safeRoomTypes.find((rt) => rt.id === typeId)?.name || "-";

  const getStatusBadge = (status: string) => {
    const opt = ROOM_STATUS_OPTIONS.find((o) => o.value === status);
    return opt || ROOM_STATUS_OPTIONS[0];
  };

  const getHKBadge = (hk: string) => {
    const opt = HK_STATUS_OPTIONS.find((o) => o.value === hk);
    return opt || HK_STATUS_OPTIONS[0];
  };

  const openSingle = (room?: AdminRoom) => {
    setEditingRoom(room || null);
    setModalMode("single");
    setError("");
    setDropdownOpen(false);
  };

  const openBulk = () => {
    setModalMode("bulk");
    setError("");
    setDropdownOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบห้องพักนี้?")) return;
    startTransition(async () => {
      const result = await deleteRoom(id);
      if (result.error) {
        setError(result.error);
      } else {
          onRoomsChange(safeRooms.filter((r) => r.id !== id));
      }
    });
  };

  const handleSaveSingle = async (data: RoomFormData) => {
    setError("");
    const fd = new FormData();
    fd.set("room_type_id", data.room_type_id);
    fd.set("room_number", data.room_number.trim());
    fd.set("floor", data.floor.trim());
    fd.set("status", data.status);
    fd.set("housekeeping", data.housekeeping);
    fd.set("notes", data.notes.trim());
    fd.set("is_active", data.is_active.toString());
    if (data.id) fd.set("id", data.id);

    startTransition(async () => {
      const result = data.id ? await updateRoom(fd) : await createRoom(fd);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setModalMode(null);
        setEditingRoom(null);
        if (!data.id) {
          onRoomsChange([...safeRooms, normalizeRoom(result.data)]);
        } else {
          onRoomsChange(safeRooms.map((r) => (r.id === data.id ? normalizeRoom(result.data) : r)));
        }
      }
    });
  };

  const handleBulkCreate = async (data: BulkRoomFormData) => {
    setError("");
    const fd = new FormData();
    fd.set("room_type_id", data.room_type_id);
    fd.set("prefix", data.prefix);
    fd.set("start_number", data.start_number);
    fd.set("count", data.count);
    fd.set("floor", data.floor);
    fd.set("status", data.status);
    fd.set("housekeeping", data.housekeeping);

    startTransition(async () => {
      const result = await bulkCreateRooms(fd);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setModalMode(null);
        const createdRooms = Array.isArray(result.data.created) ? result.data.created.map(normalizeRoom) : [];
        onRoomsChange([...safeRooms, ...createdRooms]);
      }
    });
  };

  return (
    <>
      {/* Error */}
      {error && !modalMode && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="cursor-pointer ml-2"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
          {/* Type filter */}
          <select
            value={filterType ?? ""}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2.5 bg-white border border-[#e8e2d6] rounded-lg text-sm text-[#2c2c2c] focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer min-w-[160px]"
          >
            <option value="">ประเภทห้องทั้งหมด</option>
            {safeRoomTypes.map((rt) => (
              <option key={safeString(rt.id)} value={safeString(rt.id)}>{safeString(rt.name, "-")}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus ?? ""}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 bg-white border border-[#e8e2d6] rounded-lg text-sm text-[#2c2c2c] focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none cursor-pointer min-w-[140px]"
          >
            <option value="">สถานะทั้งหมด</option>
            {ROOM_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-[#8b7355] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery ?? ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขห้อง..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#e8e2d6] rounded-lg text-sm focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none"
            />
          </div>
        </div>

        {/* Add dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors cursor-pointer text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            เพิ่มห้องพัก
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e8e2d6] rounded-lg shadow-lg z-50 w-56 overflow-hidden">
                <button
                  onClick={() => openSingle()}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#2c2c2c] hover:bg-[#faf7f0] cursor-pointer transition-colors text-left"
                >
                  <Plus className="w-4 h-4 text-[#1a3c2a]" />
                  เพิ่มทีละห้อง
                </button>
                <div className="border-t border-[#f0ece4]" />
                <button
                  onClick={openBulk}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#2c2c2c] hover:bg-[#faf7f0] cursor-pointer transition-colors text-left"
                >
                  <Layers className="w-4 h-4 text-[#c9a84c]" />
                  สร้างหลายห้องพร้อมกัน
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-[#8b7355]">
        แสดง {filteredRooms.length} จาก {safeRooms.length} ห้อง
      </p>

      {/* Room Grid */}
      {filteredRooms.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl">
          <DoorOpen className="w-10 h-10 mx-auto mb-3 text-[#c4b9a8]" />
          <p className="text-[#8b7355] font-medium">
            {safeRooms.length === 0 ? "ยังไม่มีห้องพัก" : "ไม่พบห้องพักที่ตรงกับตัวกรอง"}
          </p>
          {safeRooms.length === 0 && (
            <button
              onClick={openBulk}
              className="mt-4 px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg text-sm cursor-pointer hover:bg-[#0f2418] transition-colors"
            >
              สร้างห้องพักหลายห้องพร้อมกัน
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {filteredRooms.map((room) => {
            const statusBadge = getStatusBadge(room.status);
            const hkBadge = getHKBadge(safeString(room.housekeeping, "clean"));
            return (
              <div
                key={room.id}
                className="bg-white rounded-xl border border-[#e8e2d6] p-4 flex flex-col gap-2.5 hover:shadow-md transition-shadow group"
              >
                {/* Room number */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xl font-bold text-[#1a3c2a] font-serif leading-tight">{safeString(room.room_number)}</p>
                    <p className="text-[11px] text-[#8b7355] mt-0.5">{getRoomTypeName(room.room_type_id)}</p>
                  </div>
                  {!room.is_active && (
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">ซ่อน</span>
                  )}
                </div>

                {/* Floor */}
                {room.floor && (
                  <p className="text-[11px] text-[#a89279]">ชั้น {room.floor}</p>
                )}

                {/* Status badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${hkBadge.color}`}>
                    {hkBadge.label}
                  </span>
                </div>

                {/* Guest Info (Show only if occupied and has booking data) */}
                {room.status === "occupied" && room.currentBooking && (
                  <div className="mt-1 bg-[#faf7f0] rounded-lg p-2.5 border border-[#e8e2d6] space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <p className="text-[11px] font-bold text-[#1a3c2a] line-clamp-1">
                        {room.currentBooking.guest_name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#8b7355]">
                      <span className="flex items-center gap-1">
                        ออก: {new Date(room.currentBooking.check_out || room.currentBooking.check_out_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="px-1 bg-white border border-[#e8e2d6] rounded-sm text-[9px] font-medium text-amber-600">
                        {room.currentBooking.status === 'checked_in' ? 'เข้าพัก' : 'ยืนยันแล้ว'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {room.notes && (
                  <p className="text-[11px] text-[#8b7355] line-clamp-1">{room.notes}</p>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-auto pt-2 border-t border-[#f0ece4] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(room.id)}
                    disabled={isPending}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    title="ลบ"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openSingle(room)}
                    className="p-1.5 text-[#1a3c2a] hover:bg-[#f0ece4] border border-[#e8e2d6] rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <Edit2 className="w-3 h-3" /> แก้ไข
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single Room Modal */}
      {modalMode === "single" && (
        <SingleRoomModal
          room={editingRoom}
          roomTypes={safeRoomTypes}
          error={error}
          isPending={isPending}
          onSave={handleSaveSingle}
          onClose={() => { setModalMode(null); setEditingRoom(null); setError(""); }}
        />
      )}

      {/* Bulk Create Modal */}
      {modalMode === "bulk" && (
        <BulkCreateModal
          roomTypes={safeRoomTypes}
          existingRoomNumbers={safeRooms.map((r) => safeString(r.room_number))}
          error={error}
          isPending={isPending}
          onSave={handleBulkCreate}
          onClose={() => { setModalMode(null); setError(""); }}
        />
      )}
    </>
  );
}

/* ─── Single Room Modal ──────────────────────────────── */

function SingleRoomModal({
  room,
  roomTypes,
  error,
  isPending,
  onSave,
  onClose,
}: {
  room: AdminRoom | null;
  roomTypes: AdminRoomType[];
  error: string;
  isPending: boolean;
  onSave: (data: RoomFormData) => Promise<void>;
  onClose: () => void;
}) {
  const isEdit = !!room;
  const [roomTypeId, setRoomTypeId] = useState(safeString(room?.room_type_id));
  const [roomNumber, setRoomNumber] = useState(safeString(room?.room_number));
  const [floor, setFloor] = useState(safeString(room?.floor));
  const [status, setStatus] = useState(safeString(room?.status, "available"));
  const [housekeeping, setHousekeeping] = useState(safeString(room?.housekeeping, "clean"));
  const [notes, setNotes] = useState(safeString(room?.notes));
  const [isActive, setIsActive] = useState(safeBoolean(room?.is_active, true));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!roomTypeId) errs.roomTypeId = "กรุณาเลือกประเภทห้อง";
    if (!roomNumber.trim()) errs.roomNumber = "กรุณากรอกเลขห้อง";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSave({
      room_type_id: roomTypeId,
      room_number: roomNumber,
      floor,
      status,
      housekeeping,
      notes,
      is_active: isActive,
      id: room?.id,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-[#e8e2d6] px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="text-lg font-serif font-semibold text-[#1a3c2a]">
            {isEdit ? "แก้ไขห้องพัก" : "เพิ่มห้องพัก"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f0ece4] rounded-lg cursor-pointer transition-colors">
            <X className="w-5 h-5 text-[#8b7355]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#8b7355] mb-1.5">ประเภทห้อง <span className="text-red-400">*</span></label>
            <select value={roomTypeId ?? ""} onChange={(e) => setRoomTypeId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm cursor-pointer"
            >
              <option value="">เลือกประเภทห้อง</option>
              {roomTypes.map((rt) => <option key={safeString(rt.id)} value={safeString(rt.id)}>{safeString(rt.name, "-")}</option>)}
            </select>
            {errors.roomTypeId && <p className="text-xs text-red-500 mt-1">{errors.roomTypeId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">เลขห้อง <span className="text-red-400">*</span></label>
              <input type="text" value={roomNumber ?? ""} onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm"
                placeholder="เช่น 101, A1"
              />
              {errors.roomNumber && <p className="text-xs text-red-500 mt-1">{errors.roomNumber}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">ชั้น</label>
              <input type="text" value={floor ?? ""} onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm"
                placeholder="เช่น 1, 2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">สถานะห้อง</label>
              <select value={status ?? "available"} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm cursor-pointer"
              >
                {ROOM_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">สถานะความสะอาด</label>
              <select value={housekeeping ?? "clean"} onChange={(e) => setHousekeeping(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm cursor-pointer"
              >
                {HK_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8b7355] mb-1.5">หมายเหตุ</label>
            <textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm"
              placeholder="บันทึกเพิ่มเติม"
            />
          </div>

          <div className="flex items-center">
            <input type="checkbox" id="room-active-modal" checked={Boolean(isActive)} onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#1a3c2a] rounded border-[#e8e2d6] focus:ring-[#1a3c2a]"
            />
            <label htmlFor="room-active-modal" className="ml-2 text-sm text-[#2c2c2c]">แสดงผล</label>
          </div>

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

/* ─── Bulk Create Modal ──────────────────────────────── */

function BulkCreateModal({
  roomTypes,
  existingRoomNumbers,
  error,
  isPending,
  onSave,
  onClose,
}: {
  roomTypes: AdminRoomType[];
  existingRoomNumbers: string[];
  error: string;
  isPending: boolean;
  onSave: (data: BulkRoomFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [roomTypeId, setRoomTypeId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [startNumber, setStartNumber] = useState("101");
  const [count, setCount] = useState("5");
  const [floor, setFloor] = useState("");
  const [status, setStatus] = useState("available");
  const [housekeeping, setHousekeeping] = useState("clean");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate preview
  const preview = useMemo(() => {
    const start = parseInt(startNumber, 10);
    const num = parseInt(count, 10);
    if (isNaN(start) || isNaN(num) || num < 1 || num > 100) return [];
    return Array.from({ length: Math.min(num, 100) }, (_, i) => {
      const roomNumber = `${prefix}${start + i}`;
      const exists = existingRoomNumbers.includes(roomNumber);
      return { roomNumber, exists };
    });
  }, [prefix, startNumber, count, existingRoomNumbers]);

  const duplicateCount = preview.filter((p) => p.exists).length;
  const newCount = preview.filter((p) => !p.exists).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!roomTypeId) errs.roomTypeId = "กรุณาเลือกประเภทห้อง";
    if (!startNumber || isNaN(parseInt(startNumber, 10)) || parseInt(startNumber, 10) < 0) errs.startNumber = "เลขเริ่มต้นไม่ถูกต้อง";
    if (!count || isNaN(parseInt(count, 10)) || parseInt(count, 10) < 1) errs.count = "จำนวนต้องมากกว่า 0";
    if (parseInt(count, 10) > 100) errs.count = "สร้างได้สูงสุด 100 ห้องต่อครั้ง";
    if (newCount === 0 && preview.length > 0) errs.count = "ห้องทั้งหมดมีอยู่แล้ว";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSave({ room_type_id: roomTypeId, prefix, start_number: startNumber, count, floor, status, housekeeping });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[3vh] sm:pt-[8vh] px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-[#e8e2d6] px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#c9a84c]" />
            <h2 className="text-lg font-serif font-semibold text-[#1a3c2a]">สร้างห้องพักหลายห้องพร้อมกัน</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f0ece4] rounded-lg cursor-pointer transition-colors">
            <X className="w-5 h-5 text-[#8b7355]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}

          {/* Room type */}
          <div>
            <label className="block text-xs font-medium text-[#8b7355] mb-1.5">ประเภทห้อง <span className="text-red-400">*</span></label>
            <select value={roomTypeId ?? ""} onChange={(e) => setRoomTypeId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm cursor-pointer"
            >
              <option value="">เลือกประเภทห้อง</option>
              {roomTypes.map((rt) => <option key={safeString(rt.id)} value={safeString(rt.id)}>{safeString(rt.name, "-")}</option>)}
            </select>
            {errors.roomTypeId && <p className="text-xs text-red-500 mt-1">{errors.roomTypeId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">ชั้น</label>
              <input type="text" value={floor ?? ""} onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm"
                placeholder="เช่น 1, 2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">Prefix (นำหน้า)</label>
              <input type="text" value={prefix ?? ""} onChange={(e) => setPrefix(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm"
                placeholder="เช่น A, VIP"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">เลขเริ่มต้น <span className="text-red-400">*</span></label>
              <input type="number" value={startNumber ?? ""} onChange={(e) => setStartNumber(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm"
                placeholder="101"
              />
              {errors.startNumber && <p className="text-xs text-red-500 mt-1">{errors.startNumber}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">จำนวนห้อง <span className="text-red-400">*</span></label>
              <input type="number" value={count ?? ""} onChange={(e) => setCount(e.target.value)} min={1} max={100}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm"
                placeholder="5"
              />
              {errors.count && <p className="text-xs text-red-500 mt-1">{errors.count}</p>}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-2">ตัวอย่างห้องที่จะสร้าง</label>
              <div className="bg-[#faf7f0] rounded-lg border border-[#e8e2d6] p-3">
                <div className="flex flex-wrap gap-1.5">
                  {preview.map((p) => (
                    <span
                      key={p.roomNumber}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        p.exists
                          ? "bg-red-50 text-red-500 border-red-200 line-through"
                          : "bg-white text-[#1a3c2a] border-[#e8e2d6]"
                      }`}
                    >
                      {p.roomNumber}
                    </span>
                  ))}
                </div>
                {duplicateCount > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5 text-xs text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{duplicateCount} ห้องมีอยู่แล้ว (จะถูกข้าม)</span>
                  </div>
                )}
                <p className="text-xs text-[#8b7355] mt-1.5">
                  จะสร้างใหม่ <span className="font-semibold text-[#1a3c2a]">{newCount}</span> ห้อง
                </p>
              </div>
            </div>
          )}

          {/* Default status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">สถานะเริ่มต้น</label>
              <select value={status ?? "available"} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm cursor-pointer"
              >
                {ROOM_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b7355] mb-1.5">สถานะความสะอาด</label>
              <select value={housekeeping ?? "clean"} onChange={(e) => setHousekeeping(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#faf7f0] border border-[#e8e2d6] rounded-lg focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c] outline-none text-sm cursor-pointer"
              >
                {HK_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm border border-[#e8e2d6] text-[#8b7355] rounded-lg hover:bg-[#faf7f0] cursor-pointer transition-colors"
            >ยกเลิก</button>
            <button type="submit" disabled={isPending || newCount === 0}
              className="px-5 py-2.5 text-sm bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors font-medium"
            >
              <Layers className="w-4 h-4" />
              {isPending ? "กำลังสร้าง..." : `สร้าง ${newCount} ห้อง`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
