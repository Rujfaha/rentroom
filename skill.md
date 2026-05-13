# การจัดการ Lint Error: `any` ใน TypeScript

## สาเหตุของ Lint Error ที่เกี่ยวกับ `any`
ใน TypeScript การใช้ type `any` ถือเป็นการปิดการตรวจสอบ type (Type Checking) ของตัวแปรนั้นๆ ซึ่งจะทำให้กฎของ Linter (เช่น `@typescript-eslint/no-explicit-any`) แจ้งเตือน error หรือ warning 

## เมื่อใช้ `any` แล้วเกิดอะไรขึ้น?
1. **สูญเสีย Type Safety:** ตัวแปรที่ถูกกำหนดเป็น `any` จะสามารถรับค่าอะไรก็ได้ และเรียกใช้ method หรือเข้าถึง property อะไรก็ได้ ทำให้มีโอกาสเกิด Runtime Error สูง (เช่น การเผลอเรียก `.map()` บนข้อมูลที่ไม่ได้เป็น Array)
2. **ไม่ได้รับความช่วยเหลือจาก IDE:** Editor จะไม่สามารถ Auto-complete หรือแนะนำ property/method ที่ถูกต้องให้ได้
3. **ขัดต่อจุดประสงค์ของ TypeScript:** TypeScript ถูกสร้างมาเพื่อป้องกันบั๊กจากการจัดการ Type ที่ผิดพลาด การใช้ `any` จำนวนมากจึงทำให้ประโยชน์ตรงนี้หายไป

## วิธีแก้ไขไม่ให้เกิด Lint Error
วิธีแก้ไขคือการเปลี่ยน `any` เป็น Type ที่เหมาะสมและเฉพาะเจาะจงมากขึ้น:

1. **ใช้ Type หรือ Interface ที่กำหนดไว้ชัดเจน (Best Practice)**
   ```typescript
   // ❌ ผิด (Lint Error)
   const userData: any = fetchUser();

   // ✅ ถูกต้อง
   interface User {
     id: number;
     name: string;
   }
   const userData: User = fetchUser();
   ```

2. **ใช้ `unknown` แทนเมื่อไม่ทราบ Type ล่วงหน้า**
   `unknown` เป็น Type-safe counterpart ของ `any` ปลอดภัยกว่าเพราะบังคับให้เราต้องตรวจสอบ (Type Narrowing) ก่อนนำไปใช้งานเสมอ
   ```typescript
   // ❌ ผิด (Lint Error)
   function processData(data: any) {
     console.log(data.name); 
   }

   // ✅ ถูกต้อง
   function processData(data: unknown) {
     if (typeof data === 'object' && data !== null && 'name' in data) {
       console.log((data as {name: string}).name);
     }
   }
   ```

3. **ใช้ Generics สำหรับฟังก์ชันหรือ Class ที่รับค่า/คืนค่าได้หลาย Type**
   ```typescript
   // ❌ ผิด (Lint Error)
   function getFirstItem(arr: any[]) {
     return arr[0];
   }

   // ✅ ถูกต้อง
   function getFirstItem<T>(arr: T[]): T {
     return arr[0];
   }
   ```

## Security Hardening: Rate Limit และ Upload

เมื่อเพิ่มหรือแก้ endpoint/action ที่รับ input จาก user ให้ใช้ `src/lib/rate-limit.ts` สำหรับจุดที่ถูกยิงซ้ำได้ง่าย

จุดที่ควรมี rate limit เสมอ:

1. `loginAction`
2. `createWebsiteBooking`
3. `validatePromotionCode`
4. `lookupPublicBooking`
5. upload API routes

แนวทาง key:

1. ใช้ IP จาก `getClientIp(headers)` หรือ `getClientIp(request.headers)`
2. รวม `hotelId` หรือ email/phone เมื่อเกี่ยวข้อง
3. ส่ง error กลางด้วย `getRateLimitErrorMessage()`
4. อย่า log password, token, session cookie, API key หรือ service role key

Threshold ที่ใช้อยู่:

1. Admin login: 10 ครั้งต่อ 10 นาทีต่อ IP
2. Booking create: 5 ครั้งต่อ 10 นาทีต่อ hotel/IP
3. Booking create guest: 3 ครั้งต่อ 30 นาทีต่อ hotel/email หรือ hotel/phone
4. Promotion code: 10 ครั้งต่อ 10 นาทีต่อ hotel/IP
5. Public booking lookup: 10 ครั้งต่อ 10 นาทีต่อ email/IP
6. Booking slip upload: 10 ครั้งต่อ 10 นาทีต่อ IP
7. CMS image upload: 20 ครั้งต่อ 10 นาทีต่อ hotel/IP

Upload endpoint ต้องตรวจอย่างน้อย:

1. MIME type จาก server-side
2. file size
3. extension allowlist
4. folder/path allowlist ถ้ารับ path จาก form
5. สุ่มหรือสร้างชื่อไฟล์เอง ห้ามใช้ path เต็มจาก user
