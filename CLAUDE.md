# HIE Prototype — Claude Code Guide

## Project purpose
A patient-controlled health information exchange prototype.
Patients fill in their medical information once and share it
with providers at check-in. Solving the pain point of
repeatedly filling out the same medical forms.

## Current build status
- Layer 0 (data model): COMPLETE — do not modify core/ types without discussion
- Layer 1 (patient UI): IN PROGRESS — store complete, routing complete, integration tests complete, ProfilePage ✅, InsurancePage ✅, remaining pages (Medications, Vaccinations, Procedures, Overview) 🔶
- Layer 2 (sharing): IN PROGRESS — sharing.ts complete and tested
- Layer 3 (consent/audit log): IN PROGRESS — accessLog.ts complete and tested
- Layer 4 (production/HIPAA): NOT STARTED — deferred

## Tech stack
- Frontend: React + Vite + TypeScript + Tailwind CSS
- State: Zustand
- Storage: localStorage (prototype only — swappable at Layer 4)
- Testing: Vitest
- Node: v22

## Project structure
```
src/
  core/         ← Layer 0. Pure logic, no React imports, no browser APIs
                   except via storage.ts. Never modify types.ts without
                   updating schema.test.ts.
  components/   ← Layer 1 UI components
                   PageHeader.tsx — navy header with avatar, progress bar, nav tabs
                   PersonalDetailsForm.tsx — imperial/metric toggle, StateCombobox, formatPhone
                   EmergencyContactForm.tsx
                   AllergyList.tsx — pill-tag list, inline editable
                   StateCombobox.tsx — searchable US state dropdown
                   formatPhone.ts — phone auto-formatting utility
                   InsurancePrimaryForm.tsx — 6-field form, id prefix "primary"
                   InsuranceSecondaryForm.tsx — opt-in form with add/remove toggle, id prefix "secondary"
  pages/        ← Layer 1 screen-level components
                   ProfilePage.tsx ✅ · InsurancePage.tsx ✅ · remaining pages 🔶 placeholder only
  App.tsx       ← routing only — renders PageHeader + Routes, no business logic
```

## Non-negotiable rules
- Never import React or any UI library inside src/core/
- Never call localStorage directly — always use src/core/storage.ts
- Every list item (medication, allergy, etc.) must use a uuid id field,
  never an array index
- All dates stored as ISO 8601 strings ("1978-03-04"), never Date objects
- All new factory functions go in src/core/schema.ts and get a test.
  If a module needs a factory under a different name or signature, it
  re-exports and wraps from schema.ts — it does not define a second factory
- App.tsx contains routing only — no store access, no business logic,
  no data fetching; if you need store data, put it in the page or component
- Pages in src/pages/ compose components from src/components/ — form
  logic and store access belong in components, not in page files directly
- Zustand `persist` middleware is intentionally not used — all
  persistence is handled exclusively by storage.ts; do not add
  `persist` back to the store
- Every `<label>` must have `htmlFor` matching its input's `id` —
  required for accessibility and for `getByLabelText` to work in tests
- Input `id` values must be prefixed per form (e.g. `emergencyName`,
  `emergencyPhone`) to avoid conflicts when multiple forms appear on
  the same page
- Components interact with the store exclusively via `usePatientStore` —
  never import or call storage.ts directly from a component; use the
  store actions (updatePersonal, addAllergy, etc.) instead. Use
  selector form (`usePatientStore(s => s.record.medications)`) to
  subscribe only to the slice of state the component needs
- Never use `window` or `document` inside src/core/ — core/ is pure
  logic and must remain browser-agnostic. When a function needs browser
  context (e.g. the current origin), accept it as an explicit parameter
  from the caller. The `shareUrl(token, origin)` pattern in sharing.ts
  is the correct model: the component passes `window.location.origin`,
  core/ never touches it directly

## Data model
The source of truth is src/core/types.ts. Every form field in the UI
maps to a field in PatientRecord. Before building any form, read
types.ts first.

## Running the project
- Dev server: npm run dev
- Tests: npm test
- Watch mode: npm run test:watch

## Security notes (prototype)
- No real auth — this is a prototype with fake/test data only
- No real PHI should ever be entered
- Share tokens are UUIDs stored in localStorage
- Security is fully deferred to Layer 4

## When in doubt
- Check src/core/types.ts for field names and types
- Run npm test before and after any changes to src/core/
- Ask before modifying anything in src/core/
