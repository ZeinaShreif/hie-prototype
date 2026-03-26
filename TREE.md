# File Architecture Tree

How every source file relates to the others.

```
hie-prototype/
│
├── main.tsx                        Entry point — mounts <App /> into the DOM
│
├── index.css                       Design tokens (@theme) and shared CSS classes
│                                   (@layer components: hie-section, hie-section-header,
│                                    hie-section-title, hie-field, hie-field-left,
│                                    hie-label, hie-input)
│
├── App.tsx                         Routing shell — no store access, no business logic
│   ├── uses: react-router-dom
│   ├── renders: <PageHeader /> (on every route)
│   └── routes →
│       ├── /              → OverviewPage
│       ├── /profile       → ProfilePage
│       ├── /medications   → MedicationsPage
│       ├── /vaccinations  → VaccinationsPage
│       ├── /procedures    → ProceduresPage
│       ├── /insurance     → InsurancePage
│       └── /share         → SharePage
│
├── core/                           Layer 0 — pure logic, no React, no browser APIs
│   │
│   ├── types.ts                    Source of truth for all data shapes
│   │                               (PatientRecord, Personal, EmergencyContact,
│   │                                Medication, Vaccination, Procedure, Allergy,
│   │                                ShareToken, AccessLogEntry)
│   │
│   ├── schema.ts                   Factory functions that build default objects
│   │   ├── imports: types.ts, uuid │ (newAllergy, newMedication, newVaccination …)
│   │   └── exports: createEmptyPatientRecord, newAllergy, newMedication …
│   │
│   ├── storage.ts                  The ONLY file allowed to touch localStorage
│   │   ├── imports: types.ts
│   │   └── exports: storage.load(), storage.save()
│   │
│   ├── store.ts                    Zustand store — single source of UI state
│   │   ├── imports: types.ts, schema.ts, storage.ts
│   │   ├── exports: usePatientStore()   ← all components use this hook
│   │   └── actions: updatePersonal, updateEmergencyContact,
│   │               add/update/remove{Allergy,Medication,Vaccination,Procedure},
│   │               updateInsurancePrimary, updateInsuranceSecondary,
│   │               clearInsuranceSecondary, addShareToken, revokeShareToken,
│   │               appendLog, clearAll
│   │
│   ├── sharing.ts                  Share-token logic and clipboard text builder
│   │   ├── imports: types.ts
│   │   └── exports: isTokenActive, shareUrl, buildClipboardText …
│   │
│   └── accessLog.ts                Consent / audit log entry management
│       ├── imports: types.ts, schema.ts
│       └── exports: appendAccessLog, getAccessLog …
│
├── components/                     Layer 1 — reusable UI pieces
│   │
│   ├── PageHeader.tsx              Navy header rendered on every page
│   │   ├── imports: react-router-dom (NavLink), store
│   │   ├── reads store: personal
│   │   └── renders: avatar · full name · DOB · save button
│   │                progress bar · nav tabs (Overview / Profile / Meds …)
│   │
│   ├── PersonalDetailsForm.tsx     All personal detail fields
│   │   ├── imports: store, formatPhone, StateCombobox
│   │   ├── reads/writes store: personal
│   │   └── features: imperial ↔ metric toggle (height/weight),
│   │                 dropdowns for Gender / Marital Status / Blood Type,
│   │                 searchable combobox for State,
│   │                 phone auto-format on every keystroke,
│   │                 height/weight parsed and committed on blur
│   │
│   ├── EmergencyContactForm.tsx    Emergency contact fields
│   │   ├── imports: store, formatPhone
│   │   ├── reads/writes store: emergencyContact
│   │   └── features: "On file" badge when name is present,
│   │                 phone auto-format on every keystroke
│   │
│   ├── AllergyList.tsx             Allergy pill tags
│   │   ├── imports: store, schema (newAllergy), types (Allergy)
│   │   ├── reads/writes store: allergies[]
│   │   └── features: inline substance + reaction inputs,
│   │                 severity badge (mild / moderate / severe),
│   │                 add / remove per tag
│   │
│   ├── StateCombobox.tsx           Searchable US-state dropdown
│   │   ├── imports: React (useState, useRef, useEffect)
│   │   ├── props: id, value, onChange
│   │   └── features: type-to-filter (matches anywhere in name),
│   │                 click/focus to show all 50 states + DC,
│   │                 position: fixed dropdown (escapes overflow: hidden),
│   │                 reverts to committed value on invalid blur
│   │
│   ├── formatPhone.ts              Pure utility — no React, no store
│   │   └── exports: formatPhone(raw) → "(000) 000-0000"
│   │
│   ├── InsurancePrimaryForm.tsx    Primary insurance fields
│   │   ├── imports: store
│   │   ├── reads/writes store: insurancePrimary
│   │   └── features: 6 fields (carrier, plan, member ID, group number,
│   │                 policy holder, effective date), "On file" badge,
│   │                 id prefix "primary" (primaryCarrier, etc.)
│   │
│   ├── InsuranceSecondaryForm.tsx  Secondary insurance — opt-in
│   │   ├── imports: store
│   │   ├── reads/writes store: insuranceSecondary
│   │   └── features: collapsed to "+ Add" button when null,
│   │                 "Remove" button in header clears store field,
│   │                 auto-expands if data was previously saved,
│   │                 id prefix "secondary" (secondaryCarrier, etc.)
│   │
│   └── InsurancePage.test.tsx      Component tests for insurance forms
│
└── pages/                          Layer 1 — screen-level composers
    │                               (form logic stays in components, not here)
    │
    ├── ProfilePage.tsx             Composes the three profile components
    │   ├── renders: <PersonalDetailsForm />
    │   │           <EmergencyContactForm />
    │   │           <AllergyList />
    │   └── no direct store access
    │
    ├── InsurancePage.tsx           Composes InsurancePrimaryForm + InsuranceSecondaryForm
    │   ├── renders: <InsurancePrimaryForm />
    │   │           <InsuranceSecondaryForm />
    │   └── no direct store access
    │
    ├── SharePage.tsx               Share-token UI (uses sharing.ts via store) — deferred
    ├── OverviewPage.tsx            (stub — build last)
    ├── MedicationsPage.tsx         (stub)
    ├── VaccinationsPage.tsx        (stub)
    └── ProceduresPage.tsx          (stub)
```

## Dependency flow

```
types.ts
   ↑
   ├── schema.ts ──────────────────────────┐
   ├── storage.ts                          │
   ├── sharing.ts                          ▼
   └── accessLog.ts ──────────► store.ts (usePatientStore)
                                           ↑
                              ┌────────────┼────────────┐
                         PageHeader   components     (future pages)
                                          ↑
                                       pages/
```

### Rules enforced by CLAUDE.md

| Rule | Why |
|------|-----|
| `core/` never imports React or browser APIs | keeps logic testable in pure Node |
| `storage.ts` is the only localStorage accessor | swappable at Layer 4 (HIPAA) |
| Components use `usePatientStore()` exclusively | never import storage.ts directly |
| `App.tsx` contains routing only | no store access, no business logic |
| Every list item uses a `uuid` id field | never rely on array index |
| All dates stored as ISO 8601 strings | no Date objects in the store |
