import { DEFAULT_AI_PROVIDER } from "../../constants/line-ai";
import type { AiGenerateInput, AiGenerateResult, AiProviderName } from "@/types/line-ai.types";
import { GeminiProvider } from "./providers/gemini";

export interface AiProvider {
  generate(input: AiGenerateInput): Promise<AiGenerateResult>;
}

export function getAiProvider(): AiProvider {
  const provider = getAiProviderName();
  if (provider === "gemini") return new GeminiProvider();
  throw new Error(`Unsupported AI provider: ${provider}`);
}

function getAiProviderName(): AiProviderName {
  const raw = (process.env.AI_PROVIDER || DEFAULT_AI_PROVIDER).trim().toLowerCase();
  if (raw === "gemini" || raw === "openai" || raw === "groq") return raw;
  return DEFAULT_AI_PROVIDER;
}
