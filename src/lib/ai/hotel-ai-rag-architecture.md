# Hotel AI — RAG Architecture Guideline
---

## ภาพรวม

ระบบใหม่ใช้ **RAG (Retrieval-Augmented Generation)** — ดึง data จริงของแต่ละ hotel มา inject ใน prompt แล้วให้ LLM ตอบเอง

---

## File Structure ปัจจุบัน

```
ai/
├── __tests__/
└── providers/
    ├── ai-knowledge.ts        # hotel data context builder
    ├── assistant-profile.ts   # identity/tone config
    ├── guardrails.ts          # output safety rules
    ├── handoff.ts             # escalation logic
    ├── hotel-context.ts       # HotelContext assembler
    ├── intent-router.ts       # intent
    ├── language.ts            # language detection
    ├── line-concierge.ts      # LINE entry point / orchestrator
    ├── provider.ts            # LLM provider (Gemini Flash)
    ├── reply-composer.ts      # reply composer
    └── response-generator.ts  # LLM call wrapper
```

---

## Core Architecture

### Request Flow

```
User message (LINE)
       │
       ▼
1. language detection          (language.ts)
       │
       ▼
2. keyword fast-lane           (ถ้าจับได้ → skip semantic search)
   ตัวอย่าง: ชื่อห้อง, promptpay, เบอร์โทร
       │
       ▼ (ถ้า keyword ไม่เจอ)
3. semantic search             (embedding + pgvector)
   หา FAQ ที่เกี่ยวข้อง top 3-5 (score > threshold)
       │
       ▼
4. hotel data fetch            (hotel-context.ts)
   rooms, prices, availability, promotions, payment
       │
       ▼
5. system prompt assembly      (line-concierge.ts)
   inject: identity + hotel data + FAQ examples + memory + rules
       │
       ▼
6. LLM call                    (provider.ts → Gemini Flash)
   ตอบจาก context จริง ไม่มี hardcode
       │
       ▼
7. guardrails check            (guardrails.ts)
       │
       ▼
8. reply + update memory       (conversation memory)
```

---

## System Prompt Structure (5 Layers)

```
[Layer 1] Identity & Tone
  - ดึงจาก hotel_ai_settings (assistant_name, tone)
  - ตัวอย่าง: "คุณคือ {assistant_name} ผู้ช่วยของ {hotel_name} ตอบด้วย tone: {tone}"

[Layer 2] Hotel Data Context
  - rooms: name, basePrice, maxGuests, description, amenities, style
  - promotions: title, discountText
  - payment: promptPayConfigured, accountName
  - ดึงจาก DB ตาม hotelId ทุก request

[Layer 3] FAQ Examples (dynamic inject)
  - ดึงจาก hotel_faqs ที่ semantic search เจอ
  - format: "Q: {question}\nA: {answer}"
  - inject เฉพาะที่ score > threshold (แนะนำ 0.75)
  - ใช้เป็น few-shot examples ไม่ใช่ hardcode answer

[Layer 4] Behavior Rules
  - ถามทีละคำถาม ไม่ถามหลายคำถามพร้อมกัน
  - ถ้า group > {handoff_threshold} คน → ส่งต่อทีมงาน
  - แนบ booking URL เมื่อมีข้อมูลครบ (checkIn, checkOut, guests)
  - ถ้าไม่มีข้อมูลใน context → บอกตามตรง ไม่ hallucinate
  - ดึง policy จาก hotel_ai_settings (booking_cta_policy, handoff_policy, fallback_policy)

[Layer 5] Output Format
  - ภาษาตาม user message (auto-detect)
  - ไม่ใช้ markdown, bullet, header
  - ความยาวไม่เกิน {max_length} ตัวอักษร
  - paragraph break ด้วย newline เท่านั้น
```

---

## Database Schema (จาก migration)

### `hotel_ai_settings`
Config per hotel — identity, tone, policy ทั้งหมด

| column | ใช้ทำอะไร |
|---|---|
| `assistant_name` | ชื่อ AI ใน Layer 1 |
| `tone` | formal / friendly / concise → Layer 1 |
| `supported_languages` | validate ภาษาที่รองรับ |
| `booking_cta_policy` | เงื่อนไขการแนบ URL → Layer 4 |
| `handoff_policy` | เงื่อนไข escalation → Layer 4 |
| `fallback_policy` | ตอบอะไรเมื่อ LLM ไม่มีข้อมูล → Layer 4 |

### `hotel_faqs`
Few-shot examples per hotel — ใช้ใน Layer 3

| column | ใช้ทำอะไร |
|---|---|
| `question` | embed เป็น vector สำหรับ semantic search |
| `answer` | inject เข้า prompt เป็น example การตอบ |
| `keywords` | keyword fast-lane ก่อน semantic search |
| `category` | filter เบื้องต้นก่อน search |
| `language` | match กับภาษา user |

> **หมายเหตุ:** ต้องเพิ่ม column `embedding vector(768)` สำหรับ pgvector  
> และ index: `CREATE INDEX ON hotel_faqs USING ivfflat (embedding vector_cosine_ops)`

### `hotel_ai_testcases`
Golden dataset สำหรับ evaluate ระบบ

| column | ใช้ทำอะไร |
|---|---|
| `user_message` | input ที่ใช้ทดสอบ |
| `expected_intent` | intent ที่ควรจับได้ (สำหรับ logging) |
| `expected_behavior` | พฤติกรรมที่ควรเกิด เช่น "ถามวันที่กลับ" |
| `golden_reply` | ตัวอย่างคำตอบที่ดี ใช้ compare กับ LLM output |

---

## Semantic Search Flow

```typescript
// 1. embed user message
const queryVec = await embedText(userMessage)  // text-embedding-004

// 2. keyword fast-lane (ถ้าเจอ → ข้าม semantic)
const keywordMatch = await db.query(`
  SELECT * FROM hotel_faqs
  WHERE hotel_id = $1
    AND language = $2
    AND is_active = true
    AND keywords @> $3::jsonb
  LIMIT 3
`, [hotelId, language, JSON.stringify([keyword])])

// 3. semantic search (ถ้า keyword ไม่เจอ)
const semanticMatch = await db.query(`
  SELECT *, 1 - (embedding <=> $1) AS score
  FROM hotel_faqs
  WHERE hotel_id = $2
    AND language = $3
    AND is_active = true
  ORDER BY score DESC
  LIMIT 5
`, [queryVec, hotelId, language])

// 4. filter by threshold
const relevant = semanticMatch.filter(f => f.score > 0.75)
```

---

## Conversation Memory

ยังคงใช้ `LineConversationMemory` structure เดิม แต่ LLM เป็นคน update ผ่าน structured output

```typescript
interface LineConversationMemory {
  bookingLead: {
    checkIn?: string
    checkOut?: string
    guests?: number
    roomTypeName?: string
    isGroupBooking?: boolean
  }
  handoffPending?: boolean
  language?: SupportedLineLanguage
}
```

LLM ต้อง return สองส่วนพร้อมกัน:
1. `reply` — ข้อความตอบ user
2. `memoryUpdate` — ข้อมูลที่สะสมได้จาก message นี้

---

## หลักการสำคัญ — No Hardcode, No Template Hardcode

> กฎนี้ apply กับทุกไฟล์ใน `lib/ai` โดยไม่มีข้อยกเว้น

### No Hardcode
ห้าม hardcode ข้อความที่ user จะเห็นลงใน code โดยตรง

```typescript
// ❌ ห้ามทำ
return "ได้ค่ะ สามารถเริ่มจองผ่านหน้าเว็บได้เลย"
return "ตอนนี้ยังไม่พบโปรโมชั่นที่เปิดใช้งานค่ะ"
return `ห้องที่ราคาถูกที่สุดตอนนี้คือ ${roomName} ค่ะ`

// ✅ ทำแบบนี้
// ให้ LLM generate จาก context — ไม่มี string ไทยใน code
```

### No Template Hardcode
ห้ามใช้ template string เป็น "โครงประโยค" แล้วแค่เติม variable เข้าไป — นั่นคือ hardcode tone และ structure

```typescript
// ❌ ห้ามทำ — template คือ hardcode ที่ใส่ variable
const reply = `วันที่ ${checkIn} ถึง ${checkOut} สำหรับ ${guests} ท่าน มีตัวเลือกดังนี้ค่ะ`

// ❌ ห้ามทำ — i18n object คือ hardcode หลายภาษา
const templates = {
  th: { availability: "ช่วง {dateText} มีตัวเลือกว่างดังนี้ค่ะ" },
  en: { availability: "Available options for {dateText}:" },
}

// ✅ ทำแบบนี้
// inject data จริงเข้า prompt แล้วให้ LLM เลือกภาษาและ tone เอง
```

## สิ่งที่ไม่ควรทำอีกต่อไป

| เดิม | ใหม่ |
|---|---|
| regex match intent | LLM classify จาก context |
| hardcode string ไทย ใน code | string อยู่ใน DB (hotel_faqs, hotel_ai_settings) |
| if/else chain ใน reply-composer | LLM เลือกเองจาก few-shot examples |
| intent → fixed reply mapping | intent เป็นแค่ logging signal ไม่ใช่ routing key |
| เพิ่ม hotel ใหม่ = แก้ code | เพิ่ม hotel ใหม่ = insert DB record |

---

## Embedding Model แนะนำ

เพราะใช้ Gemini stack อยู่แล้ว:

- **Model:** `text-embedding-004` (Google)
- **Dimension:** 768
- **Vector DB:** pgvector ใน Postgres เดิม (ไม่ต้องเพิ่ม infrastructure)
- **Distance metric:** cosine (`<=>`)

---

## Test Case Usage

`hotel_ai_testcases` ใช้สำหรับ:

1. **Regression test** — รัน LLM กับ `user_message` ทุก case แล้วเปรียบกับ `golden_reply`
2. **Behavior check** — verify ว่า `expected_behavior` เกิดขึ้นจริง เช่น "ถามวันที่กลับ"
3. **Prompt tuning** — ถ้า test case fail ให้ปรับ system prompt หรือเพิ่ม FAQ ไม่ใช่แก้ code

---

## สรุป What Agent ต้องทำ

1. **เพิ่ม `embedding` column** ใน `hotel_faqs` และสร้าง ivfflat index
2. **สร้าง embedding pipeline** — เมื่อ insert/update FAQ ให้ embed `question` อัตโนมัติ
3. **สร้าง test runner** — ใช้ `hotel_ai_testcases` evaluate คุณภาพ reply
