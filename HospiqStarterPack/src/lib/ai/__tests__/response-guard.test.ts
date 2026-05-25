import { describe, expect, it } from "vitest";
import { guardAiResponse } from "../response-guard";

describe("guardAiResponse", () => {
  it("allows normal model output without changing the text", () => {
    expect(
      guardAiResponse({
        response: "Model generated reply.",
        hotelId: "hotel-1",
        maxReplyLength: 100,
      }),
    ).toEqual({
      allowed: true,
      response: "Model generated reply.",
      reasons: [],
    });
  });

  it("blocks cross-hotel markers without writing a fallback reply", () => {
    expect(
      guardAiResponse({
        response: "data from hotel_id hotel-2",
        hotelId: "hotel-1",
        maxReplyLength: 100,
      }),
    ).toEqual({
      allowed: false,
      response: "data from hotel_id hotel-2",
      reasons: ["cross_hotel_reference"],
    });
  });

  it("blocks replies longer than the policy limit", () => {
    expect(
      guardAiResponse({
        response: "abcd",
        hotelId: "hotel-1",
        maxReplyLength: 3,
      }).reasons,
    ).toEqual(["reply_too_long"]);
  });
});
