"use client";

import { useState } from "react";
import { ContactEditor, type CmsContactRow } from "./ContactEditor";
import { PromptPayEditor } from "./PromptPayEditor";
import { Phone, QrCode } from "lucide-react";

interface ContactsTabsProps {
  contacts: CmsContactRow[];
  promptpay: {
    accountId: string;
    accountName: string;
    type: "phone" | "national_id";
  };
}

export function ContactsTabs({ contacts, promptpay }: ContactsTabsProps) {
  const [activeTab, setActiveTab] = useState<"contacts" | "promptpay">("contacts");

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-[#f0ece4] rounded-xl">
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            activeTab === "contacts"
              ? "bg-white text-[#1a3c2a] shadow-sm"
              : "text-[#8b7355] hover:text-[#1a3c2a] hover:bg-white/50"
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>ช่องทางการติดต่อ</span>
        </button>
        <button
          onClick={() => setActiveTab("promptpay")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            activeTab === "promptpay"
              ? "bg-white text-[#1a3c2a] shadow-sm"
              : "text-[#8b7355] hover:text-[#1a3c2a] hover:bg-white/50"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>บัญชีรับชำระเงิน</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e8e2d6] overflow-hidden">
        {activeTab === "contacts" ? (
          <div className="p-5 md:p-6">
            <div className="mb-4">
              <h2 className="text-base font-serif font-semibold text-[#1a3c2a]">ช่องทางการติดต่อ</h2>
              <p className="text-xs text-[#8b7355] mt-0.5">จัดการเบอร์โทร โซเชียลมีเดีย และแผนที่บนหน้า Landing Page</p>
            </div>
            <ContactEditor initialContacts={contacts} />
          </div>
        ) : (
          <div className="p-5 md:p-6">
            <div className="mb-4">
              <h2 className="text-base font-serif font-semibold text-[#1a3c2a]">บัญชีรับชำระเงิน</h2>
              <p className="text-xs text-[#8b7355] mt-0.5">ตั้งค่าเลขบัญชีและชื่อผู้รับเงินสำหรับสร้าง QR Code ชำระเงิน</p>
            </div>
            <PromptPayEditor initialData={promptpay} />
          </div>
        )}
      </div>
    </div>
  );
}
