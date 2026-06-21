# AgentOS — AI Agent Marketplace & Evaluation Platform

A premium, production-style platform to **browse, evaluate, and ship** 24 coding agents
(B1–B6, I1–I6, A1–A6, D1–D6) — with prompts, execution flows, verification evidence and
metrics computed from the repository itself. A ground-up redesign (Linear/Vercel/Raycast-inspired)
of a reference "agent library" with richer UX and a stronger information architecture.

> Built with Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Framer Motion ·
> Recharts · Zustand · next-themes.

## ✨ Features
- **Dashboard** — animated counters, verification-by-tier + average-score-by-category charts,
  a recent-activity feed (real git history), and the top-scoring agents. Every number is
  derived from real repo data (see [Data integrity](#-data-integrity)).
- **Agent Library** (`/agents`) — search, tier filters, sort, favorites, score rings,
  status/difficulty badges, animated filtering, and a split-pane document viewer.
- **Agent Detail** (`/agents/[id]`) — tabbed info (Overview / Execution Flow / Inputs / Outputs /
  Verification / Related / Versions) + a professional document/prompt viewer (line numbers, copy,
  download, wrap, fullscreen) that renders the **real ingested task markdown**.
- **Projects** (`/projects`) — real systems built and verified by the agents, with stack + metrics.
- **Documentation** (`/documentation`) — sectioned docs index.
- **Reports** (`/reports`) — evidence-backed records per evaluation, each **downloadable as Markdown**.
- **Global command palette** (⌘K / Ctrl+K), **dark/light/system** theme, glassmorphism + gradient
  design system, page transitions, persisted favorites, and full `error` / `loading` / `not-found`
  boundaries.

## 🏗 Architecture
```
src/
├─ app/                      # App Router (RSC by default)
│  ├─ layout.tsx             # ThemeProvider + AppShell (sidebar/topbar/command-palette)
│  ├─ page.tsx               # Dashboard
│  ├─ agents/page.tsx        # Library (client: filters/search/sort)
│  ├─ agents/[id]/page.tsx   # Detail (SSG via generateStaticParams)
│  ├─ projects | documentation | reports/   # content pages
│  ├─ error.tsx · loading.tsx · not-found.tsx · global-error.tsx   # route boundaries
│  └─ globals.css            # Design tokens + glass/gradient/animation utilities
├─ components/
│  ├─ app-shell · sidebar · topbar · command-palette   # shell
│  ├─ agent-card · agent-detail · doc-viewer · prompt-viewer · report-download
│  ├─ charts · counter · relative-time · theme-provider # widgets
│  └─ ui/kit.tsx             # Card, Badge, IllustrativeBadge, ScoreRing
├─ content/
│  ├─ agents-content.json    # real ingested task markdown (scripts/ingest.mjs)
│  └─ metrics.json           # build-time-generated dashboard metrics (scripts/build-metrics.mjs)
└─ lib/
   ├─ agents.ts              # typed agent catalog (source of truth) + lookups
   ├─ projects.ts            # Projects showcase
   ├─ content.ts             # ingested-content accessors
   ├─ metrics.ts             # reads metrics.json
   ├─ data.ts                # barrel re-export of the above
   ├─ store.ts               # Zustand (favorites, command-palette) — localStorage persisted
   └─ utils.ts               # cn() + helpers
```

### State management
- **Zustand** (`useUI`) for client UI state (favorites, command-palette open) with `persist`.
- **next-themes** for theme; **RSC + SSG** for data/pages.

## 🔒 Data integrity
No dashboard number is hand-entered telemetry. `scripts/build-metrics.mjs` regenerates
`src/content/metrics.json` by scanning the repository:

| Metric | Source |
|--------|--------|
| `totalAgents`, `completed`, `successRate`, `avgScore` | the typed catalog in `lib/agents.ts` |
| `executions` | sum of **passing test cases** parsed from every `**/VERIFICATION_RESULTS.md` (pytest / jest / cargo footers, green runs only) |
| `projects` | entries in `lib/projects.ts` |
| `trend` | verification progress per tier, from the catalog |
| `categoryPerf` | average score per category, from the catalog |
| `activity` | real commits (subject + ISO author date) touching the task folders |

Anything that can't be derived from real data is flagged in `metrics.json` under
`isIllustrative` and rendered with a visible **Illustrative** badge — never implied as live
telemetry. A drift test fails CI if `metrics.json` no longer matches the catalog. Ingested
content is run through a home-directory redaction so no machine-specific path ships in the bundle.

## 🧪 Testing
Dependency-free Node test runner (`node --test`):
```bash
npm run build:metrics   # regenerate metrics.json from the repo
npm test                # parser units, metrics.json schema + drift, no-local-paths, route guards
npm run lint
npm run build
```

## 🚀 Getting started
```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start   # production
```
Shortcuts: **⌘K / Ctrl+K** command palette · theme toggle in the top bar.

## ☁️ Deployment (Vercel)
```bash
vercel            # or: push to GitHub and import the repo in Vercel
```
`metrics.json` and `agents-content.json` are committed, so the deploy is fully static/SSG and
doesn't need the sibling task folders. Regenerate them locally (or in CI) before deploying.
Security headers (CSP, HSTS, X-Frame-Options, …) are set in `next.config.ts`.

## 📈 Performance
SSG pages, no blocking client data, fonts via `next/font`, code-split routes — targets 95+
Lighthouse across Performance / Accessibility / SEO / Best Practices.

## Screenshots

**dashboard**

![dashboard](screenshots/dashboard.png)

**agent detail**

![agent detail](screenshots/agent-detail.png)

**agents**

![agents](screenshots/agents.png)
