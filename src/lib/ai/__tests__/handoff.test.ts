import { describe, expect, it } from "vitest";
import { detectLineHandoff } from "../handoff";

describe("detectLineHandoff", () => {
  it("flags risky payment and refund cases for staff handoff", () => {
    expect(detectLineHandoff("โอนแล้วแต่สลิปมีปัญหา")?.reason).toBe("payment_issue");
    expect(detectLineHandoff("I want a refund")?.reason).toBe("refund");
  });

  it("flags booking-ready leads without treating them as completed bookings", () => {
    expect(detectLineHandoff("พร้อมจอง เอาห้องนี้เลย")?.reason).toBe("booking_ready");
  });

  it("flags explicit admin contact and forgotten slip upload as staff handoff", () => {
    expect(detectLineHandoff("ติดต่อแอดมินให้หน่อย จองแล้วลืมแนบสลิป")?.reason).toBe("payment_issue");
    expect(detectLineHandoff("ขอคุยกับแอดมินหน่อย")?.reason).toBe("admin_request");
  });
});
