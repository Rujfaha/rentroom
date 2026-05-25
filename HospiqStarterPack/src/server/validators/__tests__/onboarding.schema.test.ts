import { describe, expect, it } from "vitest";
import { onboardingSchema } from "../onboarding.schema";

describe("onboardingSchema", () => {
  it("accepts hotel profile with optional roomtype and FAQs", () => {
    const parsed = onboardingSchema.parse({
      hotel: {
        name: "Hospiq Demo",
        hasWebbooking: true,
        webbookingUrl: "https://example.com/book",
      },
      roomtype: {
        name: "Standard",
        basePrice: 900,
        totalRooms: 5,
        roomSize: "24 sqm",
        sortOrder: 1,
        isFeatured: true,
        priceNote: "ราคาเริ่มต้น / อาจเปลี่ยนตามวัน",
      },
      aiFaqs: [
        {
          question: "มีที่จอดรถไหม",
          answer: "มีที่จอดรถสำหรับผู้เข้าพัก",
          keywords: ["ที่จอดรถ", "parking"],
        },
      ],
    });

    expect(parsed.hotel.hasWebbooking).toBe(true);
    expect(parsed.roomtype?.isFeatured).toBe(true);
    expect(parsed.aiFaqs[0]?.language).toBe("th");
  });

  it("defaults optional onboarding fields", () => {
    const parsed = onboardingSchema.parse({
      hotel: {
        name: "Hospiq Demo",
      },
    });

    expect(parsed.hotel.hasWebbooking).toBe(false);
    expect(parsed.aiFaqs).toEqual([]);
    expect(parsed.complete).toBe(true);
  });
});
