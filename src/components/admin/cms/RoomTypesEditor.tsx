"use client";

import { useState, useTransition } from "react";
import { RoomTypeCard } from "./RoomTypeCard";
import { RoomTypeForm } from "./RoomTypeForm";
import { RoomTypeImageGallery } from "./RoomTypeImageGallery";
import { PhysicalRoomsManager } from "./PhysicalRoomsManager";
import { createRoomType, updateRoomType, deleteRoomType } from "@/app/actions/rooms";
import { Plus, Image as ImageIcon, Hand, ArrowDown } from "lucide-react";
import type { CmsPhysicalRoom } from "./physical-room-types";
import type { CmsRoomType } from "./room-type-types";

interface RoomTypesEditorProps {
  initialRoomTypes: CmsRoomType[];
  initialRooms: CmsPhysicalRoom[];
}

export function RoomTypesEditor({ initialRoomTypes, initialRooms }: RoomTypesEditorProps) {
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes);
  const [rooms, setRooms] = useState(initialRooms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSave = async (formData: FormData) => {
    setError("");
    const id = formData.get("id") as string;

    startTransition(async () => {
      const result = id ? await updateRoomType(formData) : await createRoomType(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setEditingId(null);
        if (!id) {
          // Create: remove "new" placeholder and prepend real data
          const newRoomType: CmsRoomType = { ...result.data, images: [] };
          setRoomTypes((prev) => [newRoomType, ...prev.filter((rt) => rt.id !== "new")]);
        } else {
          // Update: merge images from existing state
          setRoomTypes((prev) =>
            prev.map((rt) =>
              rt.id === id ? { ...result.data, images: rt.images || [] } : rt
            )
          );
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบประเภทห้องนี้?")) return;
    startTransition(async () => {
      const result = await deleteRoomType(id);
      if (result.error) {
        setError(result.error);
      } else {
        setRoomTypes(roomTypes.filter((rt) => rt.id !== id));
        if (selectedRoomTypeId === id) setSelectedRoomTypeId(null);
      }
    });
  };

  const editingRoomType = roomTypes.find((rt) => rt.id === editingId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Header + Add Button */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            const newId = "new";
            setRoomTypes([{ id: newId, name: "", base_price: 0, max_guests: 2, amenities: [], is_active: true, images: [] }, ...roomTypes]);
            setEditingId(newId);
          }}
          className="flex items-center px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มประเภทห้อง
        </button>
      </div>

      {/* Room Types Grid */}
      <div className="flex flex-wrap -mx-3">
        {roomTypes.map((roomType) => (
          <div key={roomType.id} className={`w-full md:w-1/2 lg:w-1/3 px-3 mb-6 ${editingId !== null && editingId !== roomType.id ? 'self-start' : ''}`}>
            {editingId === roomType.id ? (
              <div className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] overflow-hidden flex flex-col h-full">
                <RoomTypeForm
                  roomType={editingRoomType}
                  onSave={handleSave}
                  onCancel={() => {
                    if (roomType.id === "new") {
                      setRoomTypes(roomTypes.filter((rt) => rt.id !== "new"));
                    }
                    setEditingId(null);
                    setError("");
                  }}
                />
                {/* Image Gallery for existing room types */}
                {roomType.id !== "new" && (
                  <div className="px-4 pb-4 border-t border-[#e8e2d6]">
                    <h4 className="text-xs font-medium text-[#8b7355] mt-3 mb-2">รูปภาพประเภทห้อง</h4>
                    <RoomTypeImageGallery
                      roomTypeId={roomType.id}
                      images={roomType.images || []}
                      onImagesChange={(newImages) => {
                        setRoomTypes(
                          roomTypes.map((rt) =>
                            rt.id === roomType.id ? { ...rt, images: newImages } : rt
                          )
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => setSelectedRoomTypeId(roomType.id)}
                className={`cursor-pointer transition-all h-full ${
                  selectedRoomTypeId === roomType.id ? "ring-2 ring-[#c9a84c] rounded-xl" : ""
                }`}
              >
                <RoomTypeCard
                  roomType={roomType}
                  onEdit={() => setEditingId(roomType.id)}
                  onDelete={() => handleDelete(roomType.id)}
                />
              </div>
            )}
          </div>
        ))}

        {roomTypes.length === 0 && (
          <div className="w-full py-12 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl text-[#a89279]">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีประเภทห้อง</p>
            <button
              onClick={() => {
                setRoomTypes([{ id: "new", name: "", base_price: 0, max_guests: 2, amenities: [], is_active: true, images: [] }]);
                setEditingId("new");
              }}
              className="mt-3 text-sm text-[#1a3c2a] underline cursor-pointer"
            >
              สร้างประเภทห้องแรก
            </button>
          </div>
        )}
      </div>

      {/* Physical Rooms Section */}
      <div className="mt-8 pt-6 border-t border-[#e8e2d6]">
        {!selectedRoomTypeId ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-3 bg-[#c9a84c]/10 text-[#1a3c2a] rounded-lg text-sm font-medium">
              <Hand className="w-4 h-4" />
              กดเลือกประเภทห้องด้านบนเพื่อดูและจัดการห้องพักจริง
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <ArrowDown className="w-4 h-4 text-[#c9a84c]" />
              <p className="text-sm text-[#8b7355]">
                กำลังแสดงห้องพักสำหรับประเภท:
                <span className="font-semibold text-[#1a3c2a] ml-1">
                  {roomTypes.find((rt) => rt.id === selectedRoomTypeId)?.name}
                </span>
              </p>
              <button
                onClick={() => setSelectedRoomTypeId(null)}
                className="ml-auto text-xs text-[#8b7355] hover:text-[#1a3c2a] underline cursor-pointer"
              >
                ปิด
              </button>
            </div>
            <PhysicalRoomsManager
              roomTypeId={selectedRoomTypeId}
              roomTypes={roomTypes}
              initialRooms={rooms.filter((r) => r.room_type_id === selectedRoomTypeId)}
              onRoomsChange={(newRooms) => {
                setRooms((prev) => [
                  ...prev.filter((room) => room.room_type_id !== selectedRoomTypeId),
                  ...newRooms,
                ]);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
