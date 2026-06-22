# AI-Powered Ticket Management System (MVP)

## Project Memory & AI Rules
- **Context7 Integration**: Use **Context7 MCP** to fetch up-to-date documentation whenever asking about a library, framework, SDK, API, CLI tool, or cloud service (e.g., React, Tailwind, Prisma, Bun). Always start with `resolve-library-id` and then use `query-docs` before generating code for specific libraries.

## Core Tech Stack
- **Runtime & Package Manager**: Bun
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS (v4) + Shadcn UI (Radix) + React Router
- **Backend**: Express + TypeScript (Running on Bun)
- **Database**: PostgreSQL (with `pgvector` for AI embeddings)
- **ORM**: Prisma
- **Auth**: Better Auth
- **Background Queue**: Redis + BullMQ
- **AI Intelligence**: Google Gemini API
- **E2E Testing**: Playwright (isolated test DB)

## Architecture Overview
- **Structure**: Monorepo with `frontend/`, `backend/`, and `e2e/` directories.
- **Authentication**: Database-backed session authentication using Better Auth with HTTP-only cookies and cross-origin CORS support.
- **Environment**: Docker containerization used for local dependencies (PostgreSQL dev + PostgreSQL test + Redis).
- **UI Design System**: Shadcn UI combined with custom glassmorphism and modern styling for a premium aesthetic.
- **Security**: Rate limiting enabled in production only (global + auth-specific limits via `express-rate-limit`).

## Authentication Details
The system utilizes **Better Auth** to provide a secure and modern authentication flow:
- **Backend Core**: Configured with the Better Auth Prisma adapter (`backend/src/auth.ts`) to securely store users and sessions in PostgreSQL.
- **Frontend Client**: Utilizes the Better Auth React client (`frontend/src/lib/auth.ts`) for seamless hook-based state management (e.g., `useSession`, `signIn`, `signOut`).
- **Security**: Uses HTTP-only cookies to persist sessions. Cross-Origin Resource Sharing (CORS) is strictly configured on the Express server (`credentials: true`) to allow the Vite frontend to securely exchange session cookies.
- **Protected Routes**: Frontend routing enforces authentication checks (redirecting to `/login` if unauthenticated), leveraging Shadcn UI components for sleek loading states (`<Skeleton>`) and error handling. Specific routes like `/users` implement Role-Based Access Control (RBAC) restricted to `ADMIN` users.

## Security Hardening
- **Rate Limiting** (`express-rate-limit`): Applied only when `NODE_ENV=production`. Two tiers:
  - Global: 100 requests / 15 min per IP (all routes)
  - Auth: 10 requests / 15 min per IP (`/api/auth/*` — brute-force protection)
- **Helmet**: Security headers on all responses.
- **Payload limit**: `10kb` max request body (DoS protection).
- **CORS**: Strict allowlist — only `FRONTEND_URL` env var is permitted.

## E2E Testing (Playwright)
Playwright is configured in the standalone `e2e/` directory with a fully isolated test database.

### Test Infrastructure
| Component | Dev | Test |
|---|---|---|
| **Backend port** | `3000` | `3001` |
| **Frontend port** | `5173` | `5174` |
| **DB container** | `helpdesk_postgres` | `helpdesk_postgres_test` |
| **DB port** | `5432` | `5434` |
| **DB name** | `helpdesk` | `helpdesk_test` |

### Key Files
| File | Purpose |
|---|---|
| `e2e/playwright.config.ts` | Main config — webServer, globalSetup/Teardown, Chromium project |
| `e2e/global-setup.ts` | Runs before all tests: verifies DB → applies migrations → seeds test user |
| `e2e/global-teardown.ts` | Runs after all tests: truncates all tables (preserves schema) |
| `backend/.env.test` | Test-specific env vars — points to `helpdesk_test` DB on port `5434` |
| `backend/prisma/seed.test.ts` | Idempotent seed: inserts `admin@test.local` (ADMIN role) directly via Prisma |
| `backend/package.json` | Adds `db:test:migrate`, `db:test:seed`, `db:test:reset` scripts |

### Test Credentials
- **Email**: `admin@test.local`
- **Password**: `Test1234!`

### Running E2E Tests
```bash
# 1. Ensure test DB container is running
docker compose up postgres_test -d

# 2. Run all tests (headless)
cd e2e && npm test

# 3. Run in UI mode (interactive)
cd e2e && npm run test:ui

# 4. Run headed (see browser)
cd e2e && npm run test:headed
```

### Resetting the Test DB manually
```bash
cd backend
npm run db:test:migrate   # Apply pending migrations
npm run db:test:seed      # Re-seed test admin user
npm run db:test:reset     # Full reset (drop + re-migrate + seed)
```

## How to Run Locally
Ensure you have Docker running and Bun installed.

1. **Start all containers**: `docker compose up -d`
2. **Start Backend**: `cd backend && bun run dev` → `http://localhost:3000`
3. **Start Frontend**: `cd frontend && bun run dev` → `http://localhost:5173`

## 8-Phase Implementation Roadmap
1. **Project Setup**: Scaffolding, DB initialization, Prisma schema, Admin seed script. *(Completed)*
2. **Authentication**: Better Auth backend integration, Login UI with Shadcn, session management, frontend route protection. *(Completed)*
3. **User Management**: Admin CRUD for agents, role-based access. *(In Progress)*
   - Implemented RBAC enforcing `ADMIN` requirements for user management views.
   - Created the `/users` dashboard page and admin-only navigation links.
4. **Ticket CRUD**: Core ticket operations, list/detail pages with filtering.
5. **AI Features**: Gemini API integration for classification, summaries, suggested replies, knowledge base.
6. **Email Integration**: Inbound webhook (SendGrid/Mailgun) to create tickets, outbound replies, threading.
7. **Dashboard**: Stats overview, category breakdown, quick filters. *(Basic UI scaffolded)*
8. **Polish & Deployment**: Validation, error handling, Docker prep, full E2E test coverage.
