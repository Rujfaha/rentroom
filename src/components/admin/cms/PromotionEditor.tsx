"use client";

import { useRef, useState, useTransition } from "react";
import { updatePromotion, deletePromotion } from "@/app/actions/promotions";
import { Plus, Save, Trash2, Edit2, Link, Upload, X, Calendar, Percent } from "lucide-react";
import type { CmsPromotion } from "./content-editor-types";

function PromotionImageInput({ defaultUrl, isSaving }: { defaultUrl: string; isSaving?: boolean }) {
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
    fd.append("folder", "promotions");

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
    fd.append("folder", "promotions");

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
      setUploadError("ไม่สามารถดาวน์โหลดรูปภาพจาก URL นี้ได้");
      setPreview(imageUrl);
    }
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name="image_url" value={imageUrl ?? ""} />

      <label className="block text-xs font-medium text-[#8b7355] mb-1">รูปภาพโปรโมชั่น</label>

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
        <div key="promotion-image-url" className="space-y-2">
          <input
            key="promotion-image-url-input"
            type="text"
            value={tempUrl ?? ""}
            onChange={(e) => setTempUrl(e.target.value)}
            disabled={uploading}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm disabled:opacity-60"
            placeholder="https://example.com/promo.jpg"
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
        <div key="promotion-image-upload">
          <input
            key="promotion-image-file-input"
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
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
        </div>
      )}

      {preview && !isSaving && (
        <div className="relative mt-2 rounded-lg overflow-hidden border border-[#e8e2d6] h-28">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => {
              setImageUrl("");
              setPreview("");
              setTempUrl("");
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

function DiscountFields({ promo }: { promo: CmsPromotion }) {
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    promo.discount_type === "fixed" ? "fixed" : "percent"
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">รูปแบบส่วนลด</label>
          <select
            name="discount_type"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value === "fixed" ? "fixed" : "percent")}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
          >
            <option value="percent">เปอร์เซ็นต์ (%)</option>
            <option value="fixed">ราคา (บาท)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">รหัสส่วนลด</label>
          <input
            type="text"
            name="discount_code"
            defaultValue={promo.discount_code ?? ""}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm uppercase"
            placeholder="เช่น SUMMER10"
          />
        </div>
      </div>

      {discountType === "percent" ? (
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">ลดแบบเปอร์เซ็นต์ (%)</label>
          <input
            type="number"
            name="discount_percentage"
            min="0"
            max="100"
            step="0.01"
            defaultValue={promo.discount_percentage ?? ""}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
            placeholder="เช่น 10"
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-[#8b7355] mb-1">ลดเป็นราคา (บาท)</label>
          <input
            type="number"
            name="discount_amount"
            min="0"
            step="0.01"
            defaultValue={promo.discount_amount ?? ""}
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
            placeholder="เช่น 500"
          />
        </div>
      )}
    </>
  );
}

export function PromotionEditor({ initialPromotions }: { initialPromotions: CmsPromotion[] }) {
  const [promotions, setPromotions] = useState(initialPromotions ?? []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("id", id);
    
    const isActive = (e.currentTarget.elements.namedItem("is_active") as HTMLInputElement).checked;
    formData.set("is_active", isActive.toString());

    startTransition(async () => {
      const result = await updatePromotion(formData);
      if (!result.error) {
        setEditingId(null);
        window.location.reload(); 
      } else {
        alert(result.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("แน่ใจหรือไม่ว่าต้องการลบโปรโมชั่นนี้?")) return;
    startTransition(async () => {
      const result = await deletePromotion(id);
      if (!result.error) {
        setPromotions(promotions.filter((p) => p.id !== id));
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
            const newPromo: CmsPromotion = { id: "new", title: "", description: "", image_url: "", discount_type: "percent", discount_percentage: "", discount_amount: "", discount_code: "", discount_text: "", valid_until: "", is_active: true };
            setPromotions([newPromo, ...promotions]);
            setEditingId("new");
          }}
          className="flex items-center px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มโปรโมชั่นใหม่
        </button>
      </div>

      <div className="flex flex-wrap -mx-3">
        {promotions.map((promo) => (
          <div key={promo.id} className={`w-full md:w-1/2 xl:w-1/3 px-3 mb-6 ${editingId !== null && editingId !== promo.id ? 'self-start' : ''}`}>
            <div className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] overflow-hidden flex flex-col relative h-full">
            {editingId === promo.id ? (
              <form onSubmit={(e) => handleSave(e, promo.id)} className="p-5 space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">ชื่อโปรโมชั่น *</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={promo.title ?? ""}
                    required
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">ข้อความส่วนลด (เช่น ลด 20%, ฟรีอาหารเช้า)</label>
                  <input
                    type="text"
                    name="discount_text"
                    defaultValue={promo.discount_text ?? ""}
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <DiscountFields promo={promo} />
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">รายละเอียดเงื่อนไข</label>
                  <textarea
                    name="description"
                    defaultValue={promo.description ?? ""}
                    rows={2}
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">วันหมดอายุ (Valid Until)</label>
                  <input
                    type="date"
                    name="valid_until"
                    defaultValue={promo.valid_until ? promo.valid_until.split('T')[0] : ""}
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <PromotionImageInput defaultUrl={promo.image_url || ""} isSaving={isPending} />
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id={`active-${promo.id}`}
                    name="is_active"
                    defaultChecked={promo.is_active !== false}
                    className="w-4 h-4 text-[#1a3c2a] rounded border-[#e8e2d6] focus:ring-[#1a3c2a]"
                  />
                  <label htmlFor={`active-${promo.id}`} className="ml-2 text-sm text-[#2c2c2c]">เปิดใช้งานโปรโมชั่นนี้</label>
                </div>

                <div className="flex justify-end gap-2 mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (promo.id === "new") setPromotions(promotions.filter((p) => p.id !== "new"));
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
                {promo.image_url && (
                  <div className="h-32 bg-slate-100 overflow-hidden shrink-0 border-b border-[#e8e2d6]">
                    <img src={promo.image_url} alt={promo.title || ""} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-[#1a3c2a] text-lg leading-tight">{promo.title || "ไม่มีชื่อ"}</h3>
                    {!promo.is_active && (
                      <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ml-2">ซ่อนอยู่</span>
                    )}
                  </div>
                  
                  {promo.discount_text && (
                    <div className="flex items-center text-[#2d5a3f] text-sm font-bold mb-2">
                      <Percent className="w-3.5 h-3.5 mr-1" />
                      {promo.discount_text}
                    </div>
                  )}
                  {promo.discount_code && (
                    <div className="text-xs text-[#1a3c2a] bg-[#1a3c2a]/5 border border-[#1a3c2a]/10 rounded-md px-2 py-1 mb-2 w-fit">
                      รหัส: {promo.discount_code}
                    </div>
                  )}

                  <p className="text-sm text-[#8b7355] line-clamp-3 mb-4">{promo.description || "-"}</p>
                  
                  {promo.valid_until && (
                    <div className="flex items-center text-[#c9a84c] text-xs font-medium mb-2 mt-auto">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      ใช้ได้ถึง: {new Date(promo.valid_until).toLocaleDateString('th-TH')}
                    </div>
                  )}

                  <div className="flex justify-between mt-auto pt-4 border-t border-[#e8e2d6]">
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(promo.id)}
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

        {promotions.length === 0 && (
          <div className="w-full py-12 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl text-[#a89279]">
            <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีโปรโมชั่น</p>
          </div>
        )}
      </div>
    </div>
  );
}
