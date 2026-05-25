import type { GenerateHospiqReplyResult, StarterAiIntent } from "./types";
import { generateHospiqReply } from "./orchestrator";
import { getHotelAIContext } from "./hotel-context";

export interface AiTestcaseExpectation {
  expectedIntent?: StarterAiIntent;
  expectedBehavior?: string | null;
  mustInclude?: string[];
  mustNotInclude?: string[];
}

export interface AiEvaluationResult {
  passed: boolean;
  failures: string[];
}

export interface PersistedAiTestcaseEvaluation {
  testcaseId: string;
  passed: boolean;
  failures: string[];
  intent: StarterAiIntent;
}

export function evaluateAiResult(
  result: GenerateHospiqReplyResult,
  expectation: AiTestcaseExpectation,
): AiEvaluationResult {
  const failures: string[] = [];

  if (expectation.expectedIntent && result.intent !== expectation.expectedIntent) {
    failures.push("intent_mismatch");
  }

  if (result.reply.length > result.prompt.policies.maxReplyLength) {
    failures.push("reply_too_long");
  }

  for (const phrase of expectation.mustInclude ?? []) {
    if (!result.reply.toLowerCase().includes(phrase.toLowerCase())) failures.push(`missing:${phrase}`);
  }

  for (const phrase of expectation.mustNotInclude ?? []) {
    if (result.reply.toLowerCase().includes(phrase.toLowerCase())) failures.push(`forbidden:${phrase}`);
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}

export async function runPersistedAiTestcases(input: {
  hotelId: string;
  lineUserId?: string;
  limit?: number;
}): Promise<PersistedAiTestcaseEvaluation[]> {
  const context = await getHotelAIContext(input.hotelId, input.lineUserId ?? "ai-test-runner");
  const testcases = context.knowledge?.testcases.slice(0, input.limit ?? 5) ?? [];
  const results: PersistedAiTestcaseEvaluation[] = [];

  for (const testcase of testcases) {
    const result = await generateHospiqReply({
      hotelId: input.hotelId,
      lineUserId: input.lineUserId ?? "ai-test-runner",
      message: testcase.userMessage,
      context,
    });
    const evaluation = evaluateAiResult(result, {
      expectedIntent: normalizeExpectedIntent(testcase.expectedIntent),
      expectedBehavior: testcase.expectedBehavior,
      mustInclude: testcase.goldenReply ? [testcase.goldenReply] : undefined,
    });

    results.push({
      testcaseId: testcase.id,
      passed: evaluation.passed,
      failures: evaluation.failures,
      intent: result.intent,
    });
  }

  return results;
}

function normalizeExpectedIntent(intent: string | null): StarterAiIntent | undefined {
  if (!intent) return undefined;
  return intent as StarterAiIntent;
}
