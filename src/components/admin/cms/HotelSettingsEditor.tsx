"use client";

import { useState, useTransition } from "react";
import { updateHotelGeneralSettings } from "@/app/actions/cms";
import { Save, MapPin, AlignLeft, Type } from "lucide-react";

export function HotelSettingsEditor({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateHotelGeneralSettings(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100">
          บันทึกข้อมูลเรียบร้อยแล้ว (หากชื่อโรงแรมไม่เปลี่ยนใน Sidebar ทันที ให้ทำการรีเฟรชหรือล็อกอินใหม่)
        </div>
      )}

      {/* Card 1: Hotel Name */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e2d6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e2d6]/50 bg-[#faf7f0]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a3c2a]/8 flex items-center justify-center">
              <Type className="w-4 h-4 text-[#1a3c2a]" />
            </div>
            <div>
              <h3 className="text-[15px] font-serif font-semibold text-[#1a3c2a]">ชื่อโรงแรม</h3>
              <p className="text-[11px] text-[#8b7355]">แสดงที่หน้าเว็บหลัก และหน้าล็อกอิน</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <input
            type="text"
            name="name"
            defaultValue={initialData?.name || ""}
            required
            className="w-full px-4 py-2.5 bg-white border border-[#e8e2d6] rounded-xl focus:ring-1 focus:ring-[#1a3c2a] focus:border-[#1a3c2a] outline-none transition-colors text-[#2c2c2c] text-sm"
          />
        </div>
      </div>

      {/* Card 2: Description */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e2d6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e2d6]/50 bg-[#faf7f0]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
              <AlignLeft className="w-4 h-4 text-[#a0842e]" />
            </div>
            <div>
              <h3 className="text-[15px] font-serif font-semibold text-[#1a3c2a]">คำอธิบาย</h3>
              <p className="text-[11px] text-[#8b7355]">Tagline สั้นๆ แสดงใต้ชื่อโรงแรม</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <textarea
            name="description"
            rows={3}
            defaultValue={initialData?.description || ""}
            className="w-full px-4 py-2.5 bg-white border border-[#e8e2d6] rounded-xl focus:ring-1 focus:ring-[#1a3c2a] focus:border-[#1a3c2a] outline-none transition-colors text-[#2c2c2c] text-sm resize-y"
            placeholder="เช่น Luxury Mountain Resort in the heart of the valley..."
          />
        </div>
      </div>

      {/* Card 3: Address */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e2d6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e2d6]/50 bg-[#faf7f0]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8b7355]/8 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-[#8b7355]" />
            </div>
            <div>
              <h3 className="text-[15px] font-serif font-semibold text-[#1a3c2a]">ที่อยู่</h3>
              <p className="text-[11px] text-[#8b7355]">ที่อยู่เต็มของโรงแรมสำหรับแผนที่</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <textarea
            name="address"
            rows={3}
            defaultValue={initialData?.address || ""}
            className="w-full px-4 py-2.5 bg-white border border-[#e8e2d6] rounded-xl focus:ring-1 focus:ring-[#1a3c2a] focus:border-[#1a3c2a] outline-none transition-colors text-[#2c2c2c] text-sm resize-y"
            placeholder="ที่อยู่เต็มของโรงแรม..."
          />
        </div>
      </div>

      {/* Save Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e2d6] overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1a3c2a]">บันทึกการเปลี่ยนแปลง</h3>
            <p className="text-xs text-[#8b7355] mt-0.5">ข้อมูลจะมีผลทันทีหลังบันทึก</p>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center justify-center px-6 py-2.5 bg-[#1a3c2a] text-[#faf7f0] rounded-xl hover:bg-[#0f2418] transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer flex-shrink-0"
          >
            <Save className="w-4 h-4 mr-2" />
            {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </form>
  );
}
