import type { SupportedLineLanguage } from "@/types/line-ai.types";

const THAI_PATTERN = /[\u0E00-\u0E7F]/;
const ARABIC_PATTERN = /[\u0600-\u06FF]/;
const JAPANESE_PATTERN = /[\u3040-\u30FF]/;
const CJK_PATTERN = /[\u4E00-\u9FFF]/;
const SPANISH_PATTERN = /[¿¡ñáéíóúü]|\b(hola|habitaci[oó]n|mañana|precio|pagar|reserva|disponible)\b/i;
const ENGLISH_PATTERN = /[a-z]/i;

export function detectLineLanguage(message: string): SupportedLineLanguage {
  if (THAI_PATTERN.test(message)) return "th";
  if (ARABIC_PATTERN.test(message)) return "ar";
  if (JAPANESE_PATTERN.test(message)) return "ja";
  if (CJK_PATTERN.test(message)) return "zh";
  if (SPANISH_PATTERN.test(message)) return "es";
  if (ENGLISH_PATTERN.test(message)) return "en";
  return "th";
}
