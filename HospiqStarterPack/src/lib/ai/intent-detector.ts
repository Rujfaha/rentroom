export function detectStarterIntent(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (!normalized) return "empty";
  if (normalized.includes("ราคา") || normalized.includes("ห้อง")) return "room_inquiry";
  if (normalized.includes("จอง")) return "booking_intent";
  return "general";
}
