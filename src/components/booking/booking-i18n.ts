export type BookingLocale = "th" | "en";

export interface BookingLabels {
  locale: BookingLocale;
  header: {
    backHome: string;
    title: string;
    subtitle: string;
    loading: string;
  };
  steps: string[];
  selectRoom: {
    title: string;
    checkIn: string;
    checkOut: string;
    adults: string;
    children: string;
    chooseRoom: string;
    searching: string;
    noRoomsTitle: string;
    noRoomsHint: string;
    maxGuests: (count: number) => string;
    availableRooms: (count: number) => string;
    fullyBooked: string;
    select: string;
    notAvailable: string;
    perNight: string;
  };
  guestInfo: {
    title: string;
    fullName: string;
    phone: string;
    email: string;
    specialRequests: string;
    fullNamePlaceholder: string;
    phonePlaceholder: string;
    emailPlaceholder: string;
    specialRequestsPlaceholder: string;
    back: string;
    continue: string;
    summary: string;
    guests: string;
    duration: string;
    total: string;
    nights: (count: number) => string;
    guestCount: (adults: number, children: number) => string;
    errors: {
      fullName: string;
      phone: string;
      email: string;
      invalidEmail: string;
    };
  };
  payment: {
    title: string;
    subtitle: string;
    generatingQr: string;
    qrError: string;
    account: string;
    amountToPay: string;
    uploadTitle: string;
    uploadHint: string;
    removeSlip: string;
    uploadCta: string;
    uploadTypeHint: string;
    back: string;
    confirm: string;
    summary: string;
    guest: string;
    duration: string;
    total: string;
    slipReady: string;
    slipWaiting: string;
  };
  confirmation: {
    title: string;
    subtitle: string;
    reference: string;
    bookingDetails: string;
    room: string;
    duration: string;
    guests: string;
    guestInfo: string;
    name: string;
    phone: string;
    email: string;
    requests: string;
    totalAmount: string;
    payment: string;
    slipSubmitted: string;
    emailNotice: (email: string) => string;
    saveReference: string;
    backHome: string;
    checkStatus: string;
  };
  shared: {
    checkIn: string;
    checkOut: string;
    thb: string;
  };
}

export const bookingMessages: Record<BookingLocale, BookingLabels> = {
  th: {
    locale: "th",
    header: {
      backHome: "กลับหน้าแรก",
      title: "จองห้องพัก",
      subtitle: "กรอกข้อมูลตามขั้นตอนเพื่อจองห้องพักของคุณ",
      loading: "กำลังโหลดข้อมูลการจอง...",
    },
    steps: ["เลือกห้อง", "ข้อมูลผู้เข้าพัก", "ชำระเงิน", "ยืนยันการจอง"],
    selectRoom: {
      title: "เลือกวันที่และจำนวนผู้เข้าพัก",
      checkIn: "เช็คอิน",
      checkOut: "เช็คเอาท์",
      adults: "ผู้ใหญ่",
      children: "เด็ก",
      chooseRoom: "เลือกห้องพัก",
      searching: "กำลังค้นหาห้องว่าง...",
      noRoomsTitle: "ไม่พบห้องว่าง",
      noRoomsHint: "ลองเปลี่ยนวันที่หรือจำนวนผู้เข้าพัก",
      maxGuests: (count) => "พักได้สูงสุด " + String(count) + " คน",
      availableRooms: (count) => "ว่าง " + String(count) + " ห้อง",
      fullyBooked: "ห้องพักเต็ม",
      select: "เลือกห้องนี้",
      notAvailable: "ไม่พร้อมให้จอง",
      perNight: " / คืน",
    },
    guestInfo: {
      title: "ข้อมูลผู้เข้าพัก",
      fullName: "ชื่อ-นามสกุล *",
      phone: "เบอร์โทร *",
      email: "อีเมล *",
      specialRequests: "คำขอเพิ่มเติม",
      fullNamePlaceholder: "ชื่อและนามสกุล",
      phonePlaceholder: "เช่น 081 234 5678",
      emailPlaceholder: "you@example.com",
      specialRequestsPlaceholder: "แจ้งคำขอเพิ่มเติมหรือหมายเหตุ...",
      back: "ย้อนกลับ",
      continue: "ไปต่อ",
      summary: "สรุปการจอง",
      guests: "ผู้เข้าพัก",
      duration: "ระยะเวลา",
      total: "ยอดรวม",
      nights: (count) => String(count) + " คืน",
      guestCount: (adults, children) => String(adults) + " ผู้ใหญ่, " + String(children) + " เด็ก",
      errors: {
        fullName: "กรุณากรอกชื่อ-นามสกุล",
        phone: "กรุณากรอกเบอร์โทร",
        email: "กรุณากรอกอีเมล",
        invalidEmail: "กรุณากรอกอีเมลให้ถูกต้อง",
      },
    },
    payment: {
      title: "ชำระเงินผ่าน PromptPay",
      subtitle: "สแกน QR Code ด้านล่างด้วยแอปธนาคารเพื่อชำระเงิน",
      generatingQr: "กำลังสร้าง QR Code...",
      qrError: "ไม่สามารถสร้าง QR Code ได้",
      account: "บัญชีรับเงิน",
      amountToPay: "ยอดที่ต้องชำระ",
      uploadTitle: "อัปโหลดสลิปโอนเงิน",
      uploadHint: "หลังชำระเงินแล้ว กรุณาอัปโหลดสลิปเพื่อรอตรวจสอบ",
      removeSlip: "ลบและอัปโหลดใหม่",
      uploadCta: "คลิกเพื่ออัปโหลดสลิป",
      uploadTypeHint: "JPG, PNG (สูงสุด 5MB)",
      back: "ย้อนกลับ",
      confirm: "ยืนยันการชำระเงิน",
      summary: "สรุปการจอง",
      guest: "ผู้เข้าพัก",
      duration: "ระยะเวลา",
      total: "ยอดรวม",
      slipReady: "อัปโหลดสลิปแล้ว พร้อมยืนยัน",
      slipWaiting: "รออัปโหลดสลิป",
    },
    confirmation: {
      title: "ยืนยันการจองแล้ว",
      subtitle: "ขอบคุณที่เลือกพักกับ Arkkarawin",
      reference: "รหัสการจอง",
      bookingDetails: "รายละเอียดการจอง",
      room: "ห้องพัก",
      duration: "ระยะเวลา",
      guests: "ผู้เข้าพัก",
      guestInfo: "ข้อมูลผู้เข้าพัก",
      name: "ชื่อ",
      phone: "เบอร์โทร",
      email: "อีเมล",
      requests: "คำขอเพิ่มเติม",
      totalAmount: "ยอดรวมทั้งหมด",
      payment: "การชำระเงิน",
      slipSubmitted: "ส่งสลิปแล้ว รอการตรวจสอบ",
      emailNotice: (email) => "ระบบจะส่งอีเมลยืนยันไปที่ " + email,
      saveReference: "กรุณาเก็บรหัสการจองไว้สำหรับเช็คอิน",
      backHome: "กลับหน้าแรก",
      checkStatus: "ตรวจสอบสถานะการจอง",
    },
    shared: {
      checkIn: "เช็คอิน",
      checkOut: "เช็คเอาท์",
      thb: "THB ",
    },
  },
  en: {
    locale: "en",
    header: {
      backHome: "Back to Home",
      title: "Book Your Stay",
      subtitle: "Complete the steps below to reserve your room",
      loading: "Loading booking...",
    },
    steps: ["Select Room", "Guest Info", "Payment", "Confirmation"],
    selectRoom: {
      title: "Select Dates & Guests",
      checkIn: "Check-in",
      checkOut: "Check-out",
      adults: "Adults",
      children: "Children",
      chooseRoom: "Choose Your Room",
      searching: "Searching available rooms...",
      noRoomsTitle: "No rooms available",
      noRoomsHint: "Try changing your dates or guest count.",
      maxGuests: (count) => "Max " + String(count) + " guests",
      availableRooms: (count) => String(count) + " room(s) available",
      fullyBooked: "Fully booked",
      select: "Select",
      notAvailable: "Not Available",
      perNight: " / night",
    },
    guestInfo: {
      title: "Guest Information",
      fullName: "Full Name *",
      phone: "Phone *",
      email: "Email *",
      specialRequests: "Special Requests",
      fullNamePlaceholder: "John Doe",
      phonePlaceholder: "+66 81 234 5678",
      emailPlaceholder: "you@example.com",
      specialRequestsPlaceholder: "Any special requests or notes...",
      back: "Back",
      continue: "Continue to Confirmation",
      summary: "Booking Summary",
      guests: "Guests",
      duration: "Duration",
      total: "Total",
      nights: (count) => String(count) + " night(s)",
      guestCount: (adults, children) => String(adults) + " Adults, " + String(children) + " Children",
      errors: {
        fullName: "Please enter your full name",
        phone: "Please enter your phone number",
        email: "Please enter your email",
        invalidEmail: "Please enter a valid email",
      },
    },
    payment: {
      title: "Payment via PromptPay",
      subtitle: "Scan the QR code below with your banking app to pay",
      generatingQr: "Generating QR Code...",
      qrError: "Failed to generate QR code",
      account: "Account",
      amountToPay: "Amount to Pay",
      uploadTitle: "Upload Payment Slip",
      uploadHint: "After payment, upload your transfer slip for verification",
      removeSlip: "Remove and upload another",
      uploadCta: "Click to upload slip",
      uploadTypeHint: "JPG, PNG (max 5MB)",
      back: "Back",
      confirm: "Confirm Payment",
      summary: "Booking Summary",
      guest: "Guest",
      duration: "Duration",
      total: "Total",
      slipReady: "Slip uploaded - ready to confirm",
      slipWaiting: "Awaiting slip upload",
    },
    confirmation: {
      title: "Booking Confirmed!",
      subtitle: "Thank you for choosing Arkkarawin",
      reference: "Booking Reference",
      bookingDetails: "Booking Details",
      room: "Room",
      duration: "Duration",
      guests: "Guests",
      guestInfo: "Guest Information",
      name: "Name",
      phone: "Phone",
      email: "Email",
      requests: "Requests",
      totalAmount: "Total Amount",
      payment: "Payment",
      slipSubmitted: "Payment slip submitted - awaiting verification",
      emailNotice: (email) => "A confirmation email will be sent to " + email,
      saveReference: "Please save your booking reference for check-in.",
      backHome: "Back to Home",
      checkStatus: "Check Booking Status",
    },
    shared: {
      checkIn: "Check-in",
      checkOut: "Check-out",
      thb: "THB ",
    },
  },
};

export function getBookingLocale(value: string | undefined): BookingLocale {
  return value === "en" ? "en" : "th";
}
