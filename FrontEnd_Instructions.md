# HIE Prototype — Frontend Developer Guide

**Last updated: 2026-03-25**

---

## What this project is

A patient-controlled health information exchange prototype.
Patients fill in their medical information once and share it with
providers at check-in via QR code, link, print, or clipboard —
eliminating the need to re-fill the same intake forms every visit.

---

## Current build status (2026-03-25)

| Layer | Name | Status | Notes |
|-------|------|--------|-------|
| 0 | Data model | ✅ COMPLETE | Do not modify — see locked files below |
| 1 | Patient UI | 🔶 IN PROGRESS | Store + routing + ProfilePage done |
| 2 | Sharing | 🔶 IN PROGRESS | Core logic (sharing.ts) complete and tested — UI not yet built |
| 3 | Consent & audit log | 🔶 IN PROGRESS | Core logic (accessLog.ts) complete and tested — UI not yet built |
| 4 | Production / HIPAA | ⬜ DEFERRED | Auth, encryption, FHIR API |

### Layer 1 detailed status

| Page | Route | Status | Components needed |
|------|-------|--------|-------------------|
| ProfilePage | `/profile` | ✅ Complete | PersonalDetailsForm ✅, EmergencyContactForm ✅, AllergyList ✅ |
| MedicationsPage | `/medications` | 🔶 Placeholder | MedicationList ⬜ |
| VaccinationsPage | `/vaccinations` | 🔶 Placeholder | VaccinationList ⬜ |
| ProceduresPage | `/procedures` | 🔶 Placeholder | ProcedureList ⬜ |
| InsurancePage | `/insurance` | ✅ Complete | InsurancePrimaryForm ✅, InsuranceSecondaryForm ✅ |
| OverviewPage | `/` | 🔶 Placeholder | Summary cards ⬜ (build last) |
| SharePage | `/share` | ⬜ Deferred | Layer 2 — do not build yet |

---

## Tech stack

| Tool | Purpose |
|------|---------|
| React 19 | UI framework |
| Vite 8 | Dev server + build |
| TypeScript | Strict typing throughout |
| Tailwind CSS 4 | Utility-class styling (via Vite plugin) |
| Zustand | Global state store |
| react-router-dom v7 | Client-side routing |
| Vitest | Test runner |
| @testing-library/react | Component tests |
| localStorage | Prototype persistence (swapped at Layer 4) |
| Node v22 | Runtime |

---

## Directory map — what to touch and what not to

```
src/
├── core/                   ❌ DO NOT MODIFY (Layer 0 — locked)
│   ├── types.ts            ❌ Source of truth for all data shapes
│   ├── schema.ts           ❌ Factory functions — use these, don't write inline objects
│   ├── storage.ts          ❌ Only file that touches localStorage
│   ├── store.ts            ❌ Zustand store — all actions live here
│   ├── schema.test.ts      ❌ Tests for schema + storage
│   ├── store.test.ts       ❌ Tests for store actions
│   ├── integration.test.ts ❌ Cross-layer tests (store → storage → reload)
│   ├── sharing.ts          ❌ Layer 2 — sharing business logic (isTokenActive, shareUrl, getActiveTokens, getRevokedTokens, buildClipboardText)
│   ├── sharing.test.ts     ❌ Tests for sharing.ts
│   ├── accessLog.ts        ❌ Layer 3 — access log business logic (createLogEntry, filterByMethod, filterByDateRange, getActiveEntries, getRevokedEntries, revokeEntry, summariseLog)
│   └── accessLog.test.ts   ❌ Tests for accessLog.ts
│
├── components/             ✅ YOUR MAIN WORK AREA
│   ├── PageHeader.tsx            ✅ Complete — navy header, avatar, progress bar, nav tabs
│   ├── PersonalDetailsForm.tsx   ✅ Complete — use as form pattern
│   ├── EmergencyContactForm.tsx  ✅ Complete
│   ├── AllergyList.tsx           ✅ Complete — use as list pattern
│   ├── StateCombobox.tsx         ✅ Complete — searchable US state dropdown
│   ├── formatPhone.ts            ✅ Complete — phone auto-formatting utility
│   ├── ProfilePage.test.tsx      ✅ Complete — add new test blocks here
│   └── [MedicationList.tsx]      ⬜ You build this next
│   └── [VaccinationList.tsx]     ⬜ You build this
│   └── [ProcedureList.tsx]       ⬜ You build this
│   ├── InsurancePrimaryForm.tsx  ✅ Complete — 6-field form, id prefix "primary"
│   └── InsuranceSecondaryForm.tsx ✅ Complete — opt-in with add/remove, id prefix "secondary"
│
├── pages/                  ✅ WIRE COMPONENTS IN HERE
│   ├── ProfilePage.tsx     ✅ Complete — use as page pattern
│   ├── MedicationsPage.tsx 🔶 Placeholder — needs MedicationList
│   ├── VaccinationsPage.tsx 🔶 Placeholder — needs VaccinationList
│   ├── ProceduresPage.tsx  🔶 Placeholder — needs ProcedureList
│   ├── InsurancePage.tsx   ✅ Complete
│   ├── OverviewPage.tsx    🔶 Placeholder — build last
│   ├── SharePage.tsx       ⬜ Deferred — do not build yet
│   └── pages.test.ts       ✅ Smoke tests — update if you add a page
│
├── App.tsx                 ⚠️  ROUTING ONLY — renders PageHeader + Routes, no logic
├── main.tsx                ❌ DO NOT MODIFY
├── index.css               ⚠️  Tailwind entry + design tokens + hie-* classes — do not add ad-hoc CSS
└── test-setup.ts           ⚠️  Test bootstrap — do not modify
```

---

## Recommended build order

Work through these in sequence. Each step follows the same pattern as
the completed examples.

### Step 1 — MedicationList.tsx (closest to AllergyList)
Create `src/components/MedicationList.tsx`, then update
`src/pages/MedicationsPage.tsx` to render it.

Fields to display per row (from `Medication` in types.ts):
- `name` — text input
- `dosage` — text input
- `frequency` — text input
- `prescribingProvider` — text input
- `startDate` — date input (ISO 8601 string)
- `endDate` — date input, nullable (empty = currently active)
- `status` — select: `active` | `past` | `prn`
- `source` — select: `provider` | `self-reported`

Store actions to use: `addMedication`, `updateMedication`, `removeMedication`
Factory to call on Add: `newMedication()` from `src/core/schema.ts`

### Step 2 — VaccinationList.tsx
Create `src/components/VaccinationList.tsx`, update `VaccinationsPage.tsx`.

Fields (from `Vaccination` in types.ts):
- `vaccineName` — text input
- `dateAdministered` — date input
- `lotNumber` — text input
- `administeringSite` — text input
- `source` — select: `provider` | `self-reported`

Store actions: `addVaccination`, `updateVaccination`, `removeVaccination`
Factory: `newVaccination()`

### Step 3 — ProcedureList.tsx
Create `src/components/ProcedureList.tsx`, update `ProceduresPage.tsx`.

Fields (from `Procedure` in types.ts):
- `procedureName` — text input
- `date` — date input
- `facility` — text input
- `provider` — text input
- `category` — select: `surgery` | `screening` | `diagnostic` | `other`
- `notes` — textarea

Store actions: `addProcedure`, `updateProcedure`, `removeProcedure`
Factory: `newProcedure()`

### Step 4 — InsurancePrimaryForm.tsx + InsuranceSecondaryForm.tsx ✅ COMPLETE
Both built, `InsurancePage.tsx` wired up.

Fields (from `Insurance` in types.ts): `carrier`, `planName`,
`memberId`, `groupNumber`, `policyHolderName`, `effectiveDate`.

Store actions: `updateInsurancePrimary`, `updateInsuranceSecondary`,
`clearInsuranceSecondary` (sets secondary back to `null` — used by
the "Remove" button on `InsuranceSecondaryForm`).

Secondary form is opt-in: collapsed to an "+ Add secondary insurance"
button when `insuranceSecondary` is `null`; a "Remove" button in the
section header collapses and clears it. Auto-expands on mount if data
was previously saved.

### Step 5 — OverviewPage
Build after all other sections are complete. Read-only summary — no
store writes. Read all sections from the store and display counts
and key values (e.g. "3 medications", "2 allergies", name, DOB).

### Step 6 — SharePage (Layer 2 + 3 — do not start yet)
Deferred until Layer 1 UI is fully complete and tested. The core
logic is ready: `src/core/sharing.ts` (token validation, URL
generation, clipboard text) and `src/core/accessLog.ts` (log
filtering, revocation, summary) are both complete. The SharePage
UI and its components will import from these modules when the time
comes. Do not build this until all Layer 1 pages are done.

---

## The component pattern

Every component follows the same structure. Use `AllergyList.tsx`
as the reference for list components, and `PersonalDetailsForm.tsx`
for form components.

### Form component pattern (PersonalDetailsForm / EmergencyContactForm)

```tsx
import { usePatientStore } from '../core/store';

export default function MyForm() {
  // 1. Subscribe to only the slice you need
  const data = usePatientStore((s) => s.record.someSection);
  const updateData = usePatientStore((s) => s.updateSomeSection);

  return (
    <div className="hie-section">
      <div className="hie-section-header">
        <h2 className="hie-section-title">Section Title</h2>
      </div>

      <div className="grid grid-cols-2">

        {/* Left-column cell */}
        <div className="hie-field-left">
          <label htmlFor="myFieldId" className="hie-label">Field Label</label>
          <input
            id="myFieldId"
            type="text"
            value={data.fieldName}
            onChange={(e) => updateData({ fieldName: e.target.value })}
            className="hie-input"
            placeholder="Placeholder text"
          />
        </div>

        {/* Right-column cell */}
        <div className="hie-field">
          <label htmlFor="anotherFieldId" className="hie-label">Another Field</label>
          <input
            id="anotherFieldId"
            type="text"
            value={data.anotherField}
            onChange={(e) => updateData({ anotherField: e.target.value })}
            className="hie-input"
          />
        </div>

        {/* Full-width cell */}
        <div className="col-span-2 hie-field">
          <label htmlFor="fullWidthId" className="hie-label">Full Width Field</label>
          <input id="fullWidthId" type="text" className="hie-input" ... />
        </div>

      </div>
    </div>
  );
}
```

Key rules:
- No submit button. Every `onChange` writes to the store immediately.
- Use selector form `usePatientStore((s) => s.record.X)` — not `usePatientStore().record.X`.
- Never use local `useState` to mirror store data.

### List component pattern (AllergyList)

See `src/components/AllergyList.tsx` for the full reference. The
general structure:

```tsx
import { usePatientStore } from '../core/store';
import { newItem } from '../core/schema';

export default function ItemList() {
  const items = usePatientStore((s) => s.record.items);
  const addItem = usePatientStore((s) => s.addItem);
  const updateItem = usePatientStore((s) => s.updateItem);
  const removeItem = usePatientStore((s) => s.removeItem);

  return (
    <div className="hie-section">
      <div className="hie-section-header">
        <h2 className="hie-section-title">Items</h2>
        {/* Optional count badge */}
      </div>

      {/* List content area */}
      <div style={{ padding: '12px 16px 4px' }}>
        {items.length === 0 && (
          <p className="text-sm italic" style={{ color: 'var(--label-color)' }}>
            No items recorded.
          </p>
        )}

        {items.map((item) => (
          <div key={item.id}>
            {/* inline-editable fields — onChange calls updateItem immediately */}
            <input
              id={`itemName-${item.id}`}
              type="text"
              value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
              className="hie-input"
            />
            {/* Delete button always uses item.id — never array index */}
            <button onClick={() => removeItem(item.id)} aria-label="Delete">×</button>
          </div>
        ))}
      </div>

      {/* Add row at the bottom */}
      <button
        aria-label="Add"
        onClick={() => addItem(newItem())}
        style={{ borderTop: '1px solid var(--ice-divider)', padding: '10px 16px 12px' }}
      >
        + Add item
      </button>
    </div>
  );
}
```

**Important for list components with dynamic ids:**
When multiple rows are rendered, use `${prefix}-${item.id}` for
input ids (e.g. `medName-${med.id}`) so each row's labels and inputs
are uniquely associated. See the id prefixing rules below.

---

## Page pattern

Pages are thin wrappers. No store access, no business logic. Wrap
content in `<div className="p-4">` to add the standard page padding
inside the mobile shell.

```tsx
import MyComponent from '../components/MyComponent';
import AnotherComponent from '../components/AnotherComponent';

export default function MyPage() {
  return (
    <div className="p-4">
      <MyComponent />
      <AnotherComponent />
    </div>
  );
}
```

---

## Styling with Tailwind

### How Tailwind is set up
- Configured via the `@tailwindcss/vite` plugin — **no `tailwind.config.js`** needed.
- `src/index.css` is the CSS entry point. It imports Tailwind and adds:
  - **`@theme` block** — registers design tokens as Tailwind utility classes
    (`bg-navy`, `text-cyan`, `bg-ice`, `border-ice-border`, etc.) and as
    CSS custom properties (`--color-navy`, etc.).
  - **`:root` block** — short-name aliases (`--navy`, `--cyan`, `--ice`,
    `--label-color`, `--text-dark`, `--muted`, etc.) for use in inline styles.
  - **`@layer components` block** — shared CSS component classes used
    throughout all form components.

### Shared component classes (`hie-*`)

| Class | Purpose |
|-------|---------|
| `.hie-label` | Field label — small, uppercase, muted (`--label-color`) |
| `.hie-input` | Text/select/date input — ice background, focus ring in cyan |
| `.hie-field` | Grid cell (right column or full-width) with bottom divider |
| `.hie-field-left` | Grid cell (left column) with bottom + right divider |
| `.hie-section` | White rounded card wrapping each section |
| `.hie-section-header` | Top bar of a section card (flex, title + optional badge) |
| `.hie-section-title` | Section heading text — uppercase, extrabold, navy |

### Design tokens (color palette)

| Token | Value | Tailwind class |
|-------|-------|----------------|
| `--navy` / `--color-navy` | `#03045E` | `bg-navy`, `text-navy` |
| `--cyan` / `--color-cyan` | `#0096C7` | `bg-cyan`, `text-cyan` |
| `--cyan-bright` | `#00B4D8` | `bg-cyan-bright` |
| `--cyan-light` | `#90E0EF` | `text-cyan-light` |
| `--ice` / `--color-ice` | `#EFF8FB` | `bg-ice` |
| `--ice-border` | `#CAE9F5` | `border-ice-border` |
| `--ice-divider` | `#EAF5FB` | — (used in CSS classes) |
| `--label-color` | `#90B8CC` | — (used via CSS var) |
| `--text-dark` | `#03045E` | — (used via CSS var) |
| `--muted` | `#4A6FA5` | — (used via CSS var) |

### To customize the visual style
Change the design tokens in `src/index.css` `@theme` / `:root` to
retheme the whole app. For per-component tweaks, edit the `hie-*`
classes in the `@layer components` block or override with Tailwind
utilities on the element.

---

## Input id naming rules

These rules exist for two reasons: accessibility (screen readers)
and testability (`getByLabelText` in tests requires `htmlFor`/`id` to match).

1. **Every `<label>` must have `htmlFor`. Every input must have a matching `id`.**
   ```tsx
   <label htmlFor="firstName">First Name</label>
   <input id="firstName" ... />
   ```

2. **Prefix ids per form** to avoid conflicts when multiple forms appear on one page:
   - `PersonalDetailsForm` — no prefix needed (fields are globally unique): `firstName`, `lastName`, etc.
   - `EmergencyContactForm` — prefix `emergency`: `emergencyName`, `emergencyRelationship`, `emergencyPhone`
   - `InsurancePrimaryForm` — prefix `primary`: `primaryCarrier`, `primaryMemberId`, etc.
   - `InsuranceSecondaryForm` — prefix `secondary`: `secondaryCarrier`, etc.
   - List component rows — use `${prefix}-${item.id}` for uniqueness across rows: `medName-${med.id}`

---

## Data model reference

All field names come from `src/core/types.ts`. Read this file before
building any form. Every input maps to a field defined here.

### Medication
```ts
id: string              // uuid — never use array index
name: string
dosage: string
frequency: string
prescribingProvider: string
startDate: string       // ISO 8601: "2024-01-15"
endDate: string | null  // null = currently active
source: 'provider' | 'self-reported'
status: 'active' | 'past' | 'prn'
```

### Vaccination
```ts
id: string
vaccineName: string
dateAdministered: string  // ISO 8601
lotNumber: string
administeringSite: string
source: 'provider' | 'self-reported'
```

### Procedure
```ts
id: string
procedureName: string
date: string            // ISO 8601
facility: string
provider: string
notes: string
category: 'surgery' | 'screening' | 'diagnostic' | 'other'
```

### Insurance
```ts
carrier: string
planName: string
memberId: string
groupNumber: string
policyHolderName: string
effectiveDate: string   // ISO 8601
```

### Allergy (already built — for reference)
```ts
id: string
substance: string
reaction: string
severity: 'mild' | 'moderate' | 'severe'
```

---

## Store actions reference

Available from `usePatientStore` in `src/core/store.ts`.

| Action | Signature | Used by |
|--------|-----------|---------|
| `updatePersonal` | `(data: Partial<PersonalDetails>) => void` | PersonalDetailsForm |
| `updateEmergencyContact` | `(data: Partial<EmergencyContact>) => void` | EmergencyContactForm |
| `addAllergy` | `(item: Allergy) => void` | AllergyList |
| `updateAllergy` | `(id, data: Partial<Allergy>) => void` | AllergyList |
| `removeAllergy` | `(id: string) => void` | AllergyList |
| `addMedication` | `(item: Medication) => void` | MedicationList ⬜ |
| `updateMedication` | `(id, data: Partial<Medication>) => void` | MedicationList ⬜ |
| `removeMedication` | `(id: string) => void` | MedicationList ⬜ |
| `addVaccination` | `(item: Vaccination) => void` | VaccinationList ⬜ |
| `updateVaccination` | `(id, data: Partial<Vaccination>) => void` | VaccinationList ⬜ |
| `removeVaccination` | `(id: string) => void` | VaccinationList ⬜ |
| `addProcedure` | `(item: Procedure) => void` | ProcedureList ⬜ |
| `updateProcedure` | `(id, data: Partial<Procedure>) => void` | ProcedureList ⬜ |
| `removeProcedure` | `(id: string) => void` | ProcedureList ⬜ |
| `updateInsurancePrimary` | `(data: Partial<Insurance>) => void` | InsurancePrimaryForm ✅ |
| `updateInsuranceSecondary` | `(data: Partial<Insurance>) => void` | InsuranceSecondaryForm ✅ |
| `clearInsuranceSecondary` | `() => void` | InsuranceSecondaryForm ✅ — sets secondary to null |
| `addShareToken` | `(token: ShareToken) => void` | SharePage ⬜ (Layer 2) |
| `revokeShareToken` | `(token: string) => void` | SharePage ⬜ (Layer 2) |
| `appendLog` | `(entry: AccessLogEntry) => void` | SharePage ⬜ (Layer 3) |

---

## Factory functions reference

Always use these when creating new items. Never construct objects inline.
All live in `src/core/schema.ts`.

```ts
newMedication()                           // blank Medication — status: 'active', source: 'self-reported'
newVaccination()                          // blank Vaccination — source: 'self-reported'
newProcedure()                            // blank Procedure — category: 'other'
newAllergy()                              // blank Allergy — severity: 'mild'
newShareToken(label)                      // ShareToken — active: true, expiresAt: null (Layer 2)
newAccessLogEntry(method, token, label)   // AccessLogEntry — revoked: false (Layer 3)
```

Usage pattern:
```tsx
<button onClick={() => addMedication(newMedication())}>Add</button>
```

---

## Writing tests

Add tests for every component you build. The test file for
`src/components/` is `src/components/ProfilePage.test.tsx`.
Add a new `describe` block to that file for each new component,
or create a new `*.test.tsx` file alongside the component.

### Test setup
- Environment: `jsdom` (configured in `vite.config.ts`)
- Setup file: `src/test-setup.ts` (imports jest-dom matchers)
- Use `getByLabelText` for inputs — this requires `htmlFor`/`id` to be correct
- Use `getByRole('button', { name: 'Add' })` for buttons
- Reset the store in `beforeEach` using `usePatientStore.getState().clearAll()`

### Minimum tests per component

**For form components:**
```
- renders all fields (getByLabelText for each field)
- changing a field calls the correct store action
```

**For list components:**
```
- shows empty state when list is empty
- clicking Add creates a new item in the store
- clicking Delete removes the correct item by id
- changing a select field updates the correct item
```

### Running tests
```bash
npm test          # run all tests once
npm run test:watch  # watch mode
```

---

## Rules — absolute constraints

Never do these:

| Rule | Why |
|------|-----|
| Don't import React or UI libs inside `src/core/` | Core must stay framework-agnostic |
| Don't call `localStorage` directly | Always use `src/core/storage.ts` — the adapter is the swap point for Layer 4 |
| Don't use array index as item key or id | UUIDs only — array indices break React reconciliation and delete operations |
| Don't store `Date` objects | ISO 8601 strings only — Date objects don't serialize cleanly and cause timezone bugs |
| Don't add Zustand `persist` middleware | Persistence is handled exclusively by `storage.ts` — adding `persist` would double-write and break the reload behavior |
| Don't put business logic in `App.tsx` | Routing only |
| Don't put form logic in page files | Pages compose components — logic stays in `src/components/` |
| Don't call `storage.ts` from a component | Use store actions — components never touch the storage layer directly |
| Don't omit `htmlFor` / `id` on labels/inputs | Required for accessibility and `getByLabelText` |
| Don't use un-prefixed ids when multiple forms share a page | Causes label/input mismatches and test failures |

---

## Running the project

```bash
npm run dev         # start dev server at localhost:5173
npm test            # run all tests
npm run test:watch  # tests in watch mode
npm run build       # production build (runs tsc + vite build)
npm run lint        # ESLint
```

---

## Files to read before starting

In this order:

1. `src/core/types.ts` — understand every data shape before writing a form
2. `src/core/schema.ts` — see what factory functions exist
3. `src/index.css` — understand the `hie-*` CSS classes and color tokens
4. `src/components/AllergyList.tsx` — the list component pattern
5. `src/components/PersonalDetailsForm.tsx` — the form component pattern
   (note: includes imperial/metric toggle, `StateCombobox`, and `formatPhone`)
6. `src/components/ProfilePage.test.tsx` — how tests are structured
7. `src/pages/ProfilePage.tsx` — how a page composes components

That's enough to build the next three components (MedicationList,
VaccinationList, ProcedureList) without touching anything else.
