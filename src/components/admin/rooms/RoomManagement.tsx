"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BedDouble,
  CheckCircle2,
  Users,
  Wrench,
  LayoutGrid,
  List,
} from "lucide-react";
import { RoomTypeSection } from "./RoomTypeSection";
import { RoomSection } from "./RoomSection";
import { getAdminRooms } from "@/app/actions/rooms";
import { createClient } from "@/lib/supabase/client";
import type { AdminRoom, AdminRoomType } from "./types";

interface RoomManagementProps {
  hotelId: string;
  initialRoomTypes: AdminRoomType[];
  initialRooms: AdminRoom[];
}

export function RoomManagement({ hotelId, initialRoomTypes, initialRooms }: RoomManagementProps) {
  const [roomTypes, setRoomTypes] = useState(Array.isArray(initialRoomTypes) ? initialRoomTypes : []);
  const [rooms, setRooms] = useState(Array.isArray(initialRooms) ? initialRooms : []);
  const [activeTab, setActiveTab] = useState<"types" | "rooms">("types");
  const supabase = useMemo(() => createClient(), []);

  const refreshRooms = useCallback(async () => {
    const result = await getAdminRooms();
    if (result.success && result.data) {
      setRooms(Array.isArray(result.data) ? result.data : []);
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-rooms-" + hotelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: "hotel_id=eq." + hotelId,
        },
        () => {
          refreshRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, supabase, refreshRooms]);

  const stats = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter((r) => r.status === "available").length;
    const occupied = rooms.filter((r) => r.status === "occupied").length;
    const maintenance = rooms.filter(
      (r) => r.status === "maintenance" || r.status === "out_of_order"
    ).length;
    return { total, available, occupied, maintenance };
  }, [rooms]);

  const statCards = [
    {
      label: "ห้องพักทั้งหมด",
      value: stats.total,
      icon: BedDouble,
      color: "text-[#1a3c2a]",
      bg: "bg-[#1a3c2a]/5",
      iconBg: "bg-[#1a3c2a]/10",
    },
    {
      label: "ว่าง",
      value: stats.available,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
    },
    {
      label: "มีผู้เข้าพัก",
      value: stats.occupied,
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
    },
    {
      label: "ซ่อมบำรุง",
      value: stats.maintenance,
      icon: Wrench,
      color: "text-red-600",
      bg: "bg-red-50",
      iconBg: "bg-red-100",
    },
  ];

  const tabs = [
    { key: "types" as const, label: "ประเภทห้อง", icon: LayoutGrid, count: roomTypes.length },
    { key: "rooms" as const, label: "ห้องพักทั้งหมด", icon: List, count: rooms.length },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`${card.bg} rounded-xl p-4 border border-white/60`}
            >
              <div className="flex items-center gap-3">
                <div className={`${card.iconBg} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1a3c2a]">{card.value}</p>
                  <p className="text-xs text-[#8b7355] font-medium">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#e8e2d6]">
        <div className="flex gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer
                  ${isActive
                    ? "text-[#1a3c2a] border-b-2 border-[#c9a84c]"
                    : "text-[#8b7355] hover:text-[#1a3c2a] border-b-2 border-transparent"
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                    isActive
                      ? "bg-[#1a3c2a] text-white"
                      : "bg-[#f0ece4] text-[#8b7355]"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "types" ? (
        <RoomTypeSection
          roomTypes={roomTypes}
          rooms={rooms}
          onRoomTypesChange={setRoomTypes}
          onRoomsChange={setRooms}
        />
      ) : (
        <RoomSection
          rooms={rooms}
          roomTypes={roomTypes}
          onRoomsChange={setRooms}
        />
      )}
    </div>
  );
}
