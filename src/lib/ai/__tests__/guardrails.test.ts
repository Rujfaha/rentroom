import { describe, expect, it } from "vitest";
import { detectPrivacyRestrictedQuestion, validateAiAnswer } from "../guardrails";

describe("AI guardrails", () => {
  it("blocks questions about other guests before normal AI handling", () => {
    expect(detectPrivacyRestrictedQuestion("วันนี้มีใครเข้าพักบ้าง")?.reason).toBe("guest_privacy");
    expect(detectPrivacyRestrictedQuestion("ห้อง 201 มีใครพักไหม")?.reason).toBe("guest_privacy");
  });

  it("replaces availability claims when no availability data was provided", () => {
    const result = validateAiAnswer({
      answer: "มีห้องว่างครับ จองได้เลย",
      hasAvailabilityData: false,
      privacyRestricted: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.safeAnswer).toContain("ยังไม่สามารถยืนยันห้องว่าง");
  });
});
