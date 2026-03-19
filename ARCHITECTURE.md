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
| 1 | Patient UI | Not started | Forms, tabs, overview screen |
| 2 | Sharing | Not started | QR code, link, clipboard, print |
| 3 | Consent & audit log | Not started | Access log, token revocation |
| 4 | Production | Deferred | Auth, encryption, HIPAA, FHIR API |

---

## Directory structure
```
hie-prototype/
  src/
    core/               Layer 0 — pure logic, no UI dependencies
    components/         Layer 1 — reusable UI components
    pages/              Layer 1 — full screen views
    App.tsx             Routing only, no business logic
    main.tsx            React entry point, do not edit
  CLAUDE.md             Instructions for Claude Code sessions
  ARCHITECTURE.md       This file
  package.json
  vite.config.ts
  tsconfig.json
```

---

## Frontend notes

### Tailwind CSS
Tailwind is configured via the `@tailwindcss/vite` plugin in
`vite.config.ts` — no `tailwind.config.js` file is needed.
`src/index.css` is the CSS entry point and contains only:
```css
@import "tailwindcss";
```
All component styling uses Tailwind utility classes directly.

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

**`vite.config.ts` test block:**
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

Styling is done with Tailwind CSS utility classes throughout.

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
`updatePersonal` on every input change — no submit button, changes
persist automatically through the store on each keystroke.

Handles the `number | null` fields (`heightFt`, `heightIn`,
`weightLbs`) by converting empty string ↔ null at the input boundary
so the store always receives the correct type.

Input ids: `firstName`, `lastName`, `dateOfBirth`, `gender`,
`address`, `city`, `state`, `zip`, `phone`, `email`, `heightFt`,
`heightIn`, `weightLbs`, `primaryLanguage`, `maritalStatus`,
`bloodType`.

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
3-column row (substance, reaction, severity + delete). All fields
are editable in place — changes call `updateAllergy(id, { field })`
immediately, no save button.

- **Add** button calls `newAllergy()` from schema.ts and passes the
  result to `addAllergy` — no intermediate state needed.
- **Delete** button calls `removeAllergy(id)` for that row only.
- **Severity** is a `<select>` with options: mild, moderate, severe.
- Shows "No allergies recorded." when the list is empty.

Store actions used: `addAllergy`, `updateAllergy`, `removeAllergy`.

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

### src/pages/ProfilePage.tsx
Composes `PersonalDetailsForm`, `EmergencyContactForm`, and
`AllergyList`. Thin wrapper with no business logic or store access —
serves as the pattern for all other pages.

### src/App.tsx
The application shell. Contains `BrowserRouter`, the `<nav>` with
`NavLink` entries, and the `<Routes>` / `<Route>` declarations.
**No business logic, no store access, no data fetching here.**
If you find yourself importing `usePatientStore` in App.tsx, move
that logic into the relevant page or component instead.

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
| `InsurancePage.tsx` | `/insurance` | Primary + secondary insurance |
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