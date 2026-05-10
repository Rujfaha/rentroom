"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, LogOut, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { ADMIN_TAB_SESSION_KEY } from "@/lib/admin-tab-session";

export function TopHeader() {
  const router = useRouter();
  const [isNoticesOpen, setIsNoticesOpen] = useState(false);
  const noticesRef = useRef<HTMLDivElement>(null);

  // Use state for notices to allow marking them as read
  const [notices, setNotices] = useState([
    {
      id: 1,
      title: "การจองใหม่: Arkkarawin Deluxe",
      time: "5 นาทีที่แล้ว",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      unread: true,
      link: "/admin/bookings",
    },
    {
      id: 2,
      title: "การแจ้งเตือนระบบ: อัปเดตราคาสำเร็จ",
      time: "1 ชั่วโมงที่แล้ว",
      icon: <Info className="w-5 h-5 text-blue-500" />,
      unread: true,
      link: "/admin/cms/settings",
    },
    {
      id: 3,
      title: "ลูกค้ารอยืนยันการโอนเงิน",
      time: "3 ชั่วโมงที่แล้ว",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      unread: false,
      link: "/admin/bookings",
    },
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (noticesRef.current && !noticesRef.current.contains(event.target as Node)) {
        setIsNoticesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNoticeClick = (id: number, link: string) => {
    // Mark as read
    setNotices((prevNotices) =>
      prevNotices.map((notice) =>
        notice.id === id ? { ...notice, unread: false } : notice
      )
    );
    // Close dropdown
    setIsNoticesOpen(false);
    // Navigate to link
    if (link) {
      router.push(link);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_TAB_SESSION_KEY);
  };

  const unreadCount = notices.filter((n) => n.unread).length;

  return (
    <header className="h-16 bg-[#faf7f0] border-b border-[#e8e2d6] flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* Left Spacer for Mobile Menu Toggle */}
      <div className="w-10 md:w-0"></div>

      {/* Search */}
      <div className="flex-1 max-w-md hidden md:flex">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#a89279] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="ค้นหาการจอง, ชื่อลูกค้า, หรือห้องพัก..." 
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#e8e2d6] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#1a3c2a] focus:border-[#1a3c2a] transition-colors text-[#2c2c2c] placeholder-[#c4b9a8]"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-4">
        <div className="relative" ref={noticesRef}>
          <button 
            onClick={() => setIsNoticesOpen(!isNoticesOpen)}
            className={`relative p-2 transition-colors rounded-full cursor-pointer ${isNoticesOpen ? 'bg-[#e8e2d6] text-[#1a3c2a]' : 'text-[#8b7355] hover:text-[#1a3c2a] hover:bg-[#e8e2d6]/50'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-[1.5px] border-[#faf7f0]"></span>
            )}
          </button>

          {/* Dropdown */}
          {isNoticesOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#e8e2d6] rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[#e8e2d6] flex justify-between items-center bg-[#faf7f0]">
                <h3 className="font-serif text-[#1a3c2a] font-medium">การแจ้งเตือน</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-[#1a3c2a] text-white px-2 py-0.5 rounded-full">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {notices.length > 0 ? (
                  notices.map((notice) => (
                    <div 
                      key={notice.id} 
                      onClick={() => handleNoticeClick(notice.id, notice.link)}
                      className={`px-4 py-3 border-b border-[#f0ece4] last:border-0 hover:bg-[#faf7f0] transition-colors cursor-pointer flex gap-3 ${notice.unread ? 'bg-white' : 'bg-[#faf7f0]/40'}`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {notice.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight line-clamp-2 ${notice.unread ? 'font-medium text-[#1a3c2a]' : 'text-[#2c2c2c]'}`}>
                          {notice.title}
                        </p>
                        <p className="text-xs text-[#8b7355] mt-1">
                          {notice.time}
                        </p>
                      </div>
                      {notice.unread && (
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-[#8b7355] text-sm">
                    ไม่มีการแจ้งเตือนใหม่
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-[#e8e2d6] bg-[#faf7f0] text-center">
                <button className="text-xs font-medium text-[#1a3c2a] hover:underline cursor-pointer">
                  ดูการแจ้งเตือนทั้งหมด
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-[#e8e2d6]"></div>

        <form action={logoutAction} onSubmit={handleLogout}>
          <button 
            type="submit" 
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-[#8b7355] hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline uppercase tracking-wide text-xs">ออกจากระบบ</span>
          </button>
        </form>
      </div>
    </header>
  );
}

