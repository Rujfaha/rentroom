"use client";

import { useRouter } from "next/navigation";

interface RoomBackButtonProps {
  /** "booking" | "app" | undefined — ส่งมาจาก searchParams ?from= */
  from?: string;
  label?: string;
}

export default function RoomBackButton({ from, label }: RoomBackButtonProps) {
  const router = useRouter();

  function handleBack() {
    // ไม่ต้องส่ง query กลับ — booking เก็บ trip state ใน sessionStorage แล้ว
    if (from === "booking") {
      router.push("/booking");
    } else {
      router.push("/");
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-stone-light transition-colors hover:border-gold/60 hover:text-gold"
      aria-label={label ?? "ย้อนกลับ"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
}
