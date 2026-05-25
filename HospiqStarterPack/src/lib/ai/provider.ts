import type { AiGenerateInput, AiGenerateResult } from "./types";
import { GeminiProvider } from "./providers/gemini";

export interface AiProvider {
  generate(input: AiGenerateInput): Promise<AiGenerateResult>;
}

export function getAiProvider(): AiProvider {
  const provider = getAiProviderName();
  if (provider === "gemini") return new GeminiProvider();
  throw new Error(`Unsupported AI provider: ${provider}`);
}

function getAiProviderName() {
  const raw = (process.env.AI_PROVIDER || "gemini").trim().toLowerCase();
  return raw || "gemini";
}
