"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface RealtimeRoomSyncProps {
  hotelId: string;
}

/**
 * RealtimeRoomSync
 * Component สำหรับฟังการเปลี่ยนแปลงของห้องพักและประเภทห้องแบบ Realtime
 * และทำการ refresh ข้อมูลในหน้า Landing Page โดยอัตโนมัติ
 */
export default function RealtimeRoomSync({ hotelId }: RealtimeRoomSyncProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    console.log("RealtimeRoomSync: Starting subscription for hotel:", hotelId);

    // 1. ฟังการเปลี่ยนแปลงของตาราง rooms
    const roomsChannel = supabase
      .channel("rooms-realtime-" + hotelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          // filter: "hotel_id=eq." + hotelId, // ลองเอาออกเพื่อเช็คว่า event มาไหม
        },
        (payload) => {
          console.log("RealtimeRoomSync: Room change detected!", payload);
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log("RealtimeRoomSync: Rooms channel status:", status);
      });

    // 2. ฟังการเปลี่ยนแปลงของตาราง room_types
    const roomTypesChannel = supabase
      .channel("room-types-realtime-" + hotelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_types",
          // filter: "hotel_id=eq." + hotelId, // ลองเอาออกเพื่อเช็คว่า event มาไหม
        },
        (payload) => {
          console.log("RealtimeRoomSync: Room type change detected!", payload);
          router.refresh();
        }
      )
      .subscribe((status) => {
        console.log("RealtimeRoomSync: Room types channel status:", status);
      });

    return () => {
      console.log("RealtimeRoomSync: Cleaning up subscriptions");
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(roomTypesChannel);
    };
  }, [hotelId, router, supabase]);

  // Component นี้ไม่แสดงผล UI ใดๆ
  return null;
}
