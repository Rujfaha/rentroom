# LINE Webhook Local Hand-Test Results

Date: 2026-05-26  
Hotel: Hospiq Handtest Hotel  
Hotel ID: `12af7b54-d63d-4525-9c7a-429726241f49`  
Mode: local mock LINE webhook, signed payload, no real LINE network call  

## Summary

- The mock webhook verified signature, created/updated LINE session, saved incoming chat, generated AI reply, saved outgoing chat, and captured the LINE reply payload.
- Outgoing chat history includes `ai_provider = gemini` and `ai_model = gemini-3.1-flash-lite`.
- Semantic RAG is working from seeded FAQ embeddings and room data.
- Several replies are useful and DB-grounded, but intent classification is still too often `general`.
- Handoff replies work, but need tighter UX rules so they do not add booking CTA when the user simply asks for admin.

---

## Case 1: Parking

**User**

```txt
มีที่จอดรถไหม
```

**AI**

```txt
มีที่จอดรถสำหรับผู้เข้าพัก แต่จำนวนจำกัด แนะนำแจ้งโรงแรมล่วงหน้าหากต้องการจอดรถครับ
```

**Webhook**

```json
{
  "handled": 1,
  "replied": 1,
  "handoffCreated": 0
}
```

**DB Signal**

```txt
session.status = open
last_intent = general
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Feedback Notes**

- Answer quality is good and grounded in FAQ.
- Intent should probably be `amenities_question` or `policy_question`, not `general`.

---

## Case 2: Check-In / Check-Out

**User**

```txt
เช็กอินกี่โมง เช็กเอาต์กี่โมง
```

**AI**

```txt
เช็กอินได้ตั้งแต่ 14:00 น. และเช็กเอาต์ก่อน 12:00 น. ครับ
```

**Webhook**

```json
{
  "handled": 1,
  "replied": 1,
  "handoffCreated": 0
}
```

**DB Signal**

```txt
session.status = open
last_intent = general
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Feedback Notes**

- Answer quality is good and concise.
- Intent should probably be `policy_question`, not `general`.

---

## Case 3: Two Guests / Room Recommendation

**User**

```txt
พักสองคนแนะนำห้องไหน ราคาเท่าไหร่
```

**AI**

```txt
สำหรับ 2 ท่าน แนะนำ Standard Queen ราคาเริ่มต้น 1,200 บาท เหมาะกับการพักระยะสั้นและเดินทางสะดวกครับ ขณะนี้มีห้องว่างพร้อมให้บริการ 2 ห้อง หากสนใจจองสามารถดูรายละเอียดเพิ่มเติมหรือจองผ่านระบบออนไลน์ได้ที่ https://example.com/booking ครับ
```

**Webhook**

```json
{
  "handled": 1,
  "replied": 1,
  "handoffCreated": 0
}
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

**Feedback Notes**

- Good: room recommendation, price, availability, and CTA are grounded.
- This is the strongest example so far.

---

## Case 4: Family Room

**User**

```txt
มากัน 4 คน มีห้องครอบครัวไหม
```

**AI**

```txt
มี Family Twin สำหรับ 3-4 ท่าน ราคาเริ่มต้น 1,900 บาท และสามารถเสริมเตียงได้ตามเงื่อนไขห้องครับ หากคุณลูกค้าพร้อมจอง สามารถตรวจสอบสถานะห้องว่างและดำเนินการผ่านระบบ web booking ได้ที่ https://example.com/booking ครับ
```

**Webhook**

```json
{
  "handled": 1,
  "replied": 1,
  "handoffCreated": 0
}
```

**DB Signal**

```txt
session.status = open
last_intent = general
memory.bookingLead.guests = 4
memory.bookingLead.roomTypeName = ห้องครอบครัว
memory.bookingLead.leadScore = medium
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Feedback Notes**

- Answer quality is good.
- Intent should probably be `room_recommendation`, `room_inquiry`, or `availability`, not `general`.
- `roomTypeName` memory is Thai generic text instead of matching DB roomtype `Family Twin`; this is acceptable for raw extraction but should be normalized later.

---

## Case 5: Tonight Availability

**User**

```txt
คืนนี้มีห้องว่างไหม
```

**AI**

```txt
สำหรับคืนนี้ โรงแรมมีห้องว่างดังนี้ครับ:

1. Standard Queen: ว่าง 2 ห้อง (สำหรับ 1-2 ท่าน ราคาเริ่มต้น 1,200 บาท)
2. Family Twin: ว่าง 1 ห้อง (สำหรับ 3-4 ท่าน ราคาเริ่มต้น 1,900 บาท)

หากคุณสนใจจองห้องพัก สามารถทำรายการผ่านระบบ web booking ได้ที่นี่ครับ: https://example.com/booking
```

**Webhook**

```json
{
  "handled": 1,
  "replied": 1,
  "handoffCreated": 0
}
```

**DB Signal**

```txt
session.status = open
last_intent = general
memory.bookingLead.checkIn = 2026-05-26
memory.bookingLead.checkOut = 2026-05-27
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Feedback Notes**

- Answer is useful and DB-grounded.
- Intent should be `availability`, not `general`.
- The availability count uses current room status from mock data. In production this should combine rooms + booking calendar, not just room status.

---

## Case 6: Booking-Ready Lead

**User**

```txt
อยากจอง Standard Queen คืนนี้ 2 คน ชื่อสมชาย เบอร์ 0812345678
```

**AI**

```txt
รับทราบครับ คุณสมชาย สำหรับห้อง Standard Queen คืนนี้ยังมีว่างครับ ราคาเริ่มต้น 1,200 บาท คุณสามารถดำเนินการจองผ่านระบบออนไลน์ได้ที่ https://example.com/booking ครับ หากต้องตรวจสอบรายละเอียดเพิ่มเติม ทีมโรงแรมจะรับช่วงต่อครับ
```

**Webhook**

```json
{
  "handled": 1,
  "replied": 1,
  "handoffCreated": 1
}
```

**DB Signal**

```txt
session.status = handoff
last_intent = general
memory.bookingLead.guestName = สมชาย
memory.bookingLead.phone = 0812345678
memory.bookingLead.guests = 2
memory.bookingLead.roomTypeName = Standard Queen
memory.bookingLead.leadScore = high
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Feedback Notes**

- Good: extracts lead details and triggers handoff.
- Intent should be `booking_ready`, not `general`.
- Reply tone is acceptable, but the booking/handoff policy could be clearer: either send webbooking link or say admin will confirm, not both unless policy says so.

---

## Case 7: Human Admin Request

**User**

```txt
ขอคุยกับแอดมินหน่อย
```

**AI**

```txt
ยินดีค่ะ หากต้องการสอบถามข้อมูลเพิ่มเติมหรือให้แอดมินดูแลในส่วนไหน สามารถแจ้งรายละเอียดไว้ได้เลยนะคะ หากต้องการจองห้องพัก สามารถทำรายการผ่านระบบ web booking ได้ที่ https://example.com/booking ค่ะ หากต้องตรวจสอบรายละเอียดเพิ่มเติม ทีมโรงแรมจะรับช่วงต่อให้ค่ะ
```

**Webhook**

```json
{
  "handled": 1,
  "replied": 1,
  "handoffCreated": 1
}
```

**DB Signal**

```txt
session.status = handoff
last_intent = general
memory.handoffPending = true
outgoing.ai_provider = gemini
outgoing.ai_model = gemini-3.1-flash-lite
```

**Feedback Notes**

- Handoff event is correctly created.
- Reply should be shorter and should not include booking link unless the user asked about booking.
- Intent should be `handoff_request`, not `general`.

---

## Recommended Fixes Before Real LINE Test

1. Improve intent router so Thai policy, availability, booking-ready, and handoff messages do not fall back to `general`.
2. Add a handoff reply policy: when user asks for admin, keep the reply short and do not add booking CTA.
3. Normalize extracted `roomTypeName` against actual DB roomtype names where possible.
4. For real production availability, combine room status with booking date ranges instead of using room status only.
5. Keep the current semantic RAG path; answer grounding is already useful for FAQ and room recommendation cases.
