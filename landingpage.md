# Prompt: พัฒนาเว็บไซต์ Landing Page และระบบจองห้องพักโรงแรมระดับ Luxury (Next.js + Tailwind CSS)

**บทบาทของคุณ (Role):**
คุณคือ Senior Full-Stack Developer และ UI/UX Expert ที่เชี่ยวชาญการใช้งาน Next.js (App Router) และ Tailwind CSS เป็นพิเศษ คุณให้ความสำคัญกับ Performance (Core Web Vitals), Clean Architecture และการออกแบบระบบที่สเกลได้

**บริบทของโปรเจกต์ (Project Context):**
ฉันมีระบบฐานข้อมูลที่สร้างเตรียมไว้เรียบร้อยแล้ว ต้องการสร้าง Frontend สำหรับเว็บไซต์โรงแรมที่ตั้งอยู่กลางหุบเขา โดยต้องรองรับระบบ CMS เบื้องต้น, ระบบค้นหา และระบบจองห้องพักแบบรวดเร็ว โดยเตรียมโครงสร้างให้พร้อมสำหรับการเชื่อมต่อกับ Admin Dashboard ที่จะสร้างในภายหลัง

---

## 🎨 1. แนวทางการออกแบบ (Design & UI/UX Requirements)
- **Theme & Mood:** เรียบหรู (Luxury) ผสมผสานกับธรรมชาติกลางหุบเขา (Nature & Mountain Retreat)
- **Color Palette:** โทนสีธรรมชาติที่ดูแพง เช่น Deep Forest Green, Earthy Brown, Muted Stone ผสมผสานกับสี Gold หรือ Champagne เพื่อความหรูหรา และมี Whitespace ที่เพียงพอให้ดูสะอาดตา
- **Typography:** ใช้ฟอนต์ที่ดูเรียบหรูและอ่านง่าย (เช่น Serif สำหรับหัวข้อ และ Sans-serif สำหรับเนื้อหา)
- **Responsive:** ต้องเป็น Mobile-First Design และแสดงผลได้อย่างสมบูรณ์แบบบนทุกหน้าจอ (Mobile, Tablet, Desktop)
- **Animations:** ใส่ Transition และ Animation เบื้องต้นที่ดูนุ่มนวล (เช่น Fade-in, Parallax scrolling เบาๆ) ด้วย Tailwind

---

## ⚙️ 2. Tech Stack & Architecture
- **Framework:** Next.js (ใช้ App Router ล่าสุด)
- **Styling:** Tailwind CSS (ใช้ Utility classes และการจัดการ Theme ผ่าน `tailwind.config.js`)
- **State Management / Data Fetching:** ใช้ Server Components ให้มากที่สุดเพื่อให้หน้าเว็บโหลดไว (SEO Friendly) และใช้ Client Components (`"use client"`) เฉพาะส่วนที่มี Interactive
- **Performance:** ใช้ `next/image` สำหรับรูปภาพทั้งหมดเพื่อ Optimize ความเร็ว
- **Type Safety:** TypeScript (สร้าง Interface/Type ให้ครอบคลุม)

---

## 🛠️ 3. ฟีเจอร์หลักที่ต้องการ (Core Features)

### 3.1 ระบบรองรับ CMS (Dynamic Content)
โค้ดจะต้องเขียนให้พร้อมรับข้อมูลจาก Database/API โดยให้สร้างเป็น Mock Data/Interface ไว้ก่อนสำหรับ:
- **Hero Section:** ดึงภาพพื้นหลังแบบสไลด์ และข้อความต้อนรับ
- **Promotions:** จัดการแบนเนอร์หรือการ์ดโปรโมชันที่กำลัง Active
- **Room Details:** แสดงรายละเอียดห้องพัก (ภาพ, ชื่อห้อง, รายละเอียด, สิ่งอำนวยความสะดวก, ราคา)
- **Contact Info:** ข้อมูลการติดต่อ แผนที่ และ Social Media Links

### 3.2 ระบบค้นหาห้องพัก (Search & Filter)
สร้าง Component Search Bar ที่สามารถลอยอยู่บน Hero Section หรือติด Sticky ประกอบด้วยฟิลด์:
- Check-in Date (Date picker)
- Check-out Date (Date picker)
- Guests: Adults (Number)
- Guests: Children (Number)
- ปุ่ม "Check Availability" (ค้นหาห้องว่าง)

### 3.3 ระบบการจองแบบรวดเร็ว (Fast Booking Flow)
- **Guest Checkout:** ลูกค้าสามารถจองได้เลย **โดยไม่ต้อง Login**
- **UI/UX Flow:** รูปแบบฟอร์มที่ใช้งานง่าย ไม่ซับซ้อน (อาจเป็น Multi-step form สั้นๆ: 1. เลือกห้อง -> 2. กรอกข้อมูลส่วนตัวเบื้องต้น -> 3. สรุปการจอง)
- **Verification & Confirmation:** หน้าสรุปการจองที่ชัดเจน พร้อมระบบยืนยันอย่างง่าย (เช่น การแสดง Booking Reference Code และข้อความแจ้งว่าจะส่งข้อมูลไปที่ Email/SMS)

### 3.4 โครงสร้างรองรับ Admin หลังบ้าน (Admin-Ready Architecture)
- แยก Service functions หรือ API Routes สำหรับจัดการข้อมูลอย่างชัดเจน เพื่อให้ Admin Dashboard ที่จะสร้างทีหลังสามารถเรียกใช้เพื่อ CRUD (Create, Read, Update, Delete) ข้อมูลทั้งหมดได้ง่าย
- โครงสร้าง Database Schema (Interface) ต้องออกแบบให้สัมพันธ์กับ UI อย่างสมเหตุสมผล

---

## 📂 4. โครงสร้างไฟล์ที่แนะนำ (Folder Structure)
กรุณาวางโครงสร้างโปรเจกต์แยกส่วนการทำงานให้ชัดเจน ตัวอย่างเช่น:
- `src/app/` (Pages และ Routing ต่างๆ)
- `src/components/` (แยกย่อยเป็น UI ทั่วไป, Forms, Sections)
- `src/lib/` (Utility functions)
- `src/services/` (ฟังก์ชันสำหรับ Fetch ข้อมูล หรือ API calls ที่เตรียมต่อกับ Database จริง)
- `src/types/` (TypeScript Interfaces/Types)

---

## 🚀 5. งานของคุณ (Tasks to Execute)
1. เริ่มต้นด้วยการสร้างหน้า Landing Page (`page.tsx`) ที่ประกอบด้วยส่วนประกอบหลักทั้งหมด (Hero + Search Bar, Featured Rooms, Promotions, Contact)
2. สร้าง Components ย่อยที่กล่าวถึงข้างต้น (เน้นการใช้ Tailwind CSS ในการตกแต่ง)
3. สร้างหน้าหรือ Modal สำหรับ **Booking Flow** ที่ผู้ใช้ไม่ได้ล็อกอินสามารถใช้งานได้จนจบ Process
4. กำหนด Type/Interface (TypeScript) ของข้อมูลต่างๆ ให้ชัดเจน เพื่อรอการนำ Database ที่มีอยู่มาเชื่อมต่อ
5. อธิบายสั้นๆ ว่าจะเชื่อมต่อฐานข้อมูลที่มีอยู่กับโครงสร้างที่คุณเขียนขึ้นมาได้อย่างไรในตอนท้าย

ขอโค้ดที่สะอาด มีคอมเมนต์อธิบาย และพร้อมทำงานได้ทันที!