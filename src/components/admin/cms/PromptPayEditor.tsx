"use client";

import { useState, useTransition } from "react";
import { updatePromptPay } from "@/app/actions/cms";
import { Save, QrCode, CheckCircle2, AlertCircle } from "lucide-react";

interface PromptPayData {
  accountId: string;
  accountName: string;
  type: "phone" | "national_id";
}

export function PromptPayEditor({ initialData }: { initialData: PromptPayData }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      setMessage(null);
      const result = await updatePromptPay(formData);
      
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "บันทึกข้อมูลเรียบร้อยแล้ว" });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className={`p-3 text-sm rounded-lg flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
            : "bg-red-50 text-red-600 border border-red-100"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#2c2c2c] mb-1">
          ประเภทบัญชี
        </label>
        <select 
          name="type" 
          defaultValue={initialData.type}
          className="w-full px-3 py-2 bg-white border border-[#e8e2d6] rounded-lg focus:ring-1 focus:ring-[#1a3c2a] focus:border-[#1a3c2a] text-sm outline-none text-[#2c2c2c]"
        >
          <option value="phone">เบอร์โทรศัพท์ (Phone)</option>
          <option value="national_id">เลขบัตรประชาชน / เลขนิติบุคคล</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#2c2c2c] mb-1">
          เลขบัญชี PromptPay
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#a89279]">
            <QrCode className="h-4 w-4" />
          </div>
          <input
            name="accountId"
            type="text"
            defaultValue={initialData.accountId}
            placeholder="0812345678"
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#e8e2d6] rounded-lg focus:ring-1 focus:ring-[#1a3c2a] focus:border-[#1a3c2a] text-sm outline-none text-[#2c2c2c]"
            required
          />
        </div>
        <p className="text-xs text-[#8b7355] mt-1">ไม่ต้องใส่ขีด (-) หรือเว้นวรรค</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#2c2c2c] mb-1">
          ชื่อบัญชีรับเงิน
        </label>
        <input
          name="accountName"
          type="text"
          defaultValue={initialData.accountName}
          placeholder="บจก. วัลเลย์ รีทรีท"
          className="w-full px-3 py-2 bg-white border border-[#e8e2d6] rounded-lg focus:ring-1 focus:ring-[#1a3c2a] focus:border-[#1a3c2a] text-sm outline-none text-[#2c2c2c]"
          required
        />
        <p className="text-xs text-[#8b7355] mt-1">ชื่อที่จะแสดงให้ลูกค้าตรวจสอบก่อนโอน</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#1a3c2a] hover:bg-[#0f2418] text-[#faf7f0] font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 cursor-pointer"
      >
        {isPending ? (
           <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4" />
            บันทึก PromptPay
          </>
        )}
      </button>
    </form>
  );
}
