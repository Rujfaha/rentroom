"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Image as ImageIcon,
  Tag,
  Landmark,
  Phone,
  Settings,
  Palette,
  ChevronRight,
  Search,
} from "lucide-react";
import { useState } from "react";

const cmsLinks = [
  {
    href: "/admin/cms/hero",
    label: "รูปภาพต้อนรับ",
    subtitle: "สไลด์ต้อนรับ",
    icon: ImageIcon,
  },
  {
    href: "/admin/cms/promotions",
    label: "โปรโมชั่น",
    subtitle: "โปรโมชั่น",
    icon: Tag,
  },
  {
    href: "/admin/cms/attractions",
    label: "สถานที่ท่องเที่ยว",
    subtitle: "สถานที่ท่องเที่ยว",
    icon: Landmark,
  },
  {
    href: "/admin/cms/contacts",
    label: "ข้อมูลติดต่อ",
    subtitle: "ติดต่อและชำระเงิน",
    icon: Phone,
  },
  {
    href: "/admin/cms/settings",
    label: "ตั้งค่าทั่วไป",
    subtitle: "ตั้งค่าทั่วไป",
    icon: Settings,
  },
  {
    href: "/admin/cms/seo",
    label: "SEO",
    subtitle: "Search Engine",
    icon: Search,
  },
];

export function CmsSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOverview = pathname === "/admin/cms";

  return (
    <>
      {/* ── Mobile: Top bar with current section + toggle ── */}
      <div className="lg:hidden">
        {/* Current section header + toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border-b border-[#e8e2d6] cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a3c2a] to-[#2d5a3f] flex items-center justify-center">
              <Palette className="w-4 h-4 text-[#c9a84c]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#1a3c2a]">
                {isOverview
                  ? "จัดการหน้าเว็บ"
                  : cmsLinks.find((l) => pathname.startsWith(l.href))?.label || "CMS"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#8b7355]">
                จัดการเนื้อหา
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-[#8b7355] transition-transform duration-200 ${
              mobileOpen ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Mobile dropdown nav */}
        {mobileOpen && (
          <div className="border-b border-[#e8e2d6] bg-[#faf7f0] px-2 py-2 space-y-0.5">
            {cmsLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[#1a3c2a] text-[#faf7f0]"
                      : "text-[#2c2c2c] hover:bg-white"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? "text-[#c9a84c]" : "text-[#8b7355]"
                    }`}
                  />
                  <span className="text-sm font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Desktop: Side panel ── */}
      <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 bg-white border-r border-[#e8e2d6] self-stretch">
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a3c2a] to-[#2d5a3f] flex items-center justify-center shadow-sm">
              <Palette className="w-4.5 h-4.5 text-[#c9a84c]" />
            </div>
            <div>
              <h2 className="text-[15px] font-serif font-semibold text-[#1a3c2a]">
                จัดการหน้าเว็บ
              </h2>
              <span className="text-[10px] uppercase tracking-[0.15em] text-[#8b7355] font-medium">
                Content Management
              </span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#e8e2d6] to-transparent mx-4" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {cmsLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#1a3c2a] text-[#faf7f0] shadow-sm"
                    : "text-[#2c2c2c] hover:bg-[#faf7f0]"
                }`}
              >
                {/* Active bar */}
                {isActive && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-gradient-to-b from-[#c9a84c] to-[#a0842e]" />
                )}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive
                      ? "bg-white/10"
                      : "bg-[#1a3c2a]/5 group-hover:bg-[#1a3c2a]/10"
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] ${
                      isActive
                        ? "text-[#c9a84c]"
                        : "text-[#8b7355] group-hover:text-[#1a3c2a]"
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <span
                    className={`text-sm block leading-tight ${
                      isActive ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {link.label}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider block mt-0.5 ${
                      isActive ? "text-[#c9a84c]/60" : "text-[#c4b9a8]"
                    }`}
                  >
                    {link.subtitle}
                  </span>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-[#c9a84c]/50 ml-auto flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer hint */}
        <div className="px-5 py-4 border-t border-[#e8e2d6]">
          <p className="text-[11px] text-[#c4b9a8] leading-relaxed">
            แก้ไขเนื้อหาที่นี่จะมีผลกับหน้า Landing Page ของโรงแรมทันที
          </p>
        </div>
      </aside>
    </>
  );
}
