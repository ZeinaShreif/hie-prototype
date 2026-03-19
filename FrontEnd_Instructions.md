# HIE Prototype — Frontend Developer Guide

**Last updated: 2026-03-19**

---

## What this project is

A patient-controlled health information exchange prototype.
Patients fill in their medical information once and share it with
providers at check-in via QR code, link, print, or clipboard —
eliminating the need to re-fill the same intake forms every visit.

---

## Current build status (2026-03-18)

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
| InsurancePage | `/insurance` | 🔶 Placeholder | InsurancePrimaryForm ⬜, InsuranceSecondaryForm ⬜ |
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
│   ├── PersonalDetailsForm.tsx   ✅ Complete — use as form pattern
│   ├── EmergencyContactForm.tsx  ✅ Complete
│   ├── AllergyList.tsx           ✅ Complete — use as list pattern
│   ├── ProfilePage.test.tsx      ✅ Complete — add new test blocks here
│   └── [MedicationList.tsx]      ⬜ You build this next
│   └── [VaccinationList.tsx]     ⬜ You build this
│   └── [ProcedureList.tsx]       ⬜ You build this
│   └── [InsurancePrimaryForm.tsx] ⬜ You build this
│   └── [InsuranceSecondaryForm.tsx] ⬜ You build this
│
├── pages/                  ✅ WIRE COMPONENTS IN HERE
│   ├── ProfilePage.tsx     ✅ Complete — use as page pattern
│   ├── MedicationsPage.tsx 🔶 Placeholder — needs MedicationList
│   ├── VaccinationsPage.tsx 🔶 Placeholder — needs VaccinationList
│   ├── ProceduresPage.tsx  🔶 Placeholder — needs ProcedureList
│   ├── InsurancePage.tsx   🔶 Placeholder — needs Insurance forms
│   ├── OverviewPage.tsx    🔶 Placeholder — build last
│   ├── SharePage.tsx       ⬜ Deferred — do not build yet
│   └── pages.test.ts       ✅ Smoke tests — update if you add a page
│
├── App.tsx                 ⚠️  ROUTING ONLY — do not add logic here
├── main.tsx                ❌ DO NOT MODIFY
├── index.css               ⚠️  Tailwind entry — do not add custom CSS
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

### Step 4 — InsurancePrimaryForm.tsx + InsuranceSecondaryForm.tsx
Create both, update `InsurancePage.tsx` to render both.

Fields (from `Insurance` in types.ts):
- `carrier` — text input
- `planName` — text input
- `memberId` — text input
- `groupNumber` — text input
- `policyHolderName` — text input
- `effectiveDate` — date input

Store actions:
- Primary form: `updateInsurancePrimary`
- Secondary form: `updateInsuranceSecondary`

Note: `insuranceSecondary` is `null` by default. Make the secondary
form opt-in — show a "Add secondary insurance" toggle, and only
render the form when the user opts in. Do not call
`updateInsuranceSecondary` until the user activates the secondary section.

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
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800">Section Title</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* 2. Each field: label with htmlFor, input with matching id */}
        <div>
          <label htmlFor="myFieldId" className="block text-sm font-medium text-slate-700 mb-1">
            Field Label
          </label>
          <input
            id="myFieldId"
            type="text"
            value={data.fieldName}
            onChange={(e) => updateData({ fieldName: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

```tsx
import { usePatientStore } from '../core/store';
import { newItem } from '../core/schema';
import type { ItemType } from '../core/types';

export default function ItemList() {
  const items = usePatientStore((s) => s.record.items);
  const addItem = usePatientStore((s) => s.addItem);
  const updateItem = usePatientStore((s) => s.updateItem);
  const removeItem = usePatientStore((s) => s.removeItem);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Items</h2>
        <button
          onClick={() => addItem(newItem())}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-slate-500">No items recorded.</p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded border border-slate-200 p-4 sm:grid-cols-3">

            {/* inline-editable fields — onChange calls updateItem immediately */}
            <div>
              <label htmlFor={`itemName-${item.id}`} className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                id={`itemName-${item.id}`}
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Delete button always uses item.id — never array index */}
            <button
              onClick={() => removeItem(item.id)}
              className="rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
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

Pages are thin wrappers. No store access, no business logic.

```tsx
import MyComponent from '../components/MyComponent';
import AnotherComponent from '../components/AnotherComponent';

export default function MyPage() {
  return (
    <div>
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
- `src/index.css` contains only `@import "tailwindcss";` — do not add custom CSS there.
- All styling uses Tailwind utility classes on JSX elements.

### Utility classes used consistently across the project

| Purpose | Classes |
|---------|---------|
| Section heading | `text-lg font-semibold text-slate-800` |
| Label | `block text-sm font-medium text-slate-700 mb-1` |
| Text input / select | `w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500` |
| Row card (list item) | `grid grid-cols-1 gap-3 rounded border border-slate-200 p-4 sm:grid-cols-3` |
| Form grid | `grid grid-cols-1 gap-4 sm:grid-cols-2` |
| Vertical spacing | `space-y-4` (list), `space-y-6` (form) |
| Add button | `rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700` |
| Delete button | `rounded border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50` |
| Header row (title + button) | `flex items-center justify-between` |
| Empty state text | `text-sm text-slate-500` |
| Full-width span (2 cols) | `sm:col-span-2` |

### To customize the visual style
Change the Tailwind classes directly on the elements. All styling
is co-located with the component markup — there are no separate
CSS files to update.

To change the color scheme across the whole app, do a search-and-replace
on the color tokens (e.g. replace `blue-600` with `indigo-600` everywhere).

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
| `updateInsurancePrimary` | `(data: Partial<Insurance>) => void` | InsurancePrimaryForm ⬜ |
| `updateInsuranceSecondary` | `(data: Partial<Insurance>) => void` | InsuranceSecondaryForm ⬜ |
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
3. `src/components/AllergyList.tsx` — the list component pattern
4. `src/components/PersonalDetailsForm.tsx` — the form component pattern
5. `src/components/ProfilePage.test.tsx` — how tests are structured
6. `src/pages/ProfilePage.tsx` — how a page composes components

That's enough to build the next three components (MedicationList,
VaccinationList, ProcedureList) without touching anything else.
