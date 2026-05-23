import { describe, expect, it } from "vitest";
import {
  buildBookingReceiptHtml,
  buildBookingReceiptFilename,
  type BookingReceiptData,
} from "../receipt";

const receiptData: BookingReceiptData = {
  bookingRef: "VR-20260523-ABCD",
  hotelName: "Arkkarawin",
  roomName: "Deluxe Thai Room",
  checkIn: "2026-06-01",
  checkOut: "2026-06-03",
  totalNights: 2,
  adults: 2,
  childrenCount: 1,
  guestName: "สมชาย Test / Guest",
  guestPhone: "0812345678",
  guestEmail: "somchai@example.com",
  specialRequests: "Late check-in <script>alert(1)</script>",
  totalAmount: 2500,
  slipSubmitted: true,
  locale: "th",
  createdAt: new Date("2026-05-23T10:30:00.000Z"),
};

describe("booking receipt", () => {
  it("builds a readable Thai and English html filename without unsafe characters", () => {
    const filename = buildBookingReceiptFilename(receiptData);

    expect(filename).toBe("receipt-ใบจอง-VR-20260523-ABCD-สมชาย-Test-Guest-2026-05-23.html");
  });

  it("renders escaped booking details and status guidance in the receipt html", () => {
    const html = buildBookingReceiptHtml(receiptData);

    expect(html).toContain("VR-20260523-ABCD");
    expect(html).toContain("Deluxe Thai Room");
    expect(html).toContain("THB 2,500");
    expect(html).toContain("ใช้รหัสการจองนี้เพื่อตรวจสอบสถานะการจอง");
    expect(html).toContain("/check-booking");
    expect(html).toContain("Late check-in &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});
