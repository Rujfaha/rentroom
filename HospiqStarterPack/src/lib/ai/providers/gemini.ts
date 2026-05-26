import type { AiProvider } from "../provider";
import type { AiEmbeddingResult, AiGenerateInput, AiGenerateResult } from "../types";

interface GeminiTextPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiTextPart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

export class GeminiProvider implements AiProvider {
  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.system }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: input.maxOutputTokens ?? 600,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status} ${await response.text()}`);
    }

    const payload = parseGeminiResponse(await response.json());
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim() || "";

    return { provider: "gemini", model, text };
  }

  async embed(text: string): Promise<AiEmbeddingResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${model}`,
          content: {
            parts: [{ text }],
          },
          outputDimensionality: 768,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini embedding request failed: ${response.status} ${await response.text()}`);
    }

    const payload = await response.json() as { embedding?: { values?: unknown } };
    const values = payload.embedding?.values;
    const embedding = Array.isArray(values) ? values.filter((value): value is number => typeof value === "number") : [];

    return { provider: "gemini", model, embedding };
  }
}

function parseGeminiResponse(value: unknown): GeminiResponse {
  if (!value || typeof value !== "object") return {};
  const candidates = (value as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return {};

  return {
    candidates: candidates.map((candidate) => {
      if (!candidate || typeof candidate !== "object") return {};
      const content = (candidate as { content?: unknown }).content;
      if (!content || typeof content !== "object") return {};
      const parts = (content as { parts?: unknown }).parts;
      if (!Array.isArray(parts)) return { content: { parts: [] } };
      return {
        content: {
          parts: parts.map((part) => {
            if (!part || typeof part !== "object") return {};
            const text = (part as { text?: unknown }).text;
            return typeof text === "string" ? { text } : {};
          }),
        },
      };
    }),
  };
}
