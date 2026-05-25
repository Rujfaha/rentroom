import { getHotelAIContext } from "./hotel-context";
import { detectStarterIntent } from "./intent-detector";
import { resolveAiPolicy } from "./policy-resolver";
import { buildStarterPromptPayload } from "./prompt-builder";
import { createNotConfiguredReplyComposer } from "./reply-composer";
import { enforceFemalePoliteThaiTone, preventCrossHotelLeak } from "./response-guard";
import type { GenerateHospiqReplyInput, GenerateHospiqReplyResult } from "./types";

export async function generateHospiqReply(input: GenerateHospiqReplyInput): Promise<GenerateHospiqReplyResult> {
  const context = input.context ?? (await getHotelAIContext(input.hotelId));
  const intent = detectStarterIntent(input.message);
  const policy = resolveAiPolicy(context, intent);
  const prompt = buildStarterPromptPayload(context, input.message, intent);
  const composer = createNotConfiguredReplyComposer();
  const draft = await composer.compose(prompt);
  const toneSafe = enforceFemalePoliteThaiTone(draft.reply);
  const leakSafe = preventCrossHotelLeak(toneSafe, input.hotelId);

  return {
    reply: leakSafe.response,
    intent,
    aiResponseSource: leakSafe.allowed ? draft.source : "guardrail",
    prompt,
    handoffRequired: policy.shouldHandoff,
    memoryUpdate: draft.memoryUpdate,
  };
}
