---
name: rentroom-seo
description: Use when working on SEO, metadata, sitemap, robots, Open Graph, JSON-LD, canonical URLs, or admin SEO settings in this rentroom Next.js/Supabase project.
---

# Arkkarawin SEO

## Core Pattern

- Public SEO is generated through `src/lib/seo.ts`.
- Admin SEO overrides are stored in `hotels.settings.seo`.
- If an admin field is blank, generate metadata from live Supabase data instead of hardcoding copy.
- Prefer hotel data first, then room types, hero images, room images, promotions, attractions, and contacts.
- Keep public metadata truthful to current active content.

## Admin Settings Shape

`hotels.settings.seo` may contain:

- `siteName`
- `titleTemplate`
- `metaTitle`
- `metaDescription`
- `keywords`
- `ogImageUrl`
- `canonicalBaseUrl`
- `googleSiteVerification`
- `allowIndex`

Use additive updates that preserve other `hotels.settings` keys such as `promptpay`.

## Page Rules

- `/` should use dynamic metadata from hotel, active room types, and active hero images.
- `/booking` should be indexable and describe online room booking.
- `/check-booking` must be `noindex` because it handles customer booking lookup.
- Admin, dashboard, login, API, and private pages must be `noindex` or blocked by robots.
- `sitemap.ts` should only include public indexable pages.
- `robots.ts` should allow public pages and disallow private/system routes.

## Structured Data

- Use JSON-LD for `Hotel`.
- Include name, description, URL, phone, email, address, geo coordinates, images, price range, and room offers when available.
- Do not invent reviews, ratings, awards, or amenities that are not in live data.

## UI Rules

- Follow root `AGENTS.md`: no emoji in UI labels, buttons, badges, or options.
- Use lucide/SVG icons for SEO admin controls.
- Keep CMS UI mobile-first and visually consistent with the current forest/gold/cream admin style.

## Verification Checklist

Run:

```bash
npm run lint
npm run build
```

Check:

- Home page has title, description, canonical, Open Graph, Twitter card, and Hotel JSON-LD.
- Booking page has a booking-specific title and description.
- Check booking page is noindex.
- `/sitemap.xml` lists only public pages.
- `/robots.txt` blocks private/system routes.

