import { describe, expect, it } from "vitest";
import { apiError, apiOk } from "../api-response";

describe("api-response", () => {
  it("wraps successful data consistently", () => {
    expect(apiOk({ id: "hotel-1" })).toEqual({
      ok: true,
      data: { id: "hotel-1" },
    });
  });

  it("wraps errors without leaking internals", () => {
    expect(apiError("Forbidden", "FORBIDDEN")).toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Forbidden",
      },
    });
  });
});
