"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Settings,
  Image as ImageIcon,
  Tag,
  MoreHorizontal,
  X,
  Crown,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useEffect, useState } from "react";
import type { SessionPayload } from "@/lib/session";
import { ADMIN_TAB_SESSION_KEY } from "@/lib/admin-tab-session";

interface BottomNavProps {
  session: SessionPayload | null;
}

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function BottomNav({ session }: BottomNavProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isAdmin = session?.role === "admin" || session?.role === "super_admin";

  // Main tabs always visible at bottom
  const mainTabs: NavLink[] = [
    { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
    { href: "/admin/bookings", label: "การจอง", icon: CalendarDays },
    { href: "/admin/rooms", label: "ห้องพัก", icon: BedDouble },
  ];

  if (isAdmin) {
    mainTabs.push({ href: "/admin/promotions", label: "โปรโมชั่น", icon: Tag });
  }

  // Items shown inside the "More" bottom sheet
  const moreItems: NavLink[] = isAdmin
    ? [
        { href: "/admin/cms", label: "จัดการหน้าเว็บ", icon: ImageIcon },
        { href: "/admin/pricing", label: "ราคา & ฤดูกาล", icon: Settings },
      ]
    : [];

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));

  // Highlight the "More" tab when current page is one of the items inside it
  const isMoreActive = moreItems.some((item) => isActive(item.href));

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isMoreOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMoreOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_TAB_SESSION_KEY);
  };

  return (
    <>
      {/* Bottom Sheet (Mobile only) */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet panel */}
          <div
            className="relative w-full bg-[#faf7f0] rounded-t-2xl shadow-2xl border-t border-[#e8e2d6] animate-slide-up"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            role="dialog"
            aria-modal="true"
          >
            {/* Gold accent line */}
            <div className="h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <span className="block w-10 h-1 rounded-full bg-[#c4b9a8]/60" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <h3 className="font-serif text-[#1a3c2a] text-base font-semibold tracking-wide">
                เมนูเพิ่มเติม
              </h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full text-[#8b7355] hover:text-[#1a3c2a] hover:bg-[#e8e2d6]/60 transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User card */}
            <div className="mx-4 mb-3 p-3 rounded-xl bg-white border border-[#e8e2d6] flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#c9a84c]/30 to-[#8b7355]/20 border border-[#c9a84c]/30 flex items-center justify-center text-[#1a3c2a] font-semibold text-base flex-shrink-0">
                {session?.fullName?.charAt(0) || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#2c2c2c] truncate">
                  {session?.fullName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Crown className="w-3 h-3 text-[#c9a84c]" />
                  <p className="text-[11px] text-[#8b7355] capitalize">
                    {session?.role.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items grid */}
            {moreItems.length > 0 && (
              <div className="px-4 pb-2">
                <p className="px-1 mb-2 text-[10px] uppercase tracking-[0.2em] text-[#8b7355]/70 font-semibold">
                  เมนู
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {moreItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        className={`
                          flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200
                          ${
                            active
                              ? "bg-[#1a3c2a]/[0.04] border-[#c9a84c]/40 text-[#1a3c2a]"
                              : "bg-white border-[#e8e2d6] text-[#5c4a35] hover:border-[#c9a84c]/30 hover:bg-[#faf7f0] active:scale-[0.98]"
                          }
                        `}
                      >
                        <span
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            active
                              ? "bg-[#c9a84c]/15"
                              : "bg-[#faf7f0] border border-[#e8e2d6]"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              active ? "text-[#c9a84c]" : "text-[#8b7355]"
                            }`}
                          />
                        </span>
                        <span className="text-xs font-medium tracking-wide">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Logout */}
            <div className="px-4 pt-3">
              <form action={logoutAction} onSubmit={handleLogout}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-[#e8e2d6] text-[#8b7355] font-medium text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors active:scale-[0.99]"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="uppercase tracking-wider text-xs">ออกจากระบบ</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar (Mobile only) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf7f0]/95 backdrop-blur-md border-t border-[#e8e2d6] shadow-[0_-4px_12px_-6px_rgba(15,31,23,0.12)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="แถบนำทางหลัก"
      >
        {/* Subtle gold accent line on top */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c]/40 to-transparent" />

        <div className="flex items-stretch justify-around px-1 pt-1.5 pb-1">
          {mainTabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors active:scale-[0.96]"
              >
                {/* Top active indicator */}
                <span
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200 ${
                    active
                      ? "w-8 bg-gradient-to-r from-[#c9a84c] to-[#e0c878]"
                      : "w-0 bg-transparent"
                  }`}
                />
                <Icon
                  className={`w-[22px] h-[22px] transition-colors ${
                    active ? "text-[#1a3c2a]" : "text-[#8b7355]"
                  }`}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                <span
                  className={`text-[10.5px] leading-tight tracking-tight transition-colors ${
                    active
                      ? "text-[#1a3c2a] font-semibold"
                      : "text-[#8b7355] font-medium"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isMoreOpen}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-colors active:scale-[0.96]"
          >
            <span
              className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200 ${
                isMoreActive || isMoreOpen
                  ? "w-8 bg-gradient-to-r from-[#c9a84c] to-[#e0c878]"
                  : "w-0 bg-transparent"
              }`}
            />
            <MoreHorizontal
              className={`w-[22px] h-[22px] transition-colors ${
                isMoreActive || isMoreOpen ? "text-[#1a3c2a]" : "text-[#8b7355]"
              }`}
              strokeWidth={isMoreActive || isMoreOpen ? 2.2 : 1.8}
            />
            <span
              className={`text-[10.5px] leading-tight tracking-tight transition-colors ${
                isMoreActive || isMoreOpen
                  ? "text-[#1a3c2a] font-semibold"
                  : "text-[#8b7355] font-medium"
              }`}
            >
              เพิ่มเติม
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
