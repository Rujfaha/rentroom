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
  Crown,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { SessionPayload } from "@/lib/session";
import { ADMIN_TAB_SESSION_KEY } from "@/lib/admin-tab-session";

interface SidebarProps {
  session: SessionPayload | null;
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname();

  // Filter links based on role
  const isAdmin = session?.role === "admin" || session?.role === "super_admin";

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_TAB_SESSION_KEY);
  };

  const links = [
    { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, show: true },
    { href: "/admin/bookings", label: "การจอง", icon: CalendarDays, show: true },
    { href: "/admin/rooms", label: "ห้องพัก", icon: BedDouble, show: true },
    { href: "/admin/promotions", label: "โปรโมชั่น", icon: Tag, show: isAdmin },
    { href: "/admin/cms", label: "จัดการหน้าเว็บ", icon: ImageIcon, show: isAdmin },
    { href: "/admin/pricing", label: "ราคา & ฤดูกาล", icon: Settings, show: isAdmin },
  ].filter(link => link.show);

  return (
    <aside
      className="
        hidden md:flex sticky top-0 left-0 h-screen w-[272px] z-40
        flex-col flex-shrink-0
        bg-gradient-to-b from-[#0f1f17] via-[#142b1f] to-[#0d1a12]
        text-[#c4b9a8] shadow-2xl
      "
    >
      {/* Gold accent top line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-[#c9a84c]/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a84c] to-[#a0842e] flex items-center justify-center shadow-lg shadow-[#c9a84c]/20 mr-3 flex-shrink-0">
          <BuildingIcon className="w-5 h-5 text-[#0f1f17]" />
        </div>
        <div className="truncate">
          <span className="font-serif text-[#faf7f0] text-base tracking-wide block truncate">
            {session?.hotelName || "Arkkarawin"}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#c9a84c]/60 font-medium">จัดการ</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
        <p className="px-3 mb-3 text-[10px] uppercase tracking-[0.2em] text-[#8b7355]/60 font-semibold">เมนู</p>
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(`${link.href}/`));
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                relative flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-[#c9a84c]/10 text-[#c9a84c]'
                  : 'hover:bg-white/[0.04] hover:text-[#faf7f0]'}
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[#e0c878] to-[#c9a84c]" />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-[#c9a84c]/15'
                  : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
              }`}>
                <Icon className={`w-[18px] h-[18px] transition-colors duration-200 ${isActive ? 'text-[#c9a84c]' : 'text-[#8b7355] group-hover:text-[#f5e6c8]'}`} />
              </div>
              <span className={`text-sm transition-colors duration-200 ${isActive ? 'font-semibold' : 'font-medium'}`}>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Area */}
      <div className="mx-3 mb-3">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-[#c9a84c]/10">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c9a84c]/30 to-[#8b7355]/20 border border-[#c9a84c]/20 flex items-center justify-center text-[#c9a84c] font-semibold text-sm shadow-inner flex-shrink-0">
              {session?.fullName?.charAt(0) || "U"}
            </div>
            <div className="ml-3 truncate flex-1">
              <p className="text-sm font-medium text-[#faf7f0] truncate">{session?.fullName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Crown className="w-3 h-3 text-[#c9a84c]/50" />
                <p className="text-[11px] text-[#a89279] capitalize">{session?.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
          <form action={logoutAction} onSubmit={handleLogout} className="mt-3 pt-3 border-t border-[#c9a84c]/10">
            <button
              type="submit"
              className="flex items-center w-full px-2 py-1.5 text-xs text-[#8b7355] hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/5 font-medium"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              <span className="uppercase tracking-wider">ออกจากระบบ</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  )
}
