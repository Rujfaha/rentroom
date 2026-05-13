"use client";

import { useState, useTransition } from "react";
import { PhysicalRoomCard } from "./PhysicalRoomCard";
import { PhysicalRoomForm } from "./PhysicalRoomForm";
import { createRoom, updateRoom, deleteRoom } from "@/app/actions/rooms";
import { Plus, DoorOpen } from "lucide-react";
import type { CmsPhysicalRoom, CmsRoomTypeOption } from "./physical-room-types";

interface PhysicalRoomsManagerProps {
  roomTypeId: string;
  roomTypes: CmsRoomTypeOption[];
  initialRooms: CmsPhysicalRoom[];
  onRoomsChange: (rooms: CmsPhysicalRoom[]) => void;
}

export function PhysicalRoomsManager({ roomTypeId, roomTypes, initialRooms, onRoomsChange }: PhysicalRoomsManagerProps) {
  const [rooms, setRooms] = useState(initialRooms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  const sortedRooms = [...rooms].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));

  const handleSave = async (formData: FormData) => {
    setError("");
    const id = formData.get("id") as string;

    startTransition(async () => {
      const result = id ? await updateRoom(formData) : await createRoom(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setEditingId(null);
        if (!id) {
          // Create: remove "new" placeholder and prepend real data
          setRooms((prev) => {
            const updated = [result.data, ...prev.filter((r) => r.id !== "new")];
            onRoomsChange(updated);
            return updated;
          });
        } else {
          // Update: replace existing room
          setRooms((prev) => {
            const updated = prev.map((r) => (r.id === id ? result.data : r));
            onRoomsChange(updated);
            return updated;
          });
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบห้องพักนี้?")) return;
    startTransition(async () => {
      const result = await deleteRoom(id);
      if (result.error) {
        setError(result.error);
      } else {
        const updated = rooms.filter((r) => r.id !== id);
        setRooms(updated);
        onRoomsChange(updated);
      }
    });
  };

  const editingRoom = rooms.find((r) => r.id === editingId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-semibold text-[#1a3c2a]">ห้องพักจริง</h2>
          <p className="text-sm text-[#8b7355]">จัดการห้องพักสำหรับประเภทห้องนี้</p>
        </div>
        <button
          onClick={() => {
            const newRoom: CmsPhysicalRoom = {
              id: "new",
              room_type_id: roomTypeId,
              room_number: "",
              floor: "",
              status: "available",
              housekeeping: "clean",
              notes: "",
              is_active: true,
            };
            setRooms([newRoom, ...rooms]);
            setEditingId("new");
          }}
          className="flex items-center px-3 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          เพิ่มห้องพัก
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {editingId === "new" && (
        <PhysicalRoomForm
          room={editingRoom}
          roomTypes={roomTypes}
          defaultRoomTypeId={roomTypeId}
          onSave={handleSave}
          onCancel={() => {
            setRooms(rooms.filter((r) => r.id !== "new"));
            setEditingId(null);
            setError("");
          }}
        />
      )}

      <div className="flex flex-wrap -mx-3">
        {sortedRooms
          .filter((r) => r.id !== "new")
          .map((room) => (
            <div key={room.id} className={`w-full sm:w-1/2 lg:w-1/3 px-3 mb-4 ${editingId !== null && editingId !== room.id ? 'self-start' : ''}`}>
              {editingId === room.id ? (
                <div className="h-full"><PhysicalRoomForm
                  room={room}
                  roomTypes={roomTypes}
                  defaultRoomTypeId={roomTypeId}
                  onSave={handleSave}
                  onCancel={() => {
                    setEditingId(null);
                    setError("");
                  }}
                /></div>
              ) : (
                <div className="h-full"><PhysicalRoomCard
                  room={room}
                  roomTypeName={roomTypes.find((rt) => rt.id === room.room_type_id)?.name}
                  onEdit={() => setEditingId(room.id)}
                  onDelete={() => handleDelete(room.id)}
                /></div>
              )}
            </div>
          ))}
      </div>

      {rooms.filter((r) => r.id !== "new").length === 0 && (
        <div className="py-10 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl text-[#a89279]">
          <DoorOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>ยังไม่มีห้องพักสำหรับประเภทนี้</p>
          <button
            onClick={() => {
              const newRoom: CmsPhysicalRoom = {
                id: "new",
                room_type_id: roomTypeId,
                room_number: "",
                floor: "",
                status: "available",
                housekeeping: "clean",
                notes: "",
                is_active: true,
              };
              setRooms([newRoom, ...rooms]);
              setEditingId("new");
            }}
            className="mt-3 text-sm text-[#1a3c2a] underline cursor-pointer"
          >
            เพิ่มห้องพักแรก
          </button>
        </div>
      )}
    </div>
  );
}
