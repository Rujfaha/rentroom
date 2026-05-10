"use client";

import { useState, useTransition } from "react";
import { Save, Search, Globe, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { updateSeoSettings } from "@/app/actions/cms";

type SeoSettings = {
  siteName?: string;
  titleTemplate?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  ogImageUrl?: string;
  canonicalBaseUrl?: string;
  googleSiteVerification?: string;
  allowIndex?: boolean;
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#1a3c2a]">{label}</span>
      <span className="block text-xs text-[#8b7355] mt-0.5 mb-2">{hint}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full px-4 py-2.5 bg-white border border-[#e8e2d6] rounded-xl focus:ring-1 focus:ring-[#1a3c2a] focus:border-[#1a3c2a] outline-none transition-colors text-[#2c2c2c] text-sm";

export function SeoSettingsEditor({ initialData }: { initialData: SeoSettings }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateSeoSettings(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100">บันทึกการตั้งค่า SEO เรียบร้อยแล้ว</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e2d6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e2d6]/50 bg-[#faf7f0]/50 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1a3c2a]/8 flex items-center justify-center">
            <Search className="w-4 h-4 text-[#1a3c2a]" />
          </div>
          <div>
            <h3 className="text-[15px] font-serif font-semibold text-[#1a3c2a]">ข้อมูล SEO หลัก</h3>
            <p className="text-[11px] text-[#8b7355]">ปล่อยว่างได้ ระบบจะสร้างจากข้อมูลที่พักอัตโนมัติ</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <Field label="ชื่อเว็บไซต์" hint="ใช้เป็นชื่อแบรนด์ในผลการค้นหา">
            <input name="siteName" defaultValue={initialData.siteName || ""} className={inputClass} />
          </Field>
          <Field label="รูปแบบ Title" hint="ใช้ %s แทนชื่อหน้าปัจจุบัน เช่น %s | ชื่อที่พัก">
            <input name="titleTemplate" defaultValue={initialData.titleTemplate || ""} className={inputClass} placeholder="%s | ชื่อที่พัก" />
          </Field>
          <Field label="Meta Title หลัก" hint="แนะนำไม่เกิน 60 ตัวอักษร">
            <input name="metaTitle" defaultValue={initialData.metaTitle || ""} className={inputClass} />
          </Field>
          <Field label="Meta Description หลัก" hint="แนะนำประมาณ 120-160 ตัวอักษร">
            <textarea name="metaDescription" defaultValue={initialData.metaDescription || ""} rows={3} className={`${inputClass} resize-y`} />
          </Field>
          <Field label="Keywords" hint="คั่นด้วย comma เช่น ที่พัก, ห้องพัก, จองที่พัก">
            <textarea name="keywords" defaultValue={initialData.keywords || ""} rows={2} className={`${inputClass} resize-y`} />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e2d6] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e8e2d6]/50 bg-[#faf7f0]/50 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#a0842e]" />
          </div>
          <div>
            <h3 className="text-[15px] font-serif font-semibold text-[#1a3c2a]">Technical SEO</h3>
            <p className="text-[11px] text-[#8b7355]">Canonical, indexing และการยืนยัน Google</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Canonical Base URL" hint="โดเมนหลัก เช่น https://example.com">
            <input name="canonicalBaseUrl" defaultValue={initialData.canonicalBaseUrl || ""} className={inputClass} />
          </Field>
          <Field label="Open Graph Image" hint="รูปที่ใช้เวลาแชร์ลิงก์ ถ้าไม่ใส่ระบบจะใช้รูปที่พัก">
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b7355]" />
              <input name="ogImageUrl" defaultValue={initialData.ogImageUrl || ""} className={`${inputClass} pl-10`} />
            </div>
          </Field>
          <Field label="Google Site Verification" hint="ใส่ token จาก Google Search Console">
            <input name="googleSiteVerification" defaultValue={initialData.googleSiteVerification || ""} className={inputClass} />
          </Field>
          <label className="flex items-center gap-3 rounded-xl border border-[#e8e2d6] px-4 py-3">
            <input type="checkbox" name="allowIndex" defaultChecked={initialData.allowIndex !== false} className="h-4 w-4 rounded border-[#8b7355] text-[#1a3c2a]" />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-[#1a3c2a]">
                <ShieldCheck className="w-4 h-4 text-[#1a3c2a]" />
                อนุญาตให้ Google index หน้าเว็บไซต์
              </span>
              <span className="block text-xs text-[#8b7355] mt-0.5">ปิดเฉพาะช่วงยังไม่พร้อมเผยแพร่เว็บไซต์</span>
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e2d6] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1a3c2a]">บันทึกการตั้งค่า</h3>
          <p className="text-xs text-[#8b7355] mt-0.5">ระบบจะ revalidate หน้า public ที่เกี่ยวข้องหลังบันทึก</p>
        </div>
        <button type="submit" disabled={isPending} className="flex items-center justify-center px-6 py-2.5 bg-[#1a3c2a] text-[#faf7f0] rounded-xl hover:bg-[#0f2418] transition-colors disabled:opacity-50 text-sm font-medium cursor-pointer">
          <Save className="w-4 h-4 mr-2" />
          {isPending ? "กำลังบันทึก..." : "บันทึก SEO"}
        </button>
      </div>
    </form>
  );
}
