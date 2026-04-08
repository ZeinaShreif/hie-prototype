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
│   ├── /              → LandingPage (standalone — no PageHeader)
│   └── /*             → AppShell (renders <PageHeader /> above inner routes)
│       ├── /overview      → OverviewPage
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
│   │               appendLog, clearLog, clearAll
│   │
│   ├── sharing.ts                  Share-token logic and clipboard text builder
│   │   ├── imports: types.ts, schema.ts
│   │   └── exports: ALL_SECTIONS, createShareToken, isTokenActive,
│   │               shareUrl, getActiveTokens, getRevokedTokens, buildClipboardText
│   │
│   └── accessLog.ts                Consent / audit log entry management
│       ├── imports: types.ts, schema.ts
│       └── exports: createLogEntry, filterByMethod, filterByDateRange,
│                   getActiveEntries, getRevokedEntries, revokeEntry, summariseLog
│
├── components/                     Layer 1 — reusable UI pieces
│   │
│   ├── PageHeader.tsx              Navy header rendered on every inner-route page
│   │   ├── imports: react-router-dom (NavLink, Link), store
│   │   ├── props: onSave?: () => void
│   │   ├── reads store: personal
│   │   └── renders: avatar (Link to /) · full name · today's date · save button (2s success state)
│   │                progress bar · nav tabs (/overview / /profile / /medications …)
│   │                className="no-print" — hidden when printing
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
│   ├── InsurancePage.test.tsx      Component tests for insurance forms
│   ├── MedicationsPage.test.tsx    Component tests for MedicationList (48 tests):
│   │                               Today view, My List view, add/edit/delete,
│   │                               collapse/expand, reminder toggle, past meds section,
│   │                               multi-dose rows, mark-as-missed, missed doses log
│   ├── VaccinationsPage.test.tsx   Component tests for VaccinationList
│   ├── ProceduresPage.test.tsx     Component tests for ProcedureList
│   └── OverviewPage.test.tsx       Component tests for OverviewPage (wrapped in MemoryRouter)
│
└── pages/                          Layer 1 — screen-level composers
    │                               (form logic stays in components, not here)
    │
    ├── LandingPage.tsx             Home screen at /
    │   ├── imports: react-router-dom (Link), store
    │   ├── reads store: personal (for patient name in top strip)
    │   ├── reads localStorage: hie_disclaimer_acknowledged (UI-only flag, not PHI)
    │   └── renders: top strip (name, Settings/Sign-out stubs) · HealthPass hero ·
    │               folder nav (OverviewFolder full-width + 6 GridFolders) ·
    │               disclaimer warning box · DisclaimerModal (shown once per session)
    │
    ├── LandingPage.test.tsx        29 tests — top strip, hero, folder labels/links,
    │                               disclaimer warning box, disclaimer modal
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
    ├── MedicationsPage.tsx         Renders <MedicationList /> (Today/My List views)
    ├── VaccinationsPage.tsx        Renders <VaccinationList />
    ├── ProceduresPage.tsx          Renders <ProcedureList />
    │
    ├── OverviewPage.tsx            Read-only summary page at /overview
    │   ├── renders: identity banner (name, DOB, sex, blood type,
    │   │           emergency contact, insurance carrier)
    │   └── renders: 4 SummaryCards (Allergies, Medications,
    │               Vaccinations, Procedures) with count + preview + Edit link
    │
    ├── SharePage.tsx               Layer 2 + 3 sharing UI
    │   ├── imports: sharing.ts (createShareToken, ALL_SECTIONS,
    │   │           shareUrl, buildClipboardText), accessLog.ts (createLogEntry)
    │   ├── reads store: shareTokens, log
    │   ├── renders: <PrintSummary sections={selectedSections} /> (outside no-print wrapper)
    │   └── sections: section picker · QR hero · other sharing methods
    │                 · collapsible access log (Clear log, Revoke for link/qr)
    │
    └── SharePage.test.tsx          25 component tests for SharePage
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
                         PageHeader   components      pages/
                                          ↑
                                   PrintSummary ← SharePage
```

### Rules enforced by CLAUDE.md

| Rule | Why |
|------|-----|
| `core/` never imports React or browser APIs | keeps logic testable in pure Node |
| `storage.ts` is the only localStorage accessor | swappable at Layer 4 (HIPAA) |
| Components use `usePatientStore()` exclusively | never import storage.ts directly |
| `App.tsx` contains routing only | no store access, no business logic, no data fetching |
| Every list item uses a `uuid` id field | never rely on array index |
| All dates stored as ISO 8601 strings | no Date objects in the store |
