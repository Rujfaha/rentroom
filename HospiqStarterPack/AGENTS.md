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

## Environment Variables

- Do not rename environment variables without permission.
- Do not expose secret values in client-side code.
- Public frontend variables must follow the framework convention, such as `NEXT_PUBLIC_` for Next.js.
- If an environment variable is missing, document it clearly.
- Never hardcode production secrets, API keys, tokens, or credentials.

---

## Database and API Rules

- Do not change database schema without explaining the reason.
- Do not modify API response shapes unless required.
- Preserve backward compatibility when possible.
- Validate user input before writing to the database.
- Keep server-side logic secure.
- Avoid trusting client-provided values for permissions, prices, roles, or ownership.

---

## Logging and Debugging

- Keep useful logs during development.
- Remove noisy debug logs before finalizing unless they are intentionally part of the system.
- For important business actions, preserve meaningful logs or audit trails when the project already uses them.
- Do not log sensitive data such as passwords, tokens, full payment data, or private user information.

---

## Lint and Build Rules

- Always prefer fixing the real cause of a lint or TypeScript error.
- Do not silence errors with `any`, `// eslint-disable`, or `@ts-ignore` unless absolutely necessary.
- If an ignore comment is required, explain why.
- Do not remove code only to make lint pass unless the code is truly unused.
- Run the most relevant command after changes.

Recommended commands:

```bash
npm run lint
npm run build
npm run dev
```

## During Editing

- Keep changes minimal and focused.
- Fix one issue at a time.
- Preserve existing working behavior.
- Follow the current folder structure.
- Follow the current UI style.
- Do not introduce unnecessary dependencies.
- Do not remove validation, error handling, logging, or permission checks.
- Do not rename files, routes, database fields, or environment variables unless necessary.

---

## After Editing

After editing code, summarize:

- What changed.
- Files edited.
- Commands run.
- Whether lint, build, or test passed.
- Any remaining risks.
- Recommended next step.

If a command was not run, clearly say why.

---

## Code Style

- Keep components small and readable.
- Avoid large `useEffect` blocks.
- Extract reusable logic into hooks or utilities.
- Avoid scattered hardcoded strings.
- Use constants for route paths, query keys, status values, role names, and repeated labels.
- Do not change existing behavior unless requested.
- Prefer clear and explicit code over clever code.
- Keep naming consistent with the existing codebase.
- Do not mix unrelated responsibilities in the same component.
- Avoid deeply nested logic when it can be split into smaller functions.
- Keep API calls, formatting logic, validation logic, and UI rendering separated when practical.

---

## Planning and Scalability

- Before making code changes, read `AGENTS.md` and any relevant handoff or skill files.
- Always make a short plan before editing, even for small changes.
- Design code so future agents can extend it without rewriting unrelated flows.
- Centralize repeated business rules, assistant persona rules, labels, statuses, and formatting policies.
- Prefer small modules with clear ownership over scattered hardcoded strings.
- Keep data facts, business logic, formatting, and provider integration separated when practical.
- Do not duplicate logic across flows just to ship faster; extract a helper or config when the same rule is needed in more than one place.

---

## Before Editing

Before editing code, explain briefly:

- What issue is being fixed.
- What files will likely be changed.
- What approach will be used.
- Any possible risk.

Keep the explanation short and practical.

Do not rewrite unrelated code.

Do not make broad architecture changes unless explicitly requested.

---

## Reaching the Rate Limit of Codex or Another Agent

When Codex or another AI coding agent reaches its rate limit, do not continue by guessing, rewriting large parts of the project, or starting from scratch.

Rate limits are normal for AI coding tools and may depend on the plan, task size, task complexity, and whether the task runs locally or in the cloud. The project must be structured so another agent or developer can continue safely without losing context.

### Required Behavior When Rate Limited

1. Stop making new code changes immediately.
2. Summarize the current progress clearly.
3. List completed tasks.
4. List unfinished tasks.
5. List files that were edited.
6. Explain known bugs, errors, or warnings.
7. Mention commands that were already run.
8. Mention commands that still need to be run.
9. Do not delete or rewrite working code without a clear reason.
10. Leave the project in a state that another agent can safely continue from.

When rate limited, create or update `AGENT_HANDOFF.md` in the project root.
Do not only summarize in chat.
The handoff must be saved as a real markdown file so the next agent can read it.

---

## Handoff Format

When rate limited or stopping work, create or update a handoff note using this format:

````md
## Agent Handoff Note

### Current Status

Briefly explain what has been completed and what the project currently does.

### Completed Work

- [x] Task 1
- [x] Task 2

### Unfinished Work

- [ ] Task 1
- [ ] Task 2

### Files Changed

- `path/to/file.tsx` - short explanation
- `path/to/file.ts` - short explanation

### Known Issues

- Describe current bugs, broken UI, missing logic, type errors, lint errors, or build errors.

### Commands Already Run

```bash
npm install
npm run dev
npm run lint
```

### Commands To Run Next

```bash
npm run lint
npm run build
npm run dev
```

### Important Context

Explain important project decisions, architecture choices, environment variables, API routes, database tables, or assumptions.

### Next Recommended Step

Clearly state the next safest task for the next agent or developer.
````

---

## Rules for the Next Agent

The next agent must read the handoff note before making changes.

The next agent should continue from the existing codebase instead of recreating the project. It should first inspect the files mentioned in the handoff note, then check the current errors, then make the smallest safe change needed.

Do not perform large refactors unless the user explicitly asks for them.

Do not change the database schema, authentication flow, API contract, or environment variable names without explaining why.

Do not remove existing features just to make the code simpler.

Do not rewrite unrelated code.

Do not introduce a new UI style unless the user explicitly requests a redesign.

---

## Safe Continuation Strategy

Use this order when continuing after a rate limit or after another agent stopped working:

1. Read `agent.md`.
2. Read the latest handoff note.
3. Inspect the changed files.
4. Run the project locally.
5. Reproduce the current issue.
6. Fix one issue at a time.
7. Run lint, build, or test after meaningful changes.
8. Update the handoff note again before stopping.

---

## Example Message to Another Agent

```txt
Codex reached the rate limit. Continue from the existing codebase.

First, read agent.md and the Agent Handoff Note.
Do not rewrite the whole project.
Inspect the edited files, run the project, find the current error, and fix the next unfinished task only.

After making changes, update the handoff note with:
- what you changed
- files edited
- commands run
- remaining issues
- next recommended step
```

---
