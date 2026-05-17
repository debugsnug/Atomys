# ATOMYS — Goal Setting & Tracking Portal

A full-featured enterprise goal management platform built for the **AtomQuest Hackathon 1.0**. ATOMYS enables structured goal creation, manager approval workflows, quarterly check-ins, and real-time performance analytics — all within a secure, role-based interface.

## Live Demo

> **URL:** [https://atomys.vercel.app](https://atomys.vercel.app) *(update after deployment)*

### Demo Credentials

The login page provides **1-click role-switching buttons** for quick evaluation:

| Role | Email | Password |
|------|-------|----------|
| Employee | `employee@demo.com` | `demo123` |
| Manager | `manager@demo.com` | `demo123` |
| Admin | `admin@demo.com` | `demo123` |

> Use the **EMP / MAN / ADM** buttons at the bottom of the sidebar to switch roles instantly without re-logging.

---

## Tech Stack & Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, CSS Modules |
| **Backend** | Next.js API Routes (serverless functions) |
| **Database** | Turso (libSQL) — SQLite-compatible, edge-deployed |
| **ORM** | Prisma 5 with libSQL adapter |
| **Auth** | JWT (httpOnly cookies) + Microsoft Entra ID SSO (MSAL) |
| **Notifications** | Microsoft Teams Adaptive Cards (Incoming Webhooks) |
| **Charts** | Recharts |
| **Hosting** | Vercel (edge-optimized) |

---

## Features

### Core (BRD Phase 1 & 2)

- **Goal Creation** — Employees create goal sheets with thrust areas, UoM types (Numeric, %, Timeline, Zero-based), targets, and weightages
- **Validation Rules** — System-enforced: total weight = 100%, min 10% per goal, max 8 goals
- **Manager Approval Workflow** — Inline editing of targets/weightages during review, approve or return with mandatory feedback
- **Goal Locking** — Approved goals are immutable; only Admin can force-unlock
- **Shared Goals** — Department-wide KPIs pushed to multiple employees with read-only title/target, achievement sync across all linked sheets
- **Quarterly Check-ins** (Q1–Q4) — Employees log actual achievements; system computes scores per UoM formula
- **Hard Calendar Windows** — Check-in submissions blocked outside active cycle windows (403 Forbidden)
- **Manager Check-in Comments** — Structured discussion logs per quarter
- **Achievement Reports** — Exportable CSV with Planned vs Actual for all employees
- **Completion Dashboard** — Real-time view of quarterly check-in status
- **Audit Trail** — Full change log: who changed what, when, with old/new values

### Bonus Features (Section 5)

- **5.1 Microsoft Entra ID SSO** — Full OAuth2 flow via `@azure/msal-node`. Auto-provisions users, syncs org hierarchy from Azure AD, maps security groups to roles
- **5.2 Microsoft Teams Notifications** — Adaptive Card webhooks for goal submissions, approvals, returns, and escalations with deep-link support
- **5.3 Escalation Module** — Configurable rules (no submission, no approval, no check-in), threshold days, 3-level chain (Employee → Manager → HR/Skip-Level), resolution tracking
- **5.4 Analytics Module** — QoQ achievement trends, completion heatmaps, goal distribution by thrust area and UoM, department comparison charts

### Beyond BRD

- **AI Goal Copilot** — Domain-specific goal suggestions (BLDC motors, IoT, retail) with 1-click auto-fill
- **Gamified Leaderboard** — Streak multipliers, achievement badges, department rankings
- **Command Palette** — `Ctrl+K` to search and navigate anywhere instantly
- **Notification Center** — Bell icon with unread badge and categorized notification feed
- **Glassmorphism UI** — Premium dark theme with spotlight hover effects, skeleton loaders, and smooth page transitions

---

## Project Structure

```
goal-tracker/
├── prisma/
│   └── schema.prisma          # Database schema (13 models)
├── public/
│   └── atomys-logo.png        # Brand logo
├── src/
│   ├── app/
│   │   ├── api/               # 9 API route groups
│   │   │   ├── auth/          # Login, logout, SSO, session
│   │   │   ├── goals/         # CRUD, submit, approve, quarterly
│   │   │   ├── admin/         # Cycles, users, audit
│   │   │   ├── analytics/     # Charts & heatmap data
│   │   │   ├── escalations/   # Rule engine & resolution
│   │   │   ├── notifications/ # Teams webhook integration
│   │   │   ├── reports/       # Achievement & dashboard
│   │   │   ├── shared-goals/  # Shared KPI management
│   │   │   └── thrust-areas/  # Department thrust areas
│   │   ├── globals.css        # Design system (1000+ lines)
│   │   ├── layout.js          # Root layout with SEO
│   │   └── page.js            # Entry point
│   ├── components/            # 21 UI components
│   ├── context/               # AuthContext (JWT session)
│   └── lib/                   # Auth, Prisma, Azure, notifications
├── .env.example               # Full configuration reference
├── architecture.md            # Architecture diagram
└── package.json
```

---

## Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/atomys-goal-tracker.git
cd atomys-goal-tracker

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database URL and JWT secret

# 4. Initialize the database
npx prisma db push
npx prisma db seed

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use the 1-click login buttons.

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Turso/libSQL connection string |
| `JWT_SECRET` | Secret for signing auth tokens |
| `AZURE_AD_CLIENT_ID` | *(Optional)* Microsoft Entra app registration |
| `AZURE_AD_TENANT_ID` | *(Optional)* Azure AD tenant |
| `TEAMS_WEBHOOK_URL` | *(Optional)* Teams Incoming Webhook URL |

---

## License

Built for the AtomQuest Hackathon 1.0 by Atomberg Technologies.
