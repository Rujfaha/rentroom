import Link from "next/link";
import {
  Image as ImageIcon,
  Tag,
  Landmark,
  Phone,
  Settings,
  ArrowRight,
  MousePointerClick,
} from "lucide-react";

export const metadata = {
  title: "CMS | จัดการหน้าเว็บไซต์",
};

const cmsSections = [
  {
    title: "รูปภาพต้อนรับ",
    subtitle: "สไลด์ต้อนรับ",
    description: "จัดการรูปภาพสไลด์และข้อความต้อนรับด้านบนสุดของเว็บ",
    icon: ImageIcon,
    href: "/admin/cms/hero",
    color: "text-[#1a3c2a]",
    bg: "bg-[#1a3c2a]/6",
  },
  {
    title: "โปรโมชั่น",
    subtitle: "โปรโมชั่น",
    description: "จัดการโปรโมชั่น ส่วนลด และดีลพิเศษต่างๆ",
    icon: Tag,
    href: "/admin/cms/promotions",
    color: "text-[#a0842e]",
    bg: "bg-[#c9a84c]/8",
  },
  {
    title: "สถานที่ท่องเที่ยว",
    subtitle: "สถานที่ท่องเที่ยว",
    description: "จัดการสถานที่ท่องเที่ยวใกล้โรงแรม ระยะทาง และแผนที่",
    icon: Landmark,
    href: "/admin/cms/attractions",
    color: "text-[#1a3c2a]",
    bg: "bg-[#1a3c2a]/6",
  },
  {
    title: "ข้อมูลติดต่อ",
    subtitle: "ติดต่อและชำระเงิน",
    description: "เบอร์โทร, โซเชียลมีเดีย, แผนที่ และข้อมูลบัญชี PromptPay",
    icon: Phone,
    href: "/admin/cms/contacts",
    color: "text-[#1a3c2a]",
    bg: "bg-[#1a3c2a]/6",
  },
  {
    title: "ตั้งค่าทั่วไป",
    subtitle: "ตั้งค่าทั่วไป",
    description: "ชื่อโรงแรม, คำอธิบายสั้นๆ, และที่อยู่ของโรงแรม",
    icon: Settings,
    href: "/admin/cms/settings",
    color: "text-[#8b7355]",
    bg: "bg-[#8b7355]/6",
  },
];

export default function CmsOverviewPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome header */}
      <div className="text-center py-8 md:py-12">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a3c2a] to-[#2d5a3f] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#1a3c2a]/10">
          <MousePointerClick className="w-7 h-7 text-[#c9a84c]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-serif text-[#1a3c2a] mb-2">
          เลือกหัวข้อที่ต้องการจัดการ
        </h1>
        <p className="text-sm text-[#8b7355] max-w-md mx-auto leading-relaxed">
          เลือกเมนูทางด้านซ้าย หรือคลิกการ์ดด้านล่างเพื่อจัดการเนื้อหาบนหน้า Landing Page ของโรงแรม
        </p>
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cmsSections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <Link
              key={idx}
              href={section.href}
              className="group flex items-start gap-4 p-4 md:p-5 bg-white rounded-xl border border-[#e8e2d6] hover:border-[#c9a84c]/30 hover:shadow-md hover:shadow-[#c9a84c]/5 transition-all duration-200 cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}
              >
                <Icon className={`w-5 h-5 ${section.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-[#1a3c2a] group-hover:text-[#0f2418] transition-colors">
                    {section.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-[#c4b9a8] group-hover:text-[#c9a84c] transition-all duration-200 group-hover:translate-x-0.5 flex-shrink-0 ml-2" />
                </div>
                <p className="text-xs text-[#8b7355] mt-1 line-clamp-2 leading-relaxed">
                  {section.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
