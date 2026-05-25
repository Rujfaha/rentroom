export function enforceFemalePoliteThaiTone(response: string): string {
  return response.replaceAll("นะครับ", "นะคะ").replaceAll("ครับ", "ค่ะ");
}

export function preventCrossHotelLeak(response: string, hotelId: string): { allowed: boolean; response: string } {
  if (response.includes("hotel_id") && !response.includes(hotelId)) {
    return {
      allowed: false,
      response: "ขออภัยค่ะ ระบบไม่สามารถเปิดเผยข้อมูลของที่พักอื่นได้ค่ะ",
    };
  }

  return { allowed: true, response };
}
