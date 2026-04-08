# HIE Prototype

A patient-controlled health information exchange prototype. Patients fill in their medical information once and share it with providers at check-in via QR code, link, clipboard, or print — eliminating the need to re-fill the same intake forms at every new provider.

> **Prototype only.** No real PHI should ever be entered. Security and HIPAA compliance are deferred to Layer 4.

---

## Current build status

| Layer | Name | Status |
|-------|------|--------|
| 0 | Data model | ✅ Complete |
| 1 | Patient UI | ✅ Complete |
| 2 | Sharing | ✅ Complete |
| 3 | Consent & audit log | ✅ Complete |
| 4 | Production / HIPAA | ⬜ Deferred |

---

## Tech stack

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS 4** — utility-class styling via Vite plugin
- **Zustand** — global state, no persist middleware (storage handled by `src/core/storage.ts`)
- **react-router-dom v7** — client-side routing
- **qrcode.react** — QR code generation for share page
- **uuid** — collision-free IDs for all list items
- **Vitest** + **@testing-library/react** — unit and component tests (344 tests, 15 test files)
- **localStorage** — prototype persistence (swappable at Layer 4)

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Commands

```bash
npm run dev          # dev server
npm test             # run all tests
npm run test:watch   # tests in watch mode
npm run build        # production build (tsc + vite)
npm run lint         # ESLint
```

---

## Project structure

```
src/
  core/          Layer 0 — pure logic, no UI dependencies
    types.ts       Data model (source of truth)
    schema.ts      Factory functions for all record types
    storage.ts     localStorage adapter (only place that touches storage)
    store.ts       Zustand store with all actions
    sharing.ts     Layer 2 — share token generation and URL helpers
    accessLog.ts   Layer 3 — consent and audit log logic
    progress.ts    Profile completion percentage (used by PageHeader)
  components/    Layer 1 — reusable UI components
    PageHeader.tsx, PersonalDetailsForm.tsx, EmergencyContactForm.tsx
    AllergyList.tsx, MedicationList.tsx, VaccinationList.tsx
    ProcedureList.tsx, InsurancePrimaryForm.tsx, InsuranceSecondaryForm.tsx
    PrintSummary.tsx, StateCombobox.tsx, formatPhone.ts
  pages/         Layer 1 — screen-level views, one per route
    LandingPage.tsx    / — home, folder nav, HealthPass branding
    ProfilePage.tsx    /profile
    InsurancePage.tsx  /insurance
    MedicationsPage.tsx  /medications
    VaccinationsPage.tsx /vaccinations
    ProceduresPage.tsx   /procedures
    OverviewPage.tsx     /overview — read-only summary with edit links
    SharePage.tsx        /share — QR code, copy/print, section picker, access log
  App.tsx        Routing only — no store access, no business logic
  main.tsx       React entry point
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full annotated file reference, data model, and architectural decisions.
