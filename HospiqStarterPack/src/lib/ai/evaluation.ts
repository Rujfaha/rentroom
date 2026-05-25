import type { GenerateHospiqReplyResult, StarterAiIntent } from "./types";

export interface AiTestcaseExpectation {
  expectedIntent?: StarterAiIntent;
  expectedBehavior?: string | null;
}

export interface AiEvaluationResult {
  passed: boolean;
  failures: string[];
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

  return {
    passed: failures.length === 0,
    failures,
  };
}
