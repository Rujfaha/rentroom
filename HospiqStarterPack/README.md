# HospiqStarterPack

Standalone Next.js app for the Hospiq AI Hotel Starter Pack.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm test
npm run lint
npm run build
```

## Environment

Copy `.env.example` to `.env.local` and fill in the Supabase and AI provider values for the new Starter Pack project.

## Boundaries

- This app must not import from the parent `rentroom` app.
- `rentroom` is reference material for Pro Pack behavior only.
- Starter Pack uses its own Supabase project and migrations.
- Every hotel-owned data flow must be scoped by `hotel_id`.
