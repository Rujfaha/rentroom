import { describe, expect, it } from "vitest";
import { canUseRole } from "../require-role";

describe("canUseRole", () => {
  it("allows super admin to use super admin access", () => {
    expect(canUseRole("super_admin", ["super_admin"])).toBe(true);
  });

  it("allows hotel admin for hotel admin routes", () => {
    expect(canUseRole("hotel_admin", ["hotel_admin", "super_admin"])).toBe(true);
  });

  it("rejects hotel admin from super admin-only routes", () => {
    expect(canUseRole("hotel_admin", ["super_admin"])).toBe(false);
  });
});
