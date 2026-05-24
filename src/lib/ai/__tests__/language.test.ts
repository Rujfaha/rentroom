import { describe, expect, it } from "vitest";
import { detectLineLanguage } from "../language";

describe("detectLineLanguage", () => {
  it("detects supported customer languages", () => {
    expect(detectLineLanguage("มีห้องว่างไหม")).toBe("th");
    expect(detectLineLanguage("Do you have a room tomorrow?")).toBe("en");
    expect(detectLineLanguage("明日部屋はありますか")).toBe("ja");
    expect(detectLineLanguage("有没有空房？")).toBe("zh");
    expect(detectLineLanguage("¿Tienen habitación mañana?")).toBe("es");
    expect(detectLineLanguage("هل توجد غرفة غدا؟")).toBe("ar");
  });
});
