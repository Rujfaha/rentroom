import { describe, expect, it } from "vitest";
import { requireHotelAccess } from "../require-hotel-access";
import type { CurrentAccount } from "../types";

const hotelAdmin: CurrentAccount = {
  id: "account-1",
  email: "admin@example.com",
  fullName: null,
  role: "hotel_admin",
  hotelId: "hotel-a",
  status: "active",
};

describe("requireHotelAccess", () => {
  it("allows a hotel admin to access their own hotel", () => {
    expect(requireHotelAccess(hotelAdmin, "hotel-a")).toBe("hotel-a");
  });

  it("blocks a hotel admin from requesting another hotel's data", () => {
    expect(() => requireHotelAccess(hotelAdmin, "hotel-b")).toThrow("Forbidden hotel access");
  });

  it("requires super admins to pass an explicit hotel id", () => {
    const superAdmin: CurrentAccount = {
      ...hotelAdmin,
      role: "super_admin",
      hotelId: null,
    };

    expect(() => requireHotelAccess(superAdmin)).toThrow("Hotel id is required");
    expect(requireHotelAccess(superAdmin, "hotel-b")).toBe("hotel-b");
  });
});
