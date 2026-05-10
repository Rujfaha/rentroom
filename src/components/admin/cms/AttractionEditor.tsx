"use client";

import { useRef, useState, useTransition } from "react";
import { updateAttraction, deleteAttraction } from "@/app/actions/attractions";
import {
  Plus,
  Save,
  Trash2,
  Edit2,
  MapPin,
  Navigation,
  ExternalLink,
  Upload,
  Link,
  X,
  Landmark,
} from "lucide-react";

function AttractionImageInput({
  defaultUrl,
  onImageUrlChange,
}: {
  defaultUrl: string;
  onImageUrlChange?: (url: string) => void;
}) {
  const safeDefaultUrl = defaultUrl ?? "";
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [tempUrl, setTempUrl] = useState("");
  const [imageUrl, setImageUrl] = useState(safeDefaultUrl);
  const [preview, setPreview] = useState(safeDefaultUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploadError("");
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "attractions");

    try {
      const res = await fetch("/api/cms/upload-image", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      setUploading(false);

      if (result.error) {
        setUploadError(result.error);
        setPreview(imageUrl);
      } else if (result.url) {
        updateImageUrl(result.url);
      }
    } catch {
      setUploading(false);
      setUploadError("อัปโหลดไม่สำเร็จ");
      setPreview(imageUrl);
    }
  };

  const handleFetchExternalUrl = async () => {
    if (!tempUrl.trim()) {
      setUploadError("กรุณาใส่ URL");
      return;
    }

    setUploadError("");
    setUploading(true);
    setPreview(tempUrl);

    const fd = new FormData();
    fd.append("url", tempUrl);
    fd.append("folder", "attractions");

    try {
      const res = await fetch("/api/cms/upload-image", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      setUploading(false);

      if (result.error) {
        setUploadError(result.error);
        setPreview(imageUrl);
      } else if (result.url) {
        updateImageUrl(result.url);
      }
    } catch {
      setUploading(false);
      setUploadError("ไม่สามารถดาวน์โหลดรูปภาพจาก URL นี้ได้");
      setPreview(imageUrl);
    }
  };

  const notifyUrl = (url: string) => {
    onImageUrlChange?.(url);
  };

  const updateImageUrl = (url: string) => {
    setImageUrl(url);
    setPreview(url);
    notifyUrl(url);
  };

  const clearImage = () => {
    setImageUrl("");
    setPreview("");
    setTempUrl("");
    notifyUrl("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[#8b7355] mb-1">
        รูปภาพสถานที่
      </label>

      <div className="flex gap-1 p-1 bg-[#f0ece4] rounded-lg">
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            tab === "url"
              ? "bg-white text-[#1a3c2a] shadow-sm"
              : "text-[#8b7355] hover:text-[#1a3c2a]"
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            tab === "upload"
              ? "bg-white text-[#1a3c2a] shadow-sm"
              : "text-[#8b7355] hover:text-[#1a3c2a]"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          อัปโหลดไฟล์
        </button>
      </div>

      {tab === "url" ? (
        <div key="attraction-image-url" className="space-y-2">
          <input
            key="attraction-image-url-input"
            type="text"
            value={tempUrl ?? ""}
            onChange={(e) => setTempUrl(e.target.value)}
            disabled={uploading}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm disabled:opacity-60"
            placeholder="https://example.com/photo.jpg"
          />
          <button
            type="button"
            onClick={handleFetchExternalUrl}
            disabled={uploading || !tempUrl.trim()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-md text-sm font-medium hover:bg-[#0f2418] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#faf7f0]/30 border-t-[#faf7f0] rounded-full animate-spin" />
                กำลังดาวน์โหลด...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                บันทึก URL
              </>
            )}
          </button>
          {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
        </div>
      ) : (
        <div key="attraction-image-upload">
          <input
            key="attraction-image-file-input"
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-[#e8e2d6] rounded-md text-sm text-[#8b7355] hover:border-[#1a3c2a]/30 hover:text-[#1a3c2a] hover:bg-[#faf7f0] transition-colors cursor-pointer disabled:opacity-60"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-[#1a3c2a]/30 border-t-[#1a3c2a] rounded-full animate-spin" />
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                เลือกไฟล์รูปภาพ
              </>
            )}
          </button>
          {uploadError && (
            <p className="text-xs text-red-500 mt-1">{uploadError}</p>
          )}
        </div>
      )}

      {preview && (
        <div className="relative mt-2 rounded-lg overflow-hidden border border-[#e8e2d6] h-28">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

export function AttractionEditor({
  initialAttractions,
}: {
  initialAttractions: any[];
}) {
  const [attractions, setAttractions] = useState(initialAttractions ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("id", id);

    const isVisible = (
      e.currentTarget.elements.namedItem("is_visible") as HTMLInputElement
    ).checked;
    formData.set("is_visible", isVisible.toString());

    const image_url = imageUrls[id] || attractions.find((a) => a.id === id)?.image_url || "";
    formData.set("image_url", image_url);

    startTransition(async () => {
      const result = await updateAttraction(formData);
      if (!result.error) {
        setEditingId(null);
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบสถานที่ท่องเที่ยวนี้?")) return;
    startTransition(async () => {
      const result = await deleteAttraction(id);
      if (!result.error) {
        setAttractions(attractions.filter((a) => a.id !== id));
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            const newAttraction = {
              id: "new",
              name: "",
              description: "",
              image_url: "",
              distance_km: "",
              map_url: "",
              is_visible: true,
            };
            setAttractions([newAttraction, ...attractions]);
            setEditingId("new");
          }}
          className="flex items-center px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มสถานที่ท่องเที่ยว
        </button>
      </div>

      <div className="flex flex-wrap -mx-3">
        {attractions.map((attraction) => (
          <div
            key={attraction.id}
            className={`w-full md:w-1/2 xl:w-1/3 px-3 mb-6 ${editingId !== null && editingId !== attraction.id ? 'self-start' : ''}`}
          >
            <div className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] overflow-hidden flex flex-col relative h-full">
            {editingId === attraction.id ? (
              <form
                onSubmit={(e) => handleSave(e, attraction.id)}
                className="p-5 space-y-4 flex-1 flex flex-col"
              >
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">
                    ชื่อสถานที่ *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={attraction.name ?? ""}
                    required
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">
                    รายละเอียด
                  </label>
                  <textarea
                    name="description"
                    defaultValue={attraction.description ?? ""}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#8b7355] mb-1">
                      ระยะทาง (กม.)
                    </label>
                    <input
                      type="number"
                      name="distance_km"
                      min="0"
                      step="0.01"
                      defaultValue={attraction.distance_km ?? ""}
                      className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                      placeholder="เช่น 5.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b7355] mb-1">
                      ลิงก์ Google Maps
                    </label>
                    <input
                      type="text"
                      name="map_url"
                      defaultValue={attraction.map_url ?? ""}
                      className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>

                <AttractionImageInput
                  defaultUrl={attraction.image_url || ""}
                  onImageUrlChange={(url) =>
                    setImageUrls((prev) => ({ ...prev, [attraction.id]: url }))
                  }
                />

                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id={`visible-${attraction.id}`}
                    name="is_visible"
                    defaultChecked={attraction.is_visible !== false}
                    className="w-4 h-4 text-[#1a3c2a] rounded border-[#e8e2d6] focus:ring-[#1a3c2a]"
                  />
                  <label
                    htmlFor={`visible-${attraction.id}`}
                    className="ml-2 text-sm text-[#2c2c2c]"
                  >
                    แสดงผลบนหน้าเว็บ
                  </label>
                </div>

                <div className="flex justify-end gap-2 mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (attraction.id === "new")
                        setAttractions(
                          attractions.filter((a) => a.id !== "new")
                        );
                      setEditingId(null);
                    }}
                    className="px-3 py-1.5 text-sm border border-[#e8e2d6] text-[#8b7355] rounded-md hover:bg-slate-50 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm bg-[#1a3c2a] text-[#faf7f0] rounded-md hover:bg-[#0f2418] flex items-center cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-1" /> บันทึก
                  </button>
                </div>
              </form>
            ) : (
              <>
                {attraction.image_url && (
                  <div className="h-32 bg-slate-100 overflow-hidden shrink-0 border-b border-[#e8e2d6]">
                    <img
                      src={attraction.image_url}
                      alt={attraction.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-[#1a3c2a] text-lg leading-tight">
                      {attraction.name || "ไม่มีชื่อ"}
                    </h3>
                    {!attraction.is_visible && (
                      <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ml-2">
                        ซ่อนอยู่
                      </span>
                    )}
                  </div>

                  {attraction.distance_km != null && (
                    <div className="flex items-center text-[#2d5a3f] text-sm font-bold mb-2">
                      <Navigation className="w-3.5 h-3.5 mr-1" />
                      {Number(attraction.distance_km).toFixed(1)} กม. จากโรงแรม
                    </div>
                  )}

                  <p className="text-sm text-[#8b7355] line-clamp-3 mb-4">
                    {attraction.description || "-"}
                  </p>

                  {attraction.map_url && (
                    <a
                      href={attraction.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-[#1a3c2a] bg-[#1a3c2a]/5 border border-[#1a3c2a]/10 rounded-md px-2 py-1 mb-4 w-fit hover:bg-[#1a3c2a]/10 transition-colors"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      ดูแผนที่
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}

                  <div className="flex justify-between mt-auto pt-4 border-t border-[#e8e2d6]">
                    <button
                      onClick={() => handleDelete(attraction.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(attraction.id)}
                      className="p-1.5 text-[#1a3c2a] hover:bg-[#faf7f0] border border-[#e8e2d6] rounded-md transition-colors flex items-center gap-1 text-sm cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> แก้ไข
                    </button>
                  </div>
                </div>
              </>
            )}
            </div>
          </div>
        ))}

        {attractions.length === 0 && (
          <div className="w-full py-12 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl text-[#a89279]">
            <Landmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีสถานที่ท่องเที่ยว</p>
          </div>
        )}
      </div>
    </div>
  );
}
