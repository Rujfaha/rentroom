import { describe, expect, it } from "vitest";
import {
  evaluateBookingRateLimit,
  evaluatePromotionValidationRateLimit,
  hashBookingIdentifier,
  normalizeBookingIdentifier,
} from "../anti-spam";

interface MockCountQuery extends PromiseLike<{ count: number; error: null }> {
  eq: () => MockCountQuery;
  gte: () => MockCountQuery;
  then: NonNullable<PromiseLike<{ count: number; error: null }>["then"]>;
}

function createMockSupabase(counts: number[]) {
  return {
    from: () => ({
      select: (): MockCountQuery => {
        const query: MockCountQuery = {
          eq: () => query,
          gte: () => query,
          then: (resolve, reject) => Promise.resolve({ count: counts.shift() ?? 0, error: null }).then(resolve, reject),
        };
        return query;
      },
    }),
  } as unknown as Parameters<typeof evaluateBookingRateLimit>[0];
}

const context = {
  hotelId: "hotel-1",
  action: "booking_create" as const,
  ipHash: "ip-hash",
  emailHash: "email-hash",
  phoneHash: "phone-hash",
  roomTypeId: "room-type-1",
  checkInDate: "2026-06-01",
  checkOutDate: "2026-06-03",
};

describe("booking anti-spam identifiers", () => {
  it("normalizes identifiers before hashing", () => {
    expect(normalizeBookingIdentifier(" User-Name @Example.COM ")).toBe("username@example.com");
    expect(normalizeBookingIdentifier("081 234-5678")).toBe("0812345678");
  });

  it("hashes normalized identifiers without returning raw data", () => {
    const first = hashBookingIdentifier("USER@example.com");
    const second = hashBookingIdentifier(" user@example.com ");

    expect(first).toBe(second);
    expect(first).not.toContain("user@example.com");
    expect(first).toHaveLength(64);
  });
});

describe("booking rate limits", () => {
  it("allows booking attempts under all thresholds", async () => {
    const supabase = createMockSupabase([0, 1, 0, 1, 0, 1]);

    await expect(evaluateBookingRateLimit(supabase, context)).resolves.toEqual({
      blocked: false,
      riskScore: 0,
    });
  });

  it("blocks booking attempts when an identifier reaches a threshold", async () => {
    const supabase = createMockSupabase([5, 0, 0, 0, 0, 0]);

    await expect(evaluateBookingRateLimit(supabase, context)).resolves.toEqual({
      blocked: true,
      riskScore: 30,
    });
  });

  it("blocks repeated failed promotion validation attempts", async () => {
    const supabase = createMockSupabase([10, 0, 0]);

    await expect(evaluatePromotionValidationRateLimit(supabase, { ...context, action: "promotion_validate" })).resolves.toEqual({
      blocked: true,
      riskScore: 30,
    });
  });
});
