"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RoomTopBookCtaProps {
  roomId: string;
  /** ถ้า true จะ disabled (ห้องเต็ม) */
  disabled?: boolean;
}

/**
 * ปุ่ม "จองห้องพัก" ด้านบนของหน้า /rooms/[id]
 * ใช้ flow sync เดียวกับ BookingWidget — push ?addRoom=<id>&qty=1
 * (trip state อยู่ใน sessionStorage ที่ booking เป็นเจ้าของ)
 */
export default function RoomTopBookCta({ roomId, disabled }: RoomTopBookCtaProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  function handleClick() {
    if (disabled || isNavigating) return;
    setIsNavigating(true);
    const params = new URLSearchParams({
      addRoom: roomId,
      qty: "1",
    });
    router.push("/booking?" + params.toString());
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isNavigating}
      className={
        "flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-colors " +
        (disabled
          ? "bg-stone-light/30 text-stone-light/60 cursor-not-allowed"
          : "bg-gold text-white hover:bg-gold-dark cursor-pointer")
      }
    >
      {isNavigating ? (
        <span
          className="h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
          aria-hidden="true"
        />
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )}
      <span>{isNavigating ? "กำลังโหลด..." : disabled ? "ห้องเต็ม" : "จองห้องเพิ่ม"}</span>
    </button>
  );
}
