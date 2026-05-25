import type { StarterAiIntent } from "./types";

export function detectStarterIntent(message: string): StarterAiIntent {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return "empty";
  if (normalized.includes("admin") || normalized.includes("staff")) return "handoff_request";
  if (normalized.includes("เธฃเธฒเธเธฒ") || normalized.includes("เธซเนเธญเธ")) return "room_inquiry";
  if (normalized.includes("เธเธญเธ")) return "booking_intent";
  return "general";
}
