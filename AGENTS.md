## UI Design Rules
- **ห้ามใช้ emoji พ่ำเพื่อ** ในส่วน UI ใด ๆ — ไม่ว่าจะเป็น label, button, badge, option
- ถ้าต้องการ icon ให้ใช้ **SVG icon** (inline) เสมอ เพื่อความเป็นมืออาชีพและ consistent
- Emoji ใช้ได้เฉพาะใน toast message หรือ note/comment ที่ user เป็นคน input เอง
- ตัวอย่าง: แทนที่จะเขียน `🚶 Walk-in` ให้ใช้ `<svg>...</svg> Walk-in`
- ดูระบบปัจจุบันพร้อมหน้าตาการออกแบบและออกแบบตามแนวทางเดิมห้ามผิดเพี้ยน
- mobile first รองรับ responsive ทุกหน้าจอ 

## Code Style
- Keep components small and readable
- Avoid large useEffect blocks
- Extract reusable logic into hooks or utils
- Avoid scattered hardcoded strings
- Use constants for route paths, query keys, status values
- Do not change existing behavior unless requested

## Before Editing
- Explain what files will be changed
- Keep changes minimal
- Do not rewrite unrelated code

## After Editing
- Summarize what changed
- Mention possible risks    

## Folder Structure
- components/ = UI components
- hooks/ = React hooks
- lib/ = service/client/database utilities
- utils/ = pure helper functions
- constants/ = reusable constants
- types/ = shared TypeScript types



## Agent Skills
- กรุณาอ่านและปฏิบัติตามแนวทางการเขียนโค้ดและการแก้ปัญหา Lint ได้ที่ไฟล์ [skill.md](./skill.md)
