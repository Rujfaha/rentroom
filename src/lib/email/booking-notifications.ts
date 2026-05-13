import type { BookingStatus, PaymentStatus } from "@/types/database.types";

export interface BookingEmailData {
  bookingNumber: string;
  guestName: string;
  guestEmail: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
}

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันการจองแล้ว",
  checked_in: "เช็คอินแล้ว",
  checked_out: "เช็คเอาท์แล้ว",
  cancelled: "ยกเลิกการจอง",
  no_show: "ไม่เข้าพัก",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "รอตรวจสอบสลิป",
  verified: "ชำระเงินแล้ว",
  rejected: "สลิปไม่ถูกต้อง",
};

const EMAIL_SUBJECTS: Record<BookingStatus, string> = {
  pending: "ได้รับข้อมูลการจองแล้ว",
  confirmed: "ยืนยันการจองแล้ว",
  checked_in: "อัปเดตสถานะการเข้าพัก",
  checked_out: "อัปเดตสถานะเช็คเอาท์",
  cancelled: "อัปเดตสถานะการจอง",
  no_show: "อัปเดตสถานะการจอง",
};

interface ResendEmailResponse {
  id?: string;
  message?: string;
  name?: string;
}

export async function sendBookingStatusEmail(data: BookingEmailData): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn("[booking-email] RESEND_API_KEY or BOOKING_EMAIL_FROM is not configured. Skipping booking email.");
    return false;
  }

  const hotelName = process.env.BOOKING_EMAIL_HOTEL_NAME || "Arkkarawin";
  const subject = `${EMAIL_SUBJECTS[data.bookingStatus]} - ${data.bookingNumber}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: data.guestEmail,
      subject,
      html: renderBookingEmailHtml(data, hotelName),
      text: renderBookingEmailText(data, hotelName),
    }),
  });

  if (!response.ok) {
    const error = await safeReadResendResponse(response);
    console.error("[booking-email] Failed to send booking email:", error);
    return false;
  }

  return true;
}

function renderBookingEmailHtml(data: BookingEmailData, hotelName: string): string {
  const checkBookingUrl = getCheckBookingUrl();
  const statusLabel = BOOKING_STATUS_LABELS[data.bookingStatus];
  const paymentLabel = PAYMENT_STATUS_LABELS[data.paymentStatus];
  const amount = formatPrice(data.totalAmount);

  return `
    <div style="margin:0;padding:0;background:#faf7f0;font-family:Arial,'Helvetica Neue',sans-serif;color:#1f2933;">
      <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
        <div style="background:#ffffff;border:1px solid #e8e2d6;border-radius:18px;overflow:hidden;">
          <div style="background:#1a3c2a;padding:24px;color:#ffffff;">
            <div style="font-size:22px;font-weight:700;letter-spacing:.02em;">${escapeHtml(hotelName)}</div>
            <div style="margin-top:8px;font-size:14px;color:#f4ead7;">${escapeHtml(statusLabel)}</div>
          </div>
          <div style="padding:24px;">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">เรียนคุณ ${escapeHtml(data.guestName)}</p>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#4b5563;">ระบบได้อัปเดตสถานะการจองของคุณเรียบร้อยแล้ว รายละเอียดมีดังนี้</p>
            <div style="border:1px solid #e8e2d6;border-radius:14px;padding:18px;background:#fffdf8;">
              ${renderInfoRow("เลขที่การจอง", data.bookingNumber)}
              ${renderInfoRow("สถานะการจอง", statusLabel)}
              ${renderInfoRow("สถานะชำระเงิน", paymentLabel)}
              ${renderInfoRow("ห้องพัก", data.roomName)}
              ${renderInfoRow("เช็คอิน", data.checkIn)}
              ${renderInfoRow("เช็คเอาท์", data.checkOut)}
              ${renderInfoRow("จำนวนคืน", `${data.nights} คืน`)}
              ${renderInfoRow("จำนวนผู้เข้าพัก", `${data.guests} ท่าน`)}
              ${renderInfoRow("ยอดรวม", `THB ${amount}`)}
            </div>
            <div style="margin-top:24px;text-align:center;">
              <a href="${escapeHtml(checkBookingUrl)}" style="display:inline-block;background:#c9a227;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;">ตรวจสอบสถานะการจอง</a>
            </div>
            <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#8b7355;text-align:center;">หากมีข้อสงสัย กรุณาติดต่อโรงแรมโดยตรง</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBookingEmailText(data: BookingEmailData, hotelName: string): string {
  return [
    hotelName,
    `${EMAIL_SUBJECTS[data.bookingStatus]} - ${data.bookingNumber}`,
    `เรียนคุณ ${data.guestName}`,
    `เลขที่การจอง: ${data.bookingNumber}`,
    `สถานะการจอง: ${BOOKING_STATUS_LABELS[data.bookingStatus]}`,
    `สถานะชำระเงิน: ${PAYMENT_STATUS_LABELS[data.paymentStatus]}`,
    `ห้องพัก: ${data.roomName}`,
    `เช็คอิน: ${data.checkIn}`,
    `เช็คเอาท์: ${data.checkOut}`,
    `จำนวนคืน: ${data.nights} คืน`,
    `จำนวนผู้เข้าพัก: ${data.guests} ท่าน`,
    `ยอดรวม: THB ${formatPrice(data.totalAmount)}`,
    `ตรวจสอบสถานะการจอง: ${getCheckBookingUrl()}`,
  ].join("\n");
}

function renderInfoRow(label: string, value: string): string {
  return `
    <div style="display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #eee7da;padding:10px 0;">
      <span style="color:#8b7355;font-size:14px;">${escapeHtml(label)}</span>
      <span style="color:#1a3c2a;font-size:14px;font-weight:700;text-align:right;">${escapeHtml(value)}</span>
    </div>
  `;
}

function getCheckBookingUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/check-booking`;
}

function formatPrice(value: number): string {
  return value.toLocaleString("th-TH");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function safeReadResendResponse(response: Response): Promise<ResendEmailResponse | string> {
  try {
    return await response.json() as ResendEmailResponse;
  } catch {
    return response.statusText;
  }
}
