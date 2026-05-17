# ATOMYS — Architecture Diagram

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                           │
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│   │  Login Page   │  │  App Shell   │  │   Command Palette (⌘K)  │  │
│   │  SSO / Demo   │  │  (Sidebar +  │  │   Notification Center   │  │
│   │  Credentials  │  │   Router)    │  │   Toast System          │  │
│   └──────┬───────┘  └──────┬───────┘  └──────────────────────────┘  │
│          │                 │                                         │
│   ┌──────┴─────────────────┴──────────────────────────────────┐     │
│   │                    Page Components                         │     │
│   │                                                            │     │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │     │
│   │  │ Dashboard  │ │ GoalCreate │ │ GoalView   │            │     │
│   │  │ (KPIs,     │ │ (+ AI      │ │ (Locked    │            │     │
│   │  │  Stats)    │ │  Copilot)  │ │  Sheet)    │            │     │
│   │  └────────────┘ └────────────┘ └────────────┘            │     │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │     │
│   │  │ TeamReview │ │ Quarterly  │ │ SharedGoals│            │     │
│   │  │ (Approve/  │ │ Update     │ │ (Dept KPIs)│            │     │
│   │  │  Return)   │ │ (Q1-Q4)    │ │            │            │     │
│   │  └────────────┘ └────────────┘ └────────────┘            │     │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐            │     │
│   │  │ AdminPanel │ │ Analytics  │ │ Escalation │            │     │
│   │  │ (Cycles,   │ │ (Recharts) │ │ (Rules +   │            │     │
│   │  │  Users)    │ │            │ │  Engine)   │            │     │
│   │  └────────────┘ └────────────┘ └────────────┘            │     │
│   │  ┌────────────┐ ┌────────────┐                            │     │
│   │  │ Reports    │ │ AuditLogs  │                            │     │
│   │  │ (CSV       │ │ (Full      │                            │     │
│   │  │  Export)   │ │  History)  │                            │     │
│   │  └────────────┘ └────────────┘                            │     │
│   └───────────────────────┬───────────────────────────────────┘     │
└───────────────────────────┼──────────────────────────────────────────┘
                            │ HTTPS (JWT Cookie)
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS API ROUTES (Serverless)                  │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐     │
│   │                     Auth Middleware                         │     │
│   │         JWT Verification · Role-Based Access Control       │     │
│   └────────────────────────────┬───────────────────────────────┘     │
│                                │                                     │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│   │/api/auth │ │/api/goals│ │/api/admin│ │/api/      │             │
│   │ login    │ │ CRUD     │ │ cycles   │ │ analytics │             │
│   │ logout   │ │ submit   │ │ users    │ │ charts    │             │
│   │ session  │ │ approve  │ │ audit    │ │ heatmaps  │             │
│   │ sso-     │ │ quarterly│ │ unlock   │ │ trends    │             │
│   │ status   │ │ checkin  │ │          │ │           │             │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│   │/api/     │ │/api/     │ │/api/     │ │/api/     │             │
│   │reports   │ │shared-   │ │escalation│ │notifica- │             │
│   │dashboard │ │goals     │ │rules     │ │tions     │             │
│   │achievemnt│ │push/sync │ │engine    │ │teams     │             │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│                                │                                     │
│                     ┌──────────┴──────────┐                         │
│                     │    Prisma ORM       │                         │
│                     │  (Query Builder)    │                         │
│                     └──────────┬──────────┘                         │
└────────────────────────────────┼─────────────────────────────────────┘
                                 │ libSQL Wire Protocol
                                 ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     TURSO (libSQL Database)                          │
│                                                                      │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│   │   User     │ │ GoalSheet  │ │   Goal     │ │ Quarterly  │     │
│   │ Department │ │  (DRAFT →  │ │ (UoM,      │ │ Update     │     │
│   │ ThrustArea │ │  SUBMITTED │ │  Target,   │ │ (Score     │     │
│   │            │ │  → APPROVED│ │  Weightage)│ │  Compute)  │     │
│   └────────────┘ └────────────┘ └────────────┘ └────────────┘     │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│   │ SharedGoal │ │ AuditLog   │ │ Escalation │ │ Checkin    │     │
│   │ (Dept KPI  │ │ (Change    │ │ Rule       │ │ Comment    │     │
│   │  Sync)     │ │  Tracking) │ │ (3-Level)  │ │            │     │
│   └────────────┘ └────────────┘ └────────────┘ └────────────┘     │
│   ┌────────────┐ ┌────────────┐                                     │
│   │   Cycle    │ │Notification│   13 Models · 210 lines schema     │
│   │ (Calendar  │ │ (Email /   │                                     │
│   │  Windows)  │ │  Teams)    │                                     │
│   └────────────┘ └────────────┘                                     │
└──────────────────────────────────────────────────────────────────────┘


                    EXTERNAL INTEGRATIONS (Optional)
                    ────────────────────────────────

    ┌──────────────────┐              ┌──────────────────┐
    │  Microsoft       │              │  Microsoft       │
    │  Entra ID        │              │  Teams           │
    │  (Azure AD)      │              │  (Webhooks)      │
    │                  │              │                  │
    │  • SSO Login     │              │  • Adaptive Cards│
    │  • Org Hierarchy │              │  • Goal Events   │
    │  • Group → Role  │              │  • Deep Links    │
    │    Mapping        │              │                  │
    └──────────────────┘              └──────────────────┘


## Data Flow — Goal Lifecycle

    Employee                Manager                   System
       │                       │                         │
       ├── Create Goals ──────►│                         │
       ├── Submit Sheet ──────►│                         │
       │                       ├── Review (Inline Edit)  │
       │                       ├── Approve ─────────────►│── Lock Sheet
       │                       │   OR                    │── Audit Log
       │◄── Return + Note ────┤                         │── Teams Notify
       │                       │                         │
       ├── Q1 Check-in ──────►│                         │── Score Compute
       │                       ├── Check-in Comment ────►│── Shared Sync
       ├── Q2 Check-in ──────►│                         │
       ├── Q3 Check-in ──────►│                         │
       ├── Q4 Check-in ──────►│                         │── CSV Export
       │                       │                         │


## Hosting & Cost Optimisation

| Component          | Service           | Cost    |
|-------------------|-------------------|---------|
| Frontend + API    | Vercel (Hobby)    | Free    |
| Database          | Turso (Starter)   | Free    |
| Auth (SSO)        | Azure AD (F1)     | Free    |
| Teams Webhooks    | Microsoft 365     | Free    |
| **Total Monthly** |                   | **₹0**  |

> Zero-cost architecture using serverless edge functions and embedded database.
> No cold-start penalty — Next.js API routes execute in < 100ms.
