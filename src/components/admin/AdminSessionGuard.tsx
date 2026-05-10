"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { expireSessionAction } from "@/app/actions/auth";
import {
  ADMIN_TAB_SESSION_KEY,
  ADMIN_TAB_SESSION_VALUE,
} from "@/lib/admin-tab-session";

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getTabSessionSnapshot() {
  return sessionStorage.getItem(ADMIN_TAB_SESSION_KEY) === ADMIN_TAB_SESSION_VALUE;
}

function getServerSnapshot() {
  return false;
}

export function AdminSessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isVerified = useSyncExternalStore(
    subscribeToStorage,
    getTabSessionSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (isVerified) return;
    if (sessionStorage.getItem(ADMIN_TAB_SESSION_KEY) === ADMIN_TAB_SESSION_VALUE) return;

    let cancelled = false;

    expireSessionAction().finally(() => {
      if (!cancelled) {
        router.replace("/login");
        router.refresh();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isVerified, router]);

  if (!isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf7f0] px-6 text-center">
        <div className="rounded-2xl border border-[#e8e2d6] bg-white p-6 shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#1a3c2a]/20 border-t-[#1a3c2a]" />
          <p className="text-sm font-medium text-[#1a3c2a]">กำลังตรวจสอบความปลอดภัยของเซสชัน</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
