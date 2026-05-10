"use client";

import { useState, useTransition, useRef } from "react";
import { updateHeroSlide, deleteHeroSlide } from "@/app/actions/hero";
import { Plus, Save, Trash2, Edit2, Image as ImageIcon, Link, Upload, X } from "lucide-react";

function ImageInput({ defaultUrl, isSaving }: { defaultUrl: string; isSaving?: boolean }) {
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
    fd.append("folder", "hero");

    try {
      const res = await fetch("/api/cms/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      setUploading(false);

      if (result.error) {
        setUploadError(result.error);
        setPreview(imageUrl);
      } else if (result.url) {
        setImageUrl(result.url);
        setPreview(result.url);
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
    fd.append("folder", "hero");

    try {
      const res = await fetch("/api/cms/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      setUploading(false);

      if (result.error) {
        setUploadError(result.error);
        setPreview(imageUrl);
      } else if (result.url) {
        setImageUrl(result.url);
        setPreview(result.url);
      }
    } catch (error) {
      setUploading(false);
      setUploadError("ไม่สามารถดาวน์โหลดรูปภาพจาก URL นี้ได้");
      setPreview(imageUrl);
    }
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name="image_url" value={imageUrl ?? ""} />

      <label className="block text-xs font-medium text-[#8b7355] mb-1">รูปภาพ Slide</label>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 bg-[#f0ece4] rounded-lg">
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            tab === "url" ? "bg-white text-[#1a3c2a] shadow-sm" : "text-[#8b7355] hover:text-[#1a3c2a]"
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            tab === "upload" ? "bg-white text-[#1a3c2a] shadow-sm" : "text-[#8b7355] hover:text-[#1a3c2a]"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          อัปโหลดไฟล์
        </button>
      </div>

      {tab === "url" ? (
        <div className="space-y-2">
          <input
            type="text"
            value={tempUrl ?? ""}
            onChange={(e) => setTempUrl(e.target.value)}
            disabled={uploading}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm disabled:opacity-60"
            placeholder="https://example.com/image.jpg"
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
          {uploadError && (
            <p className="text-xs text-red-500">{uploadError}</p>
          )}
        </div>
      ) : (
        <div>
          <input
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

      {/* Preview */}
      {preview && !isSaving && (
        <div className="relative mt-2 rounded-lg overflow-hidden border border-[#e8e2d6] h-28">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setImageUrl(""); setPreview(""); setTempUrl(""); if (fileRef.current) fileRef.current.value = ""; }}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

export function HeroSlideEditor({ initialSlides }: { initialSlides: any[] }) {
  const [slides, setSlides] = useState(initialSlides ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("id", id);
    const isActive = (e.currentTarget.elements.namedItem("is_active") as HTMLInputElement).checked;
    formData.set("is_active", isActive.toString());

    startTransition(async () => {
      const result = await updateHeroSlide(formData);
      if (!result.error) {
        setEditingId(null);
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบสไลด์นี้?")) return;
    startTransition(async () => {
      const result = await deleteHeroSlide(id);
      if (!result.error) {
        setSlides(slides.filter((s) => s.id !== id));
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
            const newSlide = { id: "new", image_url: "", headline: "", subheadline: "", is_active: true };
            setSlides([newSlide, ...slides]);
            setEditingId("new");
          }}
          className="flex items-center px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors cursor-pointer text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มรูปภาพ Slide
        </button>
      </div>

      <div className="flex flex-wrap -mx-3">
        {slides.map((slide) => (
          <div key={slide.id} className={`w-full md:w-1/2 lg:w-1/3 px-3 mb-6 ${editingId !== null && editingId !== slide.id ? 'self-start' : ''}`}>
            <div className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] overflow-hidden flex flex-col h-full">
            {editingId === slide.id ? (
              <form onSubmit={(e) => handleSave(e, slide.id)} className="p-4 space-y-4 flex-1 flex flex-col">

                <ImageInput defaultUrl={slide.image_url || ""} isSaving={isPending} />

                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">พาดหัว</label>
                  <input
                    type="text"
                    name="headline"
                    defaultValue={slide.headline ?? ""}
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">คำบรรยายใต้พาดหัว</label>
                  <textarea
                    name="subheadline"
                    defaultValue={slide.subheadline ?? ""}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`active-${slide.id}`}
                    name="is_active"
                    defaultChecked={slide.is_active !== false}
                    className="w-4 h-4 text-[#1a3c2a] rounded border-[#e8e2d6] focus:ring-[#1a3c2a]"
                  />
                  <label htmlFor={`active-${slide.id}`} className="ml-2 text-sm text-[#2c2c2c]">แสดงผล</label>
                </div>

                <div className="flex justify-end gap-2 mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (slide.id === "new") setSlides(slides.filter((s) => s.id !== "new"));
                      setEditingId(null);
                    }}
                    className="px-3 py-1.5 text-sm border border-[#e8e2d6] text-[#8b7355] rounded-md hover:bg-[#faf7f0] cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-1.5 text-sm bg-[#1a3c2a] text-[#faf7f0] rounded-md hover:bg-[#0f2418] flex items-center cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4 mr-1" /> บันทึก
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="relative h-48 bg-[#f0ece4] flex items-center justify-center overflow-hidden">
                  {slide.image_url ? (
                    <img src={slide.image_url} alt={slide.headline} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-[#c4b9a8]" />
                  )}
                  {!slide.is_active && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">ซ่อนอยู่</div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-serif text-[#1a3c2a] text-lg truncate">{slide.headline || "ไม่มีพาดหัว"}</h3>
                  <p className="text-sm text-[#8b7355] line-clamp-2 mt-1">{slide.subheadline || "ไม่มีคำอธิบาย"}</p>

                  <div className="flex justify-between mt-auto pt-4">
                    <button
                      onClick={() => handleDelete(slide.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(slide.id)}
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

        {slides.length === 0 && (
          <div className="w-full py-12 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl text-[#a89279]">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีรูปภาพสไลด์</p>
          </div>
        )}
      </div>
    </div>
  );
}
