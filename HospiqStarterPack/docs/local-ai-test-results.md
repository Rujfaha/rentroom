# AI Local Response Test Report

**Date:** 26/5/2569 19:58:32
**Hotel ID:** `12af7b54-d63d-4525-9c7a-429726241f49` (Hospiq Handtest Hotel)

## Summary of Test Cases

| Case Name | Intent | Handoff | Provider/Model |
| --- | --- | --- | --- |
| 1. ที่จอดรถ (FAQ - Amenities) | `amenities_question` | `No` | gemini (gemini-3.1-flash-lite) |
| 2. เวลาเช็คอิน (FAQ - Check-in/Check-out) | `policy_question` | `No` | gemini (gemini-3.1-flash-lite) |
| 3. สิ่งอำนวยความสะดวกที่ไม่มี (Missing Fact - สระว่ายน้ำ) | `amenities_question` | `No` | gemini (gemini-3.1-flash-lite) |
| 4. แนะนำห้องพักสำหรับ 3 คน (Room Recommendation) | `room_recommendation` | `No` | gemini (gemini-3.1-flash-lite) |
| 5. ขอคุยกับแอดมิน (Handoff Request) | `handoff_request` | `Yes` | gemini (gemini-3.1-flash-lite) |
| 6. การจองพร้อมจอง (Booking Ready) | `booking_ready` | `Yes` | gemini (gemini-3.1-flash-lite) |

---

## Test Case Details

### 1. ที่จอดรถ (FAQ - Amenities)

**User Message:**
```txt
มีที่จอดรถหรือเปล่าครับ
```

**AI Response:**
```txt
มีที่จอดรถรองรับสำหรับผู้เข้าพัก ลูกค้าสามารถนำรถมาได้ค่ะ หากคุณลูกค้ากำลังวางแผนเข้าพัก สามารถแจ้งจำนวนผู้เข้าพักเพื่อให้ทางเราแนะนำห้องที่เหมาะสมที่สุดให้ได้นะคะ
```

**Metadata:**
- **Intent:** `amenities_question`
- **Handoff:** `No`
- **AI Provider / Model:** `gemini` / `gemini-3.1-flash-lite`
- **Extracted Entities:** `{}`
- **Retrieved FAQs:**
  - โรงแรมมีที่จอดรถไหม
  - เวลาเช็กอินและเช็กเอาต์คือกี่โมง
  - จองผ่านเว็บได้ไหม
  - มีห้องสำหรับครอบครัวไหม
  - ห้องไหนเหมาะสำหรับพักสองคน

---

### 2. เวลาเช็คอิน (FAQ - Check-in/Check-out)

**User Message:**
```txt
เช็คอินได้กี่โมงและเช็คเอาท์กี่โมงครับ
```

**AI Response:**
```txt
เช็กอินได้ตั้งแต่ 14:00 น. และเช็กเอาต์ก่อน 12:00 น. ค่ะ หากคุณลูกค้ามีแผนการเข้าพักช่วงวันไหนเป็นพิเศษ สามารถแจ้งให้ทางเราช่วยตรวจสอบห้องว่างหรือแนะนำห้องพักที่เหมาะสมให้ได้นะคะ
```

**Metadata:**
- **Intent:** `policy_question`
- **Handoff:** `No`
- **AI Provider / Model:** `gemini` / `gemini-3.1-flash-lite`
- **Extracted Entities:** `{"roomPreference":[],"dislikedFeatures":[],"leadScore":"low"}`
- **Retrieved FAQs:**
  - เวลาเช็กอินและเช็กเอาต์คือกี่โมง
  - โรงแรมมีที่จอดรถไหม
  - มีห้องสำหรับครอบครัวไหม
  - ห้องไหนเหมาะสำหรับพักสองคน
  - จองผ่านเว็บได้ไหม

---

### 3. สิ่งอำนวยความสะดวกที่ไม่มี (Missing Fact - สระว่ายน้ำ)

**User Message:**
```txt
มีสระว่ายน้ำหรือฟิตเนสให้ใช้ไหมครับ
```

**AI Response:**
```txt
ต้องขออภัยด้วยนะคะ ทางโรงแรมไม่มีบริการสระว่ายน้ำหรือฟิตเนสค่ะ หากคุณลูกค้าต้องการสอบถามข้อมูลด้านอื่นเพิ่มเติม เช่น รายละเอียดห้องพักหรือสิ่งอำนวยความสะดวกส่วนอื่น สามารถสอบถามได้เลยนะคะ ยินดีให้บริการค่ะ
```

**Metadata:**
- **Intent:** `amenities_question`
- **Handoff:** `No`
- **AI Provider / Model:** `gemini` / `gemini-3.1-flash-lite`
- **Extracted Entities:** `{"roomPreference":[],"dislikedFeatures":[],"leadScore":"low"}`
- **Retrieved FAQs:**
  - โรงแรมมีที่จอดรถไหม
  - มีห้องสำหรับครอบครัวไหม
  - เวลาเช็กอินและเช็กเอาต์คือกี่โมง
  - จองผ่านเว็บได้ไหม
  - ห้องไหนเหมาะสำหรับพักสองคน

---

### 4. แนะนำห้องพักสำหรับ 3 คน (Room Recommendation)

**User Message:**
```txt
มาพักกัน 3 คน แนะนำห้องไหนดี ราคาเท่าไหร่
```

**AI Response:**
```txt
สำหรับการเข้าพัก 3 ท่าน แนะนำเป็นห้อง Family Twin ค่ะ ห้องนี้รองรับได้ 3-4 ท่าน พื้นที่กว้างขวางและมีเตียงแยกนอนสบาย ราคาเริ่มต้นอยู่ที่ 1,900 บาทต่อคืนค่ะ (ราคาอาจเปลี่ยนแปลงตามจำนวนผู้เข้าพัก)

หากสนใจจองห้องพัก สามารถตรวจสอบวันเข้าพักและจองผ่านระบบออนไลน์ได้ที่ https://example.com/booking นะคะ หรือหากมีคำถามเพิ่มเติมสอบถามได้เลยค่ะ
```

**Metadata:**
- **Intent:** `room_recommendation`
- **Handoff:** `No`
- **AI Provider / Model:** `gemini` / `gemini-3.1-flash-lite`
- **Extracted Entities:** `{"guests":3,"roomPreference":[],"dislikedFeatures":[],"leadScore":"medium"}`
- **Retrieved FAQs:**
  - มีห้องสำหรับครอบครัวไหม
  - ห้องไหนเหมาะสำหรับพักสองคน
  - จองผ่านเว็บได้ไหม
  - โรงแรมมีที่จอดรถไหม
  - เวลาเช็กอินและเช็กเอาต์คือกี่โมง

---

### 5. ขอคุยกับแอดมิน (Handoff Request)

**User Message:**
```txt
ขอบุคคลจริงตอบหน่อยครับ หรือขอคุยกับแอดมิน
```

**AI Response:**
```txt
ได้ค่ะ แอดมินยินดีดูแลนะคะ หากคุณลูกค้ามีคำถามหรือต้องการสอบถามรายละเอียดเพิ่มเติม สามารถพิมพ์ทิ้งไว้ได้เลยค่ะ ทีมโรงแรมจะรีบเข้ามาดูแลและตอบกลับให้ข้อมูลโดยเร็วที่สุดนะคะ
```

**Metadata:**
- **Intent:** `handoff_request`
- **Handoff:** `Yes (admin_request)`
- **AI Provider / Model:** `gemini` / `gemini-3.1-flash-lite`
- **Extracted Entities:** `{"roomPreference":[],"dislikedFeatures":[],"leadScore":"low"}`
- **Retrieved FAQs:**
  - จองผ่านเว็บได้ไหม
  - มีห้องสำหรับครอบครัวไหม
  - เวลาเช็กอินและเช็กเอาต์คือกี่โมง
  - ห้องไหนเหมาะสำหรับพักสองคน
  - โรงแรมมีที่จอดรถไหม

---

### 6. การจองพร้อมจอง (Booking Ready)

**User Message:**
```txt
จองห้อง Standard Queen พัก 2 คน คืนนี้ครับ ชื่อ เอกพล เบอร์ 0817777777
```

**AI Response:**
```txt
สวัสดีค่ะคุณเอกพล ยินดีที่ได้ดูแลนะคะ สำหรับการจองห้องพัก Standard Queen สำหรับ 2 ท่าน ในวันที่ 26-27 พฤษภาคม 2569 ยอดรวมเบื้องต้นอยู่ที่ 1,200 บาทค่ะ (ราคาเริ่มต้น อาจเปลี่ยนตามวันเข้าพัก)

หากคุณเอกพลพร้อมจอง สามารถดำเนินการผ่านระบบเว็บได้ที่ลิงก์นี้เลยนะคะ https://example.com/booking

หากต้องการสอบถามข้อมูลเพิ่มเติมหรือให้ทีมงานช่วยดูแลส่วนไหน แจ้งได้เลยนะคะ หากต้องตรวจสอบรายละเอียดเพิ่มเติม ทีมโรงแรมจะรับช่วงต่อให้ค่ะ
```

**Metadata:**
- **Intent:** `booking_ready`
- **Handoff:** `Yes (booking_ready)`
- **AI Provider / Model:** `gemini` / `gemini-3.1-flash-lite`
- **Extracted Entities:** `{"roomTypeName":"Standard Queen","checkIn":"2026-05-26","checkOut":"2026-05-27","guests":2,"guestName":"เอกพล","phone":"0817777777","leadScore":"high"}`
- **Retrieved FAQs:**
  - ห้องไหนเหมาะสำหรับพักสองคน
  - จองผ่านเว็บได้ไหม
  - มีห้องสำหรับครอบครัวไหม
  - เวลาเช็กอินและเช็กเอาต์คือกี่โมง
  - โรงแรมมีที่จอดรถไหม

---

