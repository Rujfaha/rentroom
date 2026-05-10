"use client";

import { useState, useTransition } from "react";
import { updatePromotion, deletePromotion } from "@/app/actions/promotions";
import { Plus, Save, Trash2, Edit2, X, Image as ImageIcon, Calendar, Percent } from "lucide-react";

export function PromotionEditor({ initialPromotions }: { initialPromotions: any[] }) {
  const [promotions, setPromotions] = useState(initialPromotions);
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
    if (!confirm("Are you sure you want to delete this promotion?")) return;
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
            const newPromo = { id: "new", title: "", description: "", image_url: "", discount_text: "", valid_until: "", is_active: true };
            setPromotions([newPromo, ...promotions]);
            setEditingId("new");
          }}
          className="flex items-center px-4 py-2 bg-[#1a3c2a] text-[#faf7f0] rounded-lg hover:bg-[#0f2418] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มโปรโมชั่นใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <div key={promo.id} className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] overflow-hidden flex flex-col relative">
            {editingId === promo.id ? (
              <form onSubmit={(e) => handleSave(e, promo.id)} className="p-5 space-y-4 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">ชื่อโปรโมชั่น *</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={promo.title}
                    required
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">ข้อความส่วนลด (เช่น ลด 20%, ฟรีอาหารเช้า)</label>
                  <input
                    type="text"
                    name="discount_text"
                    defaultValue={promo.discount_text}
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">รายละเอียดเงื่อนไข</label>
                  <textarea
                    name="description"
                    defaultValue={promo.description}
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
                <div>
                  <label className="block text-xs font-medium text-[#8b7355] mb-1">Image URL</label>
                  <input
                    type="url"
                    name="image_url"
                    defaultValue={promo.image_url}
                    className="w-full px-3 py-2 bg-[#faf7f0] border border-[#e8e2d6] rounded-md focus:ring-1 focus:ring-[#1a3c2a] outline-none text-sm"
                    placeholder="https://example.com/promo.jpg"
                  />
                </div>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id={`active-${promo.id}`}
                    name="is_active"
                    defaultChecked={promo.is_active}
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
                    <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" />
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
        ))}

        {promotions.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-[#e8e2d6] rounded-xl text-[#a89279]">
            <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีโปรโมชั่น</p>
          </div>
        )}
      </div>
    </div>
  );
}
