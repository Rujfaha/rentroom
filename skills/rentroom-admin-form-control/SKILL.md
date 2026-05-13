---
name: rentroom-admin-form-control
description: Use when fixing React controlled/uncontrolled input warnings, admin form state bugs, modal form resets, or input value normalization in the rentroom Next.js admin/CMS UI.
---

# Rentroom Admin Form Control

## Goal

Prevent React warnings such as:

- `A component is changing a controlled input to be uncontrolled`
- `A component is changing an uncontrolled input to be controlled`

These warnings usually mean an input `value` or checkbox `checked` changes between `undefined`/`null` and a defined value during the component lifetime.

## Non-Negotiable Rules

- Follow root `AGENTS.md`: no emoji in UI labels, buttons, badges, or options.
- Keep UI mobile-first and consistent with existing forest/gold/cream admin styles.
- Prefer small, targeted changes. Do not rewrite forms only to fix a controlled input warning.
- Preserve existing form submit/server-action behavior unless the bug requires changing it.

## Preferred Pattern

Create local helpers near the form component when no shared helper exists:

```ts
function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function safeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}
```

For controlled text/number/date/select inputs:

```tsx
const [name, setName] = useState<string>(safeString(initialValue));

<input
  value={safeString(name)}
  onChange={(event) => setName(safeString(event.currentTarget.value))}
/>
```

For controlled checkboxes:

```tsx
const [isActive, setIsActive] = useState<boolean>(safeBoolean(initialValue, true));

<input
  type="checkbox"
  checked={Boolean(isActive)}
  onChange={(event) => setIsActive(event.currentTarget.checked)}
/>
```

For uncontrolled server-action forms, use `defaultValue` and keep it normalized:

```tsx
<input name="title" defaultValue={safeString(item?.title)} />
```

Do not mix `value` with missing `onChange`. Do not switch the same input between `defaultValue` and `value` across conditional renders.

## Admin Scan Checklist

When the warning appears, inspect:

- The file and line from the console stack trace first.
- Parent props that can become `undefined` after save/delete/modal state updates.
- Conditional form branches that mount/unmount the same input.
- Inputs with `value={state}` where state was initialized from optional data.
- Hidden inputs with `value={possiblyUndefined}`.
- Selects whose selected option value can disappear after list updates.

Useful searches:

```bash
rg -n "value=\{|checked=\{|defaultValue=\{|defaultChecked=\{" src/components/admin src/app/\(admin\)
rg -n "useState\([^\)]*\?\.|useState\(.*null|useState\(.*undefined" src/components/admin
```

## Known Rentroom Fixes

`src/components/admin/cms/ImageUploadInput.tsx` should keep these as strings for the component lifetime:

- `tempUrl`
- `imageUrl`
- `preview`
- hidden `image_url` input value

Normalize API results before setting state because upload responses are untyped JSON.

## Verification Checklist

Run:

```bash
npx tsc --noEmit
npx eslint <changed-admin-form-files>
```

Manual checks:

- Open the affected admin form.
- Type in the input that warned previously.
- Switch tabs/branches if the component has conditional UI.
- Save, cancel, upload, delete, or change cover if relevant.
- Confirm the browser console no longer shows controlled/uncontrolled warnings.
