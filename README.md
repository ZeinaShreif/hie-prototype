# HIE Prototype

A patient-controlled health information exchange prototype. Patients fill in their medical information once and share it with providers at check-in via QR code, link, clipboard, or print — eliminating the need to re-fill the same intake forms at every new provider.

> **Prototype only.** No real PHI should ever be entered. Security and HIPAA compliance are deferred to Layer 4.

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, build layers, file reference, data decisions |
| [FrontEnd_Instructions.md](./FrontEnd_Instructions.md) | Frontend developer guide — what to build, patterns, styling, rules |

---

## Current build status

| Layer | Name | Status |
|-------|------|--------|
| 0 | Data model | ✅ Complete |
| 1 | Patient UI | 🔶 In progress |
| 2 | Sharing | 🔶 In progress |
| 3 | Consent & audit log | 🔶 In progress |
| 4 | Production / HIPAA | ⬜ Deferred |

Layer 1 progress: store ✅ · routing ✅ · integration tests ✅ · ProfilePage ✅ · remaining pages 🔶

---

## Tech stack

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS 4** — utility-class styling via Vite plugin
- **Zustand** — global state, no persist middleware (storage handled by `src/core/storage.ts`)
- **react-router-dom v7** — client-side routing
- **Vitest** + **@testing-library/react** — unit and component tests
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
  core/          Layer 0 — pure logic, no UI dependencies (do not modify)
  components/    Layer 1 — reusable UI components
  pages/         Layer 1 — screen-level views, one per route
  App.tsx        Routing only
  main.tsx       React entry point
```

Core logic for Layers 2 and 3 (`sharing.ts`, `accessLog.ts`) lives in `src/core/`. UI for those layers is not yet built.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full annotated file reference and [FrontEnd_Instructions.md](./FrontEnd_Instructions.md) for component patterns, styling guide, and build order.
