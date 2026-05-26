# LINE Webhook Persona + Sales After Results

Date: 2026-05-26  
Hotel: Hospiq Handtest Hotel  
Hotel ID: `12af7b54-d63d-4525-9c7a-429726241f49`  
Mode: local mock LINE webhook, signed payload, no real LINE network call  

## Summary

This run validates the first implementation of:

- Female-presenting hotel service persona.
- Hospitality-first framing.
- Light sales assistance.
- More specific intent routing.
- Booking detail summary before booking CTA.
- Handoff reply without unrelated booking link.

The system still uses DB facts, FAQ semantic retrieval, and room context as the source of truth. No hotel-specific reply templates were added to runtime code.

---

## Case 1: Parking

**User**

```txt
มีที่จอดรถไหม
```

**AI**

```txt
มีที่จอดรถรองรับสำหรับผู้เข้าพัก ลูกค้าสามารถนำรถมาได้ค่ะ หากคุณลูกค้าสนใจสำรองห้องพัก สามารถแจ้งจำนวนผู้เข้าพักเพื่อให้ทางเราแนะนำห้องที่เหมาะสมได้นะคะ
```

**DB Signal**

```txt
session.status = open
last_intent = amenities_question
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Result**

- Improved from `general` to `amenities_question`.
- Parking answer now leads with support instead of limitation.
- Sales assistance is soft, but may still be trimmed if user wants pure FAQ answers.

---

## Case 2: Availability Tonight

**User**

```txt
คืนนี้มีห้องว่างไหม
```

**AI**

```txt
คืนนี้มีห้องว่างพร้อมให้บริการค่ะ โดยมีรายละเอียดดังนี้ค่ะ

- Standard Queen: สำหรับ 1-2 ท่าน ราคาเริ่มต้น 1,200 บาท (เหลือ 2 ห้อง)
- Family Twin: สำหรับ 3-4 ท่าน ราคาเริ่มต้น 1,900 บาท (เหลือ 1 ห้อง)

ไม่ทราบว่าคุณลูกค้าเดินทางกี่ท่านคะ เพื่อที่แอดมินจะได้แนะนำห้องที่เหมาะสมที่สุดให้ค่ะ
```

**DB Signal**

```txt
session.status = open
last_intent = availability
memory.bookingLead.checkIn = 2026-05-26
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Result**

- Improved from `general` to `availability`.
- Answer now summarizes room options and asks a useful follow-up.
- Minor follow-up: replace `แอดมิน` with `Hospiq` or neutral support wording when the AI is still handling the conversation.

---

## Case 3: Two Guests / Room Recommendation

**User**

```txt
พักสองคนแนะนำห้องไหน ราคาเท่าไหร่
```

**AI**

```txt
สำหรับ 2 ท่าน แนะนำห้อง Standard Queen ค่ะ ราคาเริ่มต้น 1,200 บาท เป็นห้องมาตรฐานที่เหมาะกับการพักระยะสั้นและเดินทางสะดวกมากค่ะ

ตอนนี้ห้องพักยังว่างอยู่ หากคุณลูกค้าสนใจจอง สามารถดูรายละเอียดเพิ่มเติมหรือทำการจองผ่านลิงก์นี้ได้เลยนะคะ https://example.com/booking 

ไม่ทราบว่าต้องการสอบถามข้อมูลส่วนไหนเพิ่มเติมไหมคะ เช่น เรื่องที่จอดรถหรือเวลาเช็กอินค่ะ?
```

**DB Signal**

```txt
session.status = open
last_intent = room_recommendation
memory.bookingLead.guests = 2
memory.bookingLead.leadScore = medium
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Result**

- Strong room recommendation.
- Price and availability are grounded in DB context.
- CTA is acceptable for recommendation, but can be made softer if needed.

---

## Case 4: Booking-Ready Lead

**User**

```txt
อยากจอง Standard Queen คืนนี้ 2 คน ชื่อสมชาย เบอร์ 0812345678
```

**AI**

```txt
สวัสดีค่ะคุณสมชาย ยินดีที่ได้ดูแลนะคะ สำหรับห้อง Standard Queen ที่คุณสมชายสนใจ ขณะนี้ยังมีห้องว่างพร้อมให้บริการสำหรับ 2 ท่านค่ะ

ขออนุญาตทวนข้อมูลการจองเบื้องต้นนะคะ:
- ห้องพัก: Standard Queen
- จำนวนผู้เข้าพัก: 2 ท่าน
- ชื่อผู้จอง: คุณสมชาย
- เบอร์ติดต่อ: 0812345678

หากคุณสมชายพร้อมดำเนินการจอง สามารถทำรายการผ่านระบบออนไลน์ได้ที่ลิงก์นี้เลยค่ะ https://example.com/booking หากต้องการสอบถามข้อมูลเพิ่มเติมหรือให้ทางโรงแรมช่วยเหลือด้านใด แจ้งได้เลยนะคะ
```

**DB Signal**

```txt
session.status = handoff
last_intent = booking_ready
memory.bookingLead.guestName = สมชาย
memory.bookingLead.phone = 0812345678
memory.bookingLead.guests = 2
memory.bookingLead.roomTypeName = Standard Queen
memory.bookingLead.leadScore = high
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Result**

- Improved from `general` to `booking_ready`.
- Memory summary is working and useful.
- Handoff event is created as expected for booking-ready lead.

---

## Case 5: Human Admin Request

**User**

```txt
ขอคุยกับแอดมินหน่อย
```

**AI**

```txt
สวัสดีค่ะ ยินดีให้บริการนะคะ หากคุณลูกค้าต้องการสอบถามข้อมูลเพิ่มเติมหรือต้องการความช่วยเหลือด้านใดเป็นพิเศษ สามารถแจ้งไว้ได้เลยนะคะ เดี๋ยวแอดมินจะรีบดูแลให้ค่ะ
```

**DB Signal**

```txt
session.status = handoff
last_intent = handoff_request
memory.handoffPending = true
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Result**

- Improved from `general` to `handoff_request`.
- Handoff event is created.
- Booking link is no longer included.
- Reply could be even shorter if desired.

---

## Overall Improvements

- Intent routing improved:
  - parking -> `amenities_question`
  - availability -> `availability`
  - room recommendation -> `room_recommendation`
  - booking lead -> `booking_ready`
  - admin request -> `handoff_request`
- Persona now uses feminine Thai service tone more consistently.
- Availability and recommendation replies are more helpful and sales-assistive.
- Booking-ready flow now summarizes customer details.
- Handoff flow no longer adds unrelated booking CTA.

## Remaining Follow-Ups

1. Replace `แอดมิน` with `Hospiq` or neutral wording when AI is still assisting and not handing off.
2. Tune sales CTA frequency so FAQ-only questions do not feel like sales prompts.
3. Add room type normalization so generic extracted names map to DB roomtype names.
4. Add stricter golden tests for answer shape once the user approves the tone.
5. For production availability, combine room status with booking date ranges.
