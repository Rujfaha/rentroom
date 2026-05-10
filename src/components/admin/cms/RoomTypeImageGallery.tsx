"use client";

import { useState, useTransition } from "react";
import { ImageUploadInput } from "./ImageUploadInput";
import { uploadRoomTypeImage, setCoverImage, deleteRoomTypeImage } from "@/app/actions/rooms";
import { Star, Trash2, Image as ImageIcon } from "lucide-react";

interface RoomTypeImageGalleryProps {
  roomTypeId: string;
  images: any[];
  onImagesChange: (images: any[]) => void;
}

export function RoomTypeImageGallery({ roomTypeId, images, onImagesChange }: RoomTypeImageGalleryProps) {
  const [isPending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState("");

  const sortedImages = [...images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const handleUpload = async (url: string) => {
    setUploadError("");
    const fd = new FormData();
    fd.append("room_type_id", roomTypeId);
    fd.append("image_url", url);

    startTransition(async () => {
      const result = await uploadRoomTypeImage(fd);
      if (result.error) {
        setUploadError(result.error as string);
      } else if (result.data) {
        // Append new image to existing images
        onImagesChange([...sortedImages, result.data]);
      }
    });
  };

  const handleSetCover = (imageId: string) => {
    startTransition(async () => {
      const result = await setCoverImage(roomTypeId, imageId);
      if (result.error) {
        alert(result.error);
      } else {
        const updated = sortedImages.map((img) => ({
          ...img,
          is_cover: img.id === imageId,
        }));
        onImagesChange(updated);
      }
    });
  };

  const handleDelete = (imageId: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้?")) return;
    startTransition(async () => {
      const result = await deleteRoomTypeImage(imageId);
      if (result.error) {
        alert(result.error);
      } else {
        onImagesChange(sortedImages.filter((img) => img.id !== imageId));
      }
    });
  };

  return (
    <div className="space-y-3">
      <ImageUploadInput folder="room_types" onUploadSuccess={handleUpload} />
      {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

      {sortedImages.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-[#e8e2d6] rounded-lg text-[#a89279]">
          <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
          <p className="text-xs">ยังไม่มีรูปภาพ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {sortedImages.map((img) => (
            <div
              key={img.id}
              className={`relative rounded-lg overflow-hidden border-2 ${
                img.is_cover ? "border-[#c9a84c]" : "border-[#e8e2d6]"
              } group`}
            >
              <div className="aspect-square bg-[#f0ece4]">
                <img
                  src={img.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Cover badge */}
              {img.is_cover && (
                <div className="absolute top-1.5 left-1.5 bg-[#c9a84c] text-[#1a3c2a] text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  หน้าปก
                </div>
              )}

              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                {!img.is_cover && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(img.id)}
                    disabled={isPending}
                    className="px-2 py-1 bg-[#c9a84c] text-[#1a3c2a] rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50"
                  >
                    ตั้งเป็นหน้าปก
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  disabled={isPending}
                  className="p-1 bg-white/90 text-rose-500 rounded hover:bg-white cursor-pointer disabled:opacity-50 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
