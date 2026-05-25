# HospiqStarterPack Agent Rules

- This is a standalone Next.js app.
- Do not import files from `../src` or the parent `rentroom` app.
- Use the parent `rentroom` project only as reference material.
- Use the new Supabase project and migrations in this folder.
- Keep all hotel-scoped queries scoped by `hotel_id`.
- Do not expose service role keys, LINE tokens, or channel secrets to client code.
- Do not use emoji in UI labels, buttons, tabs, badges, cards, menus, or navigation.
- Before editing, explain the issue, files, approach, and risk.
- Before stopping mid-task, update `AGENT_HANDOFF.md`.
- This project uses Next.js 16. Read relevant files in `node_modules/next/dist/docs/` before changing Next.js-specific APIs.
