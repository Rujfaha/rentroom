# Project Context Glossary

## HospiqStarterPack

`HospiqStarterPack` is a standalone Next.js application for the Hospiq AI Hotel Starter Pack. It is created inside the current `rentroom` workspace for convenience, but it must be self-contained so it can later be moved into its own repository without relying on relative imports from `rentroom`.

## rentroom

`rentroom` is the existing project and is treated as the future Pro Pack reference implementation. Its database design, LINE integration, and AI modules may be inspected and selectively copied, but the Starter Pack must not copy the full schema or depend on the existing app structure directly.

## Starter Pack

Starter Pack is the lightweight Hospiq product for small-to-medium accommodations that need a LINE AI assistant, booking lead capture, basic hotel knowledge, AI FAQ, LINE configuration, and onboarding. It is not a full Hotel OS.

## Starter Pack Supabase Project

The Starter Pack uses a new Supabase project and a new database schema. The existing `rentroom` Supabase schema is reference material only and must not be modified or reused wholesale.
