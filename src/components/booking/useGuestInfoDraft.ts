"use client";

// ============================================================
// useGuestInfoDraft — จำข้อมูลลูกค้าใน localStorage
// ให้ user กลับมาแก้ข้อมูลได้โดยไม่ต้องกรอกใหม่
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { GuestInfo } from "@/types/landing.types";

const STORAGE_KEY = "booking_guest_draft";
const DEBOUNCE_MS = 400;

export interface GuestInfoDraft {
  fullName: string;
  phone: string;
  email: string;
  specialRequests: string;
}

function readDraft(): GuestInfoDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    return {
      fullName: typeof obj["fullName"] === "string" ? obj["fullName"] : "",
      phone: typeof obj["phone"] === "string" ? obj["phone"] : "",
      email: typeof obj["email"] === "string" ? obj["email"] : "",
      specialRequests: typeof obj["specialRequests"] === "string" ? obj["specialRequests"] : "",
    };
  } catch {
    return null;
  }
}

function writeDraft(draft: GuestInfoDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // localStorage อาจ full หรือ private mode — ไม่ต้อง throw
  }
}

export function clearGuestInfoDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Hook ──────────────────────────────────────────────────

interface UseGuestInfoDraftReturn {
  fullName: string;
  phone: string;
  email: string;
  specialRequests: string;
  setFullName: (v: string) => void;
  setPhone: (v: string) => void;
  setEmail: (v: string) => void;
  setSpecialRequests: (v: string) => void;
  /** เรียกก่อน submit เพื่อล้าง draft ออกจาก localStorage */
  clearDraft: () => void;
  /** ถ้า true แสดงว่าโหลด draft จาก localStorage มาแล้ว (ใช้แสดง hint ได้) */
  hasDraft: boolean;
}

export function useGuestInfoDraft(initialInfo?: GuestInfo | null): UseGuestInfoDraftReturn {
  // อ่าน draft ครั้งแรก (lazy init)
  const [fullName, setFullNameState] = useState<string>(function () {
    const draft = readDraft();
    return initialInfo?.fullName || draft?.fullName || "";
  });
  const [phone, setPhoneState] = useState<string>(function () {
    const draft = readDraft();
    return initialInfo?.phone || draft?.phone || "";
  });
  const [email, setEmailState] = useState<string>(function () {
    const draft = readDraft();
    return initialInfo?.email || draft?.email || "";
  });
  const [specialRequests, setSpecialRequestsState] = useState<string>(function () {
    const draft = readDraft();
    return initialInfo?.specialRequests || draft?.specialRequests || "";
  });

  // hasDraft = มีข้อมูลเดิมใน localStorage (ไม่ใช่ค่าว่างทั้งหมด)
  const [hasDraft] = useState<boolean>(function () {
    const draft = readDraft();
    if (!draft) return false;
    return Boolean(draft.fullName || draft.phone || draft.email);
  });

  // debounce timer ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // auto-save ทุกครั้งที่ field เปลี่ยน (debounce 400ms)
  useEffect(
    function () {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(function () {
        writeDraft({ fullName, phone, email, specialRequests });
      }, DEBOUNCE_MS);
      return function () {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    },
    [fullName, phone, email, specialRequests]
  );

  const clearDraft = useCallback(function () {
    clearGuestInfoDraft();
  }, []);

  return {
    fullName,
    phone,
    email,
    specialRequests,
    setFullName: setFullNameState,
    setPhone: setPhoneState,
    setEmail: setEmailState,
    setSpecialRequests: setSpecialRequestsState,
    clearDraft,
    hasDraft,
  };
}
