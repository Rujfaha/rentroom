"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export function TopHeader() {
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
        <button className="relative p-2 text-[#8b7355] hover:text-[#1a3c2a] transition-colors rounded-full hover:bg-[#e8e2d6]/50 cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#faf7f0]"></span>
        </button>

        <div className="h-6 w-px bg-[#e8e2d6]"></div>

        <form action={logoutAction}>
          <button 
            type="submit" 
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-[#8b7355] hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline uppercase tracking-wide text-xs">Sign Out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
