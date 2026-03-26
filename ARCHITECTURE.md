# HIE Prototype — Architecture

## What this project does
Patients fill in their medical information once. They can then share
it with any provider at check-in via QR code, a link, a clipboard
copy, or a printout — eliminating the need to re-fill the same
intake forms at every new provider.

## Build layers
The project is built in sequential layers. Each layer is fully tested
before the next begins. Layers 0–3 are the prototype (zero cost).
Layer 4 is the production upgrade path.

| Layer | Name | Status | Description |
|-------|------|--------|-------------|
| 0 | Data model | Complete | Types, schema, storage adapter |
| 1 | Patient UI | In progress | Store ✅ · routing ✅ · integration tests ✅ · ProfilePage ✅ · InsurancePage ✅ · remaining pages (Medications, Vaccinations, Procedures, Overview) 🔶 |
| 2 | Sharing | In progress | Core logic complete (sharing.ts ✅) — UI not yet built |
| 3 | Consent & audit log | In progress | Core logic complete (accessLog.ts ✅) — UI not yet built |
| 4 | Production | Deferred | Auth, encryption, HIPAA, FHIR API |

---

## Directory structure
```
hie-prototype/
  src/
    core/                     Layer 0 — pure logic, no UI dependencies
      types.ts                ✅ Data model — do not modify
      schema.ts               ✅ Factory functions
      storage.ts              ✅ localStorage adapter
      store.ts                ✅ Zustand store
      sharing.ts              ✅ Layer 2 sharing logic
      accessLog.ts            ✅ Layer 3 access log logic
      schema.test.ts          ✅
      store.test.ts           ✅
      integration.test.ts     ✅
      sharing.test.ts         ✅
      accessLog.test.ts       ✅
    components/               Layer 1 — reusable UI components
      PageHeader.tsx          ✅ Navy header with avatar, progress bar, nav tabs
      PersonalDetailsForm.tsx ✅
      EmergencyContactForm.tsx ✅
      AllergyList.tsx         ✅
      StateCombobox.tsx       ✅ Searchable US state dropdown
      formatPhone.ts          ✅ Phone auto-formatting utility
      ProfilePage.test.tsx    ✅
      [MedicationList.tsx]    🔶 Not yet built
      [VaccinationList.tsx]   🔶 Not yet built
      [ProcedureList.tsx]     🔶 Not yet built
      InsurancePrimaryForm.tsx     ✅ 6-field form, id prefix "primary"
      InsuranceSecondaryForm.tsx   ✅ opt-in form with add/remove toggle, id prefix "secondary"
    pages/                    Layer 1 — screen-level views
      ProfilePage.tsx         ✅
      MedicationsPage.tsx     🔶 Placeholder
      VaccinationsPage.tsx    🔶 Placeholder
      ProceduresPage.tsx      🔶 Placeholder
      InsurancePage.tsx       ✅
      OverviewPage.tsx        🔶 Placeholder (build last)
      SharePage.tsx           ⬜ Deferred — Layer 2+3 UI
      pages.test.ts           ✅
    App.tsx                   ✅ Routing only, no business logic
    main.tsx                  React entry point, do not edit
    test-setup.ts             Test bootstrap, do not edit
  CLAUDE.md                   Instructions for Claude Code sessions
  ARCHITECTURE.md             This file
  FrontEnd_Instructions.md    Frontend developer guide
  README.md                   Project overview
  package.json
  vite.config.ts
  tsconfig.json
```

---

## Frontend notes

### Tailwind CSS
Tailwind is configured via the `@tailwindcss/vite` plugin in
`vite.config.ts` — no `tailwind.config.js` file is needed.
`src/index.css` is the CSS entry point. It imports Tailwind and then
defines project-specific design tokens and shared component classes:

```css
@import "tailwindcss";

@theme {
  /* registers colours as Tailwind utilities (bg-navy, text-cyan, etc.)
     and as CSS custom properties (--color-navy, etc.) */
}

:root {
  /* short-name aliases: var(--navy), var(--cyan), etc. for inline styles */
}

@layer components {
  /* shared CSS classes used by all form components:
     .hie-label, .hie-input, .hie-field, .hie-field-left,
     .hie-section, .hie-section-header, .hie-section-title */
}
```

Component styling uses a combination of Tailwind utility classes and
the shared `hie-*` component classes defined in `src/index.css`.

### PageHeader
`src/components/PageHeader.tsx` renders the persistent header shown
on every page. It reads `record.personal` from the store (via
`usePatientStore` selector) and renders:
- Avatar circle showing the patient's initials (falls back to "PA")
- Patient full name and formatted date of birth
- "Save changes" button (UI only — wiring deferred)
- Profile completeness progress bar (percentage of PersonalDetails fields filled)
- Horizontal nav tab bar with `NavLink` entries for all 7 routes

The nav tabs live in `PageHeader`, not in `App.tsx`. `App.tsx` renders
`PageHeader` above the `<Routes>` block and contains no nav logic of
its own.

---

## File reference

### src/core/types.ts
The single source of truth for all data shapes in the application.
Contains TypeScript interfaces only — no logic, no functions.
Every form field in the UI maps to a field defined here.
**Never rename or remove a field without updating schema.ts,
storage.ts, and any component that uses it.**

Key types:
- `PatientRecord` — the root object. Everything lives inside this.
- `PersonalDetails` — name, DOB, gender, address, contact info,
  height, weight, language, marital status, blood type.
- `EmergencyContact` — name, relationship, phone.
- `Allergy` — substance, reaction, severity.
- `Medication` — name, dosage, frequency, provider, dates, status.
- `Vaccination` — vaccine name, date, lot number, site.
- `Procedure` — name, date, facility, provider, category, notes.
- `Insurance` — carrier, plan, member ID, group number, policy holder.
- `ShareToken` — uuid token, timestamps, label, active flag.
- `AccessLogEntry` — timestamp, method, token, label, revoked flag.

### src/core/schema.ts
Factory functions that create empty instances of every type.
Always use these functions when creating new items — never
construct objects inline in components.

Functions:
- `createEmptyPatientRecord()` — creates a fresh PatientRecord
  with a new uuid and current timestamps.
- `newMedication()` — blank Medication with uuid, defaults to
  active + self-reported.
- `newVaccination()` — blank Vaccination with uuid.
- `newProcedure()` — blank Procedure with uuid, defaults to 'other'.
- `newAllergy()` — blank Allergy with uuid, defaults to mild.

### src/core/storage.ts
The only file in the project that touches localStorage.
All reads and writes go through this adapter.
In production (Layer 4), swap this file's implementation for
API calls — nothing else in the project needs to change.

Functions:
- `storage.loadRecord()` — returns PatientRecord or null.
- `storage.saveRecord(record)` — serializes and saves. Also
  updates the record's updatedAt timestamp.
- `storage.clearRecord()` — removes the record entirely.
- `storage.loadLog()` — returns AccessLogEntry array, newest first.
- `storage.appendLogEntry(entry)` — prepends a new log entry.

### src/core/store.ts
The Zustand store. The single point of contact between the UI and
the data layer. Components read state and call actions from here —
they never touch storage.ts directly.

Actions mirror the data model: one `update*` action for scalar
sections (personal, emergencyContact, insurance) and
`add* / update* / remove*` triples for list sections (allergies,
medications, vaccinations, procedures). All actions call
`storage.saveRecord()` internally after mutating state.
`clearInsuranceSecondary` sets `insuranceSecondary` back to `null`
and saves — used by `InsuranceSecondaryForm`'s remove button.

The store is initialized from localStorage via `storage.loadRecord()`
at startup. Zustand's `persist` middleware is intentionally not used —
persistence is handled exclusively by storage.ts.

Key exports:
- `usePatientStore` — the Zustand hook. Use selector form
  (`usePatientStore(s => s.record.personal)`) to avoid unnecessary
  re-renders.

### src/core/schema.test.ts
Vitest tests for the factory functions and storage adapter.
Run with `npm test`.
Tests must pass before starting any new layer.
Add a test here whenever a new factory function is added to schema.ts.

Current factory coverage: `createEmptyPatientRecord`, `newMedication`,
`newVaccination`, `newProcedure`, `newAllergy`, `newShareToken`,
`newAccessLogEntry`.

### src/core/sharing.ts
Layer 2 pure business logic for the sharing feature. No React imports,
no browser APIs, no localStorage access.

Exports:
- `isTokenActive(token: ShareToken): boolean` — returns true if
  `token.active` is true and `expiresAt` is null or in the future.
  Used internally by `getActiveTokens` and `getRevokedTokens`, and
  should be used by any component that needs to gate on token validity.
- `shareUrl(token: string, origin: string): string` — builds the
  provider-facing view URL: `${origin}/view/${token}`. Caller must
  supply `origin` (e.g. `window.location.origin`) because browser
  globals are not allowed inside `src/core/`. **When Layer 2 is wired
  into the frontend, `/view/:token` must be added as a route in
  `App.tsx` with a corresponding `ViewPage` that reads the token from
  `useParams` and looks it up in the store.**
- `getActiveTokens(tokens: Record<string, ShareToken>): ShareToken[]`
  — filters the `shareTokens` map to only usable (active,
  non-expired) tokens. Used by the share screen to show live tokens.
- `getRevokedTokens(tokens: Record<string, ShareToken>): ShareToken[]`
  — inverse of `getActiveTokens`; returns revoked or expired tokens.
  Used by the access log screen. `getActiveTokens` and
  `getRevokedTokens` together partition the full token set with no
  overlap.
- `buildClipboardText(record: PatientRecord): string` — formats a
  `PatientRecord` as a plain-text block for pasting into an intake
  form. Omits blank fields. Only `status: 'active'` medications are
  included. Sections: personal info, emergency contact, allergies,
  medications, vaccinations, procedures/surgeries, primary insurance
  (section omitted entirely when `insurancePrimary` is null).

### src/core/sharing.test.ts
Vitest tests for all five functions in `sharing.ts` (22 tests).

Coverage:
- `isTokenActive` — active/inactive flag, future/past expiry, and
  that `active: false` overrides a future `expiresAt`.
- `shareUrl` — correct URL format for production and localhost origins.
- `getActiveTokens` — empty map, mixed active/revoked/expired tokens,
  all-active case.
- `getRevokedTokens` — empty map, mixed tokens, partition invariant
  (active count + revoked count equals total token count).
- `buildClipboardText` — patient name inclusion, empty-list "None
  reported" message, allergy formatting, active-only medication
  filtering, vaccination formatting, insurance section present/absent,
  blank field omission, height/weight formatting.

### src/core/accessLog.ts
Layer 3 pure business logic for the access log and consent features.
No React imports, no browser APIs, no localStorage access.

Exports:
- `LogSummary` — exported interface: `{ total: number, byMethod:
  Record<'qr'|'link'|'print'|'clipboard', number>, revoked: number }`.
  Returned by `summariseLog`.
- `createLogEntry(method, label, token): AccessLogEntry` — factory
  wrapper. Re-exports `newAccessLogEntry` from `schema.ts` with the
  parameter order `(method, label, token)` rather than
  `(method, token, label)`. The underlying factory stays in `schema.ts`
  per the non-negotiable rule; this wrapper exists solely to provide
  the caller-friendly signature. `revoked` defaults to `false`.
- `filterByMethod(log, method): AccessLogEntry[]` — returns only
  entries whose `method` field matches the given value (`'qr'`,
  `'link'`, `'print'`, or `'clipboard'`).
- `filterByDateRange(log, from, to): AccessLogEntry[]` — returns
  entries whose `timestamp` falls within `[from, to]` inclusive. Both
  bounds are ISO 8601 strings; comparison uses `Date` arithmetic so
  partial date strings (e.g. `"2026-01-31"`) are interpreted as
  midnight UTC. Does not mutate the input array.
- `getActiveEntries(log): AccessLogEntry[]` — returns entries where
  `revoked` is `false`.
- `getRevokedEntries(log): AccessLogEntry[]` — returns entries where
  `revoked` is `true`. `getActiveEntries` and `getRevokedEntries`
  together partition the full log with no overlap.
- `revokeEntry(log, id): AccessLogEntry[]` — returns a new array with
  the entry matching `id` having `revoked` set to `true`. Pure
  function — the original array is never mutated. If no entry matches,
  the array is returned unchanged. The store calls this when a token
  is revoked to keep log entries consistent with token state.
- `summariseLog(log): LogSummary` — aggregates the log into a
  `LogSummary` object. `total` always equals the sum of all
  `byMethod` counts.

### src/core/accessLog.test.ts
Vitest tests for all seven exports in `accessLog.ts` (33 tests).

Coverage:
- `createLogEntry` — uuid id, uniqueness across calls, correct method/
  label/token storage, null token, `revoked: false` default, valid ISO
  timestamp.
- `filterByMethod` — matching subset, empty log, single match, no
  mutation of the original array.
- `filterByDateRange` — inclusive range, exclusion outside range,
  empty result when nothing matches, empty log, exact boundary match.
- `getActiveEntries` — mixed log, all-active, all-revoked, empty log.
- `getRevokedEntries` — mixed log, none revoked, empty log, partition
  invariant (`getActiveEntries` + `getRevokedEntries` lengths equal
  total log length).
- `revokeEntry` — target entry flipped, other entries unaffected,
  original array not mutated, new array reference returned, no-op when
  id does not match.
- `summariseLog` — zero counts on empty log, total count, per-method
  counts for all four methods, revoked count, invariant that
  `total === sum(byMethod)`.

### src/core/integration.test.ts
Cross-layer tests that verify the full write path: store action →
storage.ts → localStorage → storage.loadRecord(). These tests
catch bugs that unit tests on store or storage in isolation cannot,
such as a store action that updates in-memory state correctly but
fails to call `storage.saveRecord()`.

Three describe blocks:
- **store → storage persistence** — calls every major store action
  (personal, medications, allergies, insurance) and confirms the
  data is immediately readable back from `storage.loadRecord()`.
- **simulated page reload** — writes data, then reinitializes the
  store from storage (mimicking what happens when the user refreshes
  the browser). Confirms the record survives the round-trip intact.
  This is the most important integration test: if persistence is
  ever broken, this is the first test to fail.
- **data integrity** — confirms that updating one section does not
  clobber another, that remove-by-id is scoped correctly, and that
  `clearAll` wipes both store state and storage.

Uses the same in-memory localStorage mock as store.test.ts.

### Test environment setup
Component tests (`.test.tsx`) require a browser-like environment.
Configuration lives in two places:

**`vite.config.ts`:**
`defineConfig` is imported from `vitest/config` (not `vite`) so that
the `test` block is fully typed. The Tailwind and React plugins are
registered alongside the test config in the same file.

```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['src/test-setup.ts'],
  include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
}
```
- `globals: true` — makes `describe`, `it`, `expect` available
  without imports in test files.
- `environment: 'jsdom'` — provides `document`, `window`, and
  `localStorage` in all tests, including the pure-logic `.test.ts`
  files (jsdom is a superset of node for this purpose).
- `setupFiles` — runs `src/test-setup.ts` before every test file.

**`src/test-setup.ts`:**
```ts
import '@testing-library/jest-dom/vitest';
```
Extends Vitest's `expect` with jest-dom matchers (`toBeInTheDocument`,
`toHaveValue`, etc.).

Required packages: `@testing-library/react`, `@testing-library/jest-dom`,
`jsdom` (install as devDependencies).

### src/components/
Reusable UI components consumed by pages. Components in this
directory own their own store subscriptions — they read from
`usePatientStore` with selectors and call store actions directly.
Pages compose these components rather than containing form logic
themselves.

Styling uses a combination of Tailwind utility classes and the shared
`hie-*` component classes defined in `src/index.css`.

Non-React utilities in this directory:
- `formatPhone.ts` — pure function, no React. Formats a string as a
  US phone number `(XXX) XXX-XXXX` as the user types. Used by
  `PersonalDetailsForm` and `EmergencyContactForm`.

### src/components/StateCombobox.tsx
Custom searchable combobox for selecting a US state. Renders a plain
text input that filters the 50-state list (+ DC) as the user types.
The dropdown is rendered with `position: fixed` (using a measured
bounding rect) so it escapes any overflow-hidden ancestor.

Props: `id: string`, `value: string`, `onChange: (value: string) => void`.

On blur, if the typed text is not a valid state name, the input
reverts to the last committed value. Used by `PersonalDetailsForm`
for the state field.

**Accessibility and testability rules for all components:**
- Every `<label>` must have an `htmlFor` attribute matching the `id`
  of its corresponding input, select, or textarea.
- Input `id` values must be prefixed per form to avoid conflicts when
  multiple forms appear on the same page. For example,
  `PersonalDetailsForm` uses `firstName`, `lastName`, etc.;
  `EmergencyContactForm` uses `emergencyName`, `emergencyPhone`, etc.
  This ensures `getByLabelText` works correctly in tests.

### src/components/PersonalDetailsForm.tsx
Controlled form for all 16 fields in `PersonalDetails`. Reads
`record.personal` from the store via selector and calls
`updatePersonal` on every input change — no submit button.

Notable implementation details:
- **Imperial/metric toggle** — a two-button toggle switches between
  imperial (ft/in, lbs) and metric (cm, kg) display. Local state
  stores the text while typing; `updatePersonal` is called on
  `onBlur`, converting back to the store's canonical imperial fields
  (`heightFt`, `heightIn`, `weightLbs`).
- **StateCombobox** — the state field uses `StateCombobox` (a custom
  searchable dropdown) rather than a plain select or input.
- **Phone auto-formatting** — the phone field applies `formatPhone`
  from `./formatPhone.ts` on every keystroke, producing `(XXX) XXX-XXXX`.
- **Dropdowns** for Gender, Marital Status, and Blood Type.

Input ids: `firstName`, `lastName`, `dateOfBirth`, `gender`,
`address`, `city`, `state` (StateCombobox), `zip`, `phone`, `email`,
`height`, `weight`, `primaryLanguage`, `maritalStatus`, `bloodType`.

Store actions used: `updatePersonal`.

**This is the pattern for all other form components** — selector for
the relevant slice, store action on every change, no local form state.

### src/components/EmergencyContactForm.tsx
Controlled form for all three fields in `EmergencyContact`. Reads
`record.emergencyContact` from the store and calls
`updateEmergencyContact` on every change.

Input ids are prefixed with `emergency` to avoid conflicts with
PersonalDetailsForm when both appear on the same page:
`emergencyName`, `emergencyRelationship`, `emergencyPhone`.

Store actions used: `updateEmergencyContact`.

### src/components/AllergyList.tsx
Inline-editable list of `Allergy` items. Renders each allergy as a
color-coded pill tag. All fields are editable in place — changes call
`updateAllergy(id, { field })` immediately, no save button.

- Each pill shows a colored dot, an editable substance name input,
  a severity `<select>`, and a delete (×) button on the top row,
  plus an editable reaction input on a second row below.
- Severity colors: mild (yellow), moderate (orange), severe (red).
- **Add** button calls `newAllergy()` from schema.ts and passes the
  result to `addAllergy` — no intermediate state needed.
- **Delete** button calls `removeAllergy(id)` for that pill only.
- Shows "No allergies recorded." when the list is empty.
- A count badge ("N on file") is displayed in the section header.

Store actions used: `addAllergy`, `updateAllergy`, `removeAllergy`.

### src/components/InsurancePrimaryForm.tsx
Controlled form for all six fields in `Insurance`. Reads
`record.insurancePrimary` from the store via selector and calls
`updateInsurancePrimary` on every input change — no submit button.
If `insurancePrimary` is `null`, the component derives empty strings
locally for controlled inputs; the store creates the object on the
first `updateInsurancePrimary` call.

Input ids (prefix `primary`): `primaryCarrier`, `primaryPlanName`,
`primaryMemberId`, `primaryGroupNumber`, `primaryPolicyHolderName`,
`primaryEffectiveDate`.

Layout: 2-column grid. Row 1: Carrier | Plan Name. Row 2: Member ID |
Group Number. Row 3: Policy Holder Name (full width). Row 4:
Effective Date (full width). Shows an "On file" green badge in the
section header when `carrier` is non-empty.

Store actions used: `updateInsurancePrimary`.

### src/components/InsuranceSecondaryForm.tsx
Opt-in form for secondary insurance. When `insuranceSecondary` is
`null` and the user has not opted in, renders a collapsed state
showing only the section header and an "+ Add secondary insurance"
button. When expanded, renders the same 6-field grid as
`InsurancePrimaryForm` with `secondary`-prefixed ids, plus a "Remove"
button in the section header.

Clicking "Remove" calls `clearInsuranceSecondary` (sets the store
field back to `null`) and collapses the form. The form auto-expands
on mount if `insuranceSecondary` is already non-null (i.e. data was
previously saved).

Input ids (prefix `secondary`): `secondaryCarrier`, `secondaryPlanName`,
`secondaryMemberId`, `secondaryGroupNumber`, `secondaryPolicyHolderName`,
`secondaryEffectiveDate`.

Store actions used: `updateInsuranceSecondary`, `clearInsuranceSecondary`.

### src/components/ProfilePage.test.tsx
Component tests for `PersonalDetailsForm`, `EmergencyContactForm`,
and `AllergyList` using `@testing-library/react` and Vitest.

Test coverage:
- **PersonalDetailsForm** — all 16 fields render; typing in
  `firstName` and `dateOfBirth` calls `updatePersonal` with the
  correct value.
- **EmergencyContactForm** — all 3 fields render; typing in `name`
  calls `updateEmergencyContact` with the correct value.
- **AllergyList** — empty state message; Add creates a new allergy;
  Delete removes the correct allergy by id; changing severity updates
  the correct allergy in the store.

Uses an in-memory localStorage mock and `clearAll` in `beforeEach`
for test isolation. Queries use `getByLabelText` (relies on
`htmlFor`/`id` pairs) and `getByRole`.

Requires `jsdom` environment and `@testing-library/react` — see test
setup section below.

### src/components/InsurancePage.test.tsx
Component tests for `InsurancePrimaryForm` and `InsuranceSecondaryForm`,
plus a smoke test that renders `InsurancePage` and confirms both section
headings are present.

Test coverage:
- **InsurancePage** — both "Primary Insurance" and "Secondary Insurance"
  headings render.
- **InsurancePrimaryForm** — all 6 fields render; typing in `carrier`
  and `memberId` each call `updateInsurancePrimary` with the correct value.
- **InsuranceSecondaryForm** — section renders when `insuranceSecondary`
  is `null`; "Add secondary insurance" button is present in collapsed
  state; typing after opting in creates the store object with the correct
  value; "Remove" button is visible when the form is expanded; clicking
  "Remove" sets `insuranceSecondary` to `null` and collapses back to the
  add button.

### src/pages/ProfilePage.tsx
Composes `PersonalDetailsForm`, `EmergencyContactForm`, and
`AllergyList`. Thin wrapper with no business logic or store access —
serves as the pattern for all other pages.

### src/App.tsx
The application shell. Contains `BrowserRouter`, renders `<PageHeader />`
above the content area, and declares the `<Routes>` / `<Route>` entries.
**No business logic, no store access, no data fetching here.**
If you find yourself importing `usePatientStore` in App.tsx, move
that logic into the relevant page or component instead.

The navigation tabs are part of `PageHeader`, not `App.tsx`.

Router: react-router-dom v7 (`BrowserRouter`).

### src/pages/
Screen-level components, one file per route. Each page is the
top-level owner of its section's data — it reads from the store
and passes props down to components.

Route map:

| File | Path | Purpose |
|------|------|---------|
| `OverviewPage.tsx` | `/` | Summary of all sections |
| `ProfilePage.tsx` | `/profile` | Personal details + emergency contact |
| `MedicationsPage.tsx` | `/medications` | Medication list + add/edit/remove |
| `VaccinationsPage.tsx` | `/vaccinations` | Vaccination list + add/edit/remove |
| `ProceduresPage.tsx` | `/procedures` | Procedure list + add/edit/remove |
| `InsurancePage.tsx` | `/insurance` | Primary insurance form + opt-in secondary insurance form |
| `SharePage.tsx` | `/share` | Share tokens + access log |

### src/pages/pages.test.ts
Smoke tests that verify every page module exists and exports a
default function. Uses Vitest's `it.each` over the route map array.
These tests catch missing files, bad exports, and import errors
before any rendering logic is written.

### src/core/store.test.ts
Vitest tests for the Zustand store. Covers every action in store.ts:
personal details, emergency contact, allergies, medications,
vaccinations, procedures, insurance (primary and secondary),
share tokens, access log, and `clearAll`.

Uses an in-memory localStorage mock (defined at the top of the file)
so tests run in Node without a browser. The mock is reset and the
store is cleared in `beforeEach` to guarantee test isolation.

Run with `npm test`. All tests must pass before building any Layer 1
component that uses the store.

---

## Data design decisions

### UUIDs on every list item
Medications, vaccinations, procedures, and allergies all have an `id`
field populated by `uuid()`. This is required for stable React keys
and for targeting specific items in delete/update operations.
Never use array indices as identifiers.

### ISO 8601 dates as strings
All dates are stored as strings in ISO 8601 format ("1978-03-04"
for dates, "2024-01-15T09:30:00.000Z" for timestamps).
Never store Date objects — they do not serialize cleanly to JSON
and introduce timezone bugs. Convert to display format only in
the UI layer.

### source field on medications and vaccinations
Both types carry `source: 'provider' | 'self-reported'`. This
distinguishes data entered by the patient from data pulled from
a verified EHR. Clinically important — providers need to know
which data has been verified.

### Storage adapter pattern
Nothing in the project calls localStorage directly except
storage.ts. This is an intentional architectural boundary.
When Layer 4 replaces localStorage with a real backend, only
storage.ts changes. All components and the Zustand store
remain untouched.

---

## Production upgrade path (Layer 4)

Each prototype choice has a direct production replacement:

| Prototype | Production replacement |
|-----------|----------------------|
| localStorage | Postgres via Supabase + row-level security |
| storage.ts adapter | API calls to FastAPI backend |
| UUID share tokens | Short-lived signed JWTs with expiry |
| No auth | Supabase Auth — OAuth 2.0 + MFA |
| window.print() | Server-side PDF with digital signature |
| Client-only app | FastAPI backend (Python) at server/ |
| Flat JSON schema | Native FHIR R4 resource serialization |

The FastAPI backend will live in a separate `server/` directory
managed by uv. It will not affect the `client/` directory.

---

## Key constraints
- Prototype uses no real PHI — test data only
- Zero cost at every stage of the prototype
- Security and HIPAA compliance are fully deferred to Layer 4
- The frontend is a responsive web app — no native mobile build
  needed. A PWA manifest will be added in Layer 2 for
  "add to home screen" on iOS and Android.