import { getHotelAIContext } from "./hotel-context";
import { extractStarterIntentEntities, mergeBookingLeadFromEntities } from "./intent-router";
import { resolveAiPolicy } from "./policy-resolver";
import { buildStarterPromptPayload } from "./prompt-builder";
import { retrieveRelevantFaqs } from "./rag-retriever";
import { createModelBackedReplyComposer } from "./reply-composer";
import { guardAiResponse } from "./response-guard";
import type { GenerateHospiqReplyInput, GenerateHospiqReplyResult } from "./types";

export async function generateHospiqReply(input: GenerateHospiqReplyInput): Promise<GenerateHospiqReplyResult> {
  const extraction = await extractStarterIntentEntities(input.message);
  const baseContext = input.context ?? (await getHotelAIContext(input.hotelId, input.lineUserId, input.lineSessionId));
  const intent = extraction.primaryIntent;
  const mergedMemory = mergeBookingLeadFromEntities(baseContext.memory, extraction);
  const relevantFaqs = retrieveRelevantFaqs(baseContext.faqs, input.message, extraction.language);
  const context = {
    ...baseContext,
    faqs: relevantFaqs,
    memory: mergedMemory,
  };
  const policy = resolveAiPolicy(context, intent);
  const handoffRequired = policy.shouldHandoff || extraction.handoff?.required === true;
  const prompt = buildStarterPromptPayload(context, input.message, intent);
  const composer = createModelBackedReplyComposer();
  const draft = await composer.compose(prompt);
  const guard = guardAiResponse({
    response: draft.reply,
    hotelId: input.hotelId,
    maxReplyLength: prompt.policies.maxReplyLength,
  });

  return {
    reply: guard.allowed ? guard.response : "",
    intent,
    aiResponseSource: guard.allowed ? draft.source : "guardrail",
    aiProvider: draft.provider,
    aiModel: draft.model,
    prompt,
    handoffRequired,
    handoffReason: extraction.handoff?.reason ?? null,
    handoffPriority: extraction.handoff?.priority ?? null,
    memoryUpdate: draft.memoryUpdate,
    language: extraction.language,
    entities: extraction.entities,
  };
}
