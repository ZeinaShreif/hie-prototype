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
| 2 | Sharing | ⬜ Not started |
| 3 | Consent & audit log | ⬜ Not started |
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

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full file reference and [FrontEnd_Instructions.md](./FrontEnd_Instructions.md) for the component patterns, styling guide, and build order.
