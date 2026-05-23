import type { BookingLocale } from "@/components/booking/booking-i18n";

export interface BookingReceiptData {
  bookingRef: string;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalNights: number;
  adults: number;
  childrenCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  specialRequests: string;
  totalAmount: number;
  slipSubmitted: boolean;
  locale: BookingLocale;
  createdAt: Date;
  checkBookingUrl?: string;
  basePrice?: number;
  extraBedPrice?: number;
  maxGuests?: number;
}

interface ReceiptCopy {
  title: string;
  subtitle: string;
  bookingRef: string;
  bookingDetails: string;
  guestDetails: string;
  room: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  guests: string;
  name: string;
  phone: string;
  email: string;
  requests: string;
  totalAmount: string;
  payment: string;
  slipSubmitted: string;
  statusHelp: string;
  checkStatus: string;
  generatedAt: string;
}

const RECEIPT_COPY: Record<BookingLocale, ReceiptCopy> = {
  th: {
    title: "ใบรับการจอง",
    subtitle: "Booking Receipt",
    bookingRef: "รหัสการจอง",
    bookingDetails: "รายละเอียดการจอง",
    guestDetails: "ข้อมูลผู้เข้าพัก",
    room: "ห้องพัก",
    checkIn: "เช็คอิน",
    checkOut: "เช็คเอาท์",
    duration: "ระยะเวลา",
    guests: "ผู้เข้าพัก",
    name: "ชื่อ",
    phone: "เบอร์โทร",
    email: "อีเมล",
    requests: "คำขอเพิ่มเติม",
    totalAmount: "ยอดรวม",
    payment: "การชำระเงิน",
    slipSubmitted: "ส่งสลิปแล้ว รอการตรวจสอบ",
    statusHelp: "ใช้รหัสการจองนี้เพื่อตรวจสอบสถานะการจองได้ที่หน้า Check Booking",
    checkStatus: "ตรวจสอบสถานะการจอง",
    generatedAt: "ออกเอกสารเมื่อ",
  },
  en: {
    title: "Booking Receipt",
    subtitle: "ใบรับการจอง",
    bookingRef: "Booking Reference",
    bookingDetails: "Booking Details",
    guestDetails: "Guest Information",
    room: "Room",
    checkIn: "Check-in",
    checkOut: "Check-out",
    duration: "Duration",
    guests: "Guests",
    name: "Name",
    phone: "Phone",
    email: "Email",
    requests: "Requests",
    totalAmount: "Total Amount",
    payment: "Payment",
    slipSubmitted: "Payment slip submitted, awaiting verification",
    statusHelp: "Use this booking reference to check your booking status on the Check Booking page.",
    checkStatus: "Check Booking Status",
    generatedAt: "Generated at",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value: number): string {
  return "THB " + value.toLocaleString("th-TH");
}

function formatDate(value: string, locale: BookingLocale): string {
  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(value: Date, locale: BookingLocale): string {
  return value.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pluralize(value: number, singular: string, plural: string): string {
  return String(value) + " " + (value === 1 ? singular : plural);
}

function buildGuestsText(data: BookingReceiptData): string {
  if (data.locale === "th") {
    return String(data.adults) + " ผู้ใหญ่, " + String(data.childrenCount) + " เด็ก";
  }

  return String(data.adults) + " Adults, " + String(data.childrenCount) + " Children";
}

function buildNightsText(data: BookingReceiptData): string {
  if (data.locale === "th") {
    return String(data.totalNights) + " คืน";
  }

  return pluralize(data.totalNights, "night", "nights");
}

function buildRow(label: string, value: string): string {
  return `
    <div class="row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${value}</dd>
    </div>
  `;
}

function sanitizeFilenamePart(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "guest";
}

export function buildBookingReceiptFilename(data: BookingReceiptData): string {
  const issuedDate = data.createdAt.toISOString().slice(0, 10);
  const bookingRef = sanitizeFilenamePart(data.bookingRef);
  const guestName = sanitizeFilenamePart(data.guestName).slice(0, 48);

  return `receipt-ใบจอง-${bookingRef}-${guestName}-${issuedDate}.html`;
}

export function buildBookingReceiptHtml(data: BookingReceiptData): string {
  const copy = RECEIPT_COPY[data.locale];
  const checkStatusUrl = data.checkBookingUrl || "/check-booking";
  const requestRows = data.specialRequests.trim()
    ? buildRow(copy.requests, escapeHtml(data.specialRequests))
    : "";

  return `<!doctype html>
<html lang="${data.locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(copy.title)} - ${escapeHtml(data.bookingRef)}</title>
  <style>
    :root {
      color-scheme: light;
      --forest: #1a3c2a;
      --earth: #8b7355;
      --gold: #c9a227;
      --cream: #f7f2e8;
      --line: #e8e2d6;
      --ink: #2c2c2c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f6f1e8;
      color: var(--ink);
      font-family: Arial, "Noto Sans Thai", Tahoma, sans-serif;
      line-height: 1.55;
    }
    main {
      width: min(760px, calc(100% - 32px));
      margin: 32px auto;
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 55px rgba(26, 60, 42, 0.12);
    }
    header {
      padding: 28px;
      background: var(--forest);
      color: #ffffff;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 0;
    }
    header p {
      margin: 4px 0 0;
      color: rgba(255, 255, 255, 0.78);
    }
    section {
      padding: 24px 28px;
      border-top: 1px solid var(--line);
    }
    .reference {
      background: var(--cream);
      border: 1px solid var(--line);
      border-radius: 12px;
      margin: 24px 28px 0;
      padding: 18px;
      text-align: center;
    }
    .reference span {
      display: block;
      color: var(--earth);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .reference strong {
      display: block;
      color: var(--gold);
      font-size: 26px;
      margin-top: 4px;
      letter-spacing: 0.08em;
      word-break: break-word;
    }
    h2 {
      margin: 0 0 14px;
      color: var(--forest);
      font-size: 18px;
    }
    dl {
      margin: 0;
      display: grid;
      gap: 10px;
    }
    .row {
      display: grid;
      grid-template-columns: 190px 1fr;
      gap: 18px;
      align-items: start;
    }
    dt {
      color: var(--earth);
      font-size: 14px;
    }
    dd {
      margin: 0;
      color: var(--forest);
      font-weight: 700;
      overflow-wrap: anywhere;
    }
    .total {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      font-size: 20px;
      font-weight: 800;
      color: var(--forest);
    }
    .total strong { color: var(--gold); }
    .note {
      background: #fbf8f0;
      color: var(--earth);
      border-top: 1px solid var(--line);
      padding: 20px 28px 28px;
    }
    .note a {
      color: var(--forest);
      font-weight: 700;
    }
    footer {
      color: var(--earth);
      font-size: 12px;
      padding-top: 14px;
    }
    @media (max-width: 560px) {
      main { width: calc(100% - 20px); margin: 10px auto; border-radius: 12px; }
      header, section, .note { padding-left: 18px; padding-right: 18px; }
      .reference { margin-left: 18px; margin-right: 18px; }
      .row { grid-template-columns: 1fr; gap: 2px; }
      .total { align-items: flex-start; flex-direction: column; }
    }
    @media print {
      body { background: #ffffff; }
      main { margin: 0; width: 100%; box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(copy.title)}</h1>
      <p>${escapeHtml(copy.subtitle)} - ${escapeHtml(data.hotelName)}</p>
    </header>
    <div class="reference">
      <span>${escapeHtml(copy.bookingRef)}</span>
      <strong>${escapeHtml(data.bookingRef)}</strong>
    </div>
    <section>
      <h2>${escapeHtml(copy.bookingDetails)}</h2>
      <dl>
        ${buildRow(copy.room, escapeHtml(data.roomName))}
        ${buildRow(copy.checkIn, escapeHtml(formatDate(data.checkIn, data.locale)))}
        ${buildRow(copy.checkOut, escapeHtml(formatDate(data.checkOut, data.locale)))}
        ${buildRow(copy.duration, escapeHtml(buildNightsText(data)))}
        ${buildRow(copy.guests, escapeHtml(buildGuestsText(data)))}
      </dl>
    </section>
    <section>
      <h2>${escapeHtml(copy.guestDetails)}</h2>
      <dl>
        ${buildRow(copy.name, escapeHtml(data.guestName))}
        ${buildRow(copy.phone, escapeHtml(data.guestPhone))}
        ${buildRow(copy.email, escapeHtml(data.guestEmail))}
        ${requestRows}
      </dl>
    </section>
    <section>
      <dl>
        ${buildRow(copy.payment, escapeHtml(data.slipSubmitted ? copy.slipSubmitted : "-"))}
        ${(data.basePrice ?? 0) > 0 ? buildRow(data.locale === "th" ? "ค่าห้องพักปกติ" : "Standard Room Rate", formatPrice((data.basePrice ?? 0) * data.totalNights) + " (" + formatPrice(data.basePrice ?? 0) + " x " + buildNightsText(data) + ")") : ""}
        ${(Math.max(0, (data.adults + data.childrenCount) - (data.maxGuests ?? 2)) > 0 && (data.extraBedPrice ?? 0) > 0)
          ? buildRow(data.locale === "th" ? "เตียงเสริม" : "Extra Bed", formatPrice(Math.max(0, (data.adults + data.childrenCount) - (data.maxGuests ?? 2)) * (data.extraBedPrice ?? 0) * data.totalNights) + " (" + formatPrice(data.extraBedPrice ?? 0) + " x " + String(Math.max(0, (data.adults + data.childrenCount) - (data.maxGuests ?? 2))) + " คน x " + buildNightsText(data) + ")")
          : ""}
      </dl>
    </section>
    <section>
      <div class="total">
        <span>${escapeHtml(copy.totalAmount)}</span>
        <strong>${escapeHtml(formatPrice(data.totalAmount))}</strong>
      </div>
    </section>
    <div class="note">
      <p>${escapeHtml(copy.statusHelp)}</p>
      <p><a href="${checkStatusUrl}">${escapeHtml(copy.checkStatus)}</a></p>
      <footer>${escapeHtml(copy.generatedAt)} ${escapeHtml(formatDateTime(data.createdAt, data.locale))}</footer>
    </div>
  </main>
</body>
</html>`;
}

export function downloadBookingReceipt(data: BookingReceiptData): void {
  const html = buildBookingReceiptHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildBookingReceiptFilename(data);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
