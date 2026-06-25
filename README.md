# AI-Powered Ticket Management System (MVP)

## Project Memory & AI Rules
- **Context7 Integration**: Use **Context7 MCP** to fetch up-to-date documentation whenever asking about a library, framework, SDK, API, CLI tool, or cloud service (e.g., React, Tailwind, Prisma, Bun). Always start with `resolve-library-id` and then use `query-docs` before generating code for specific libraries.

## Core Tech Stack
- **Runtime & Package Manager**: Bun
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS (v4) + Shadcn UI (Radix) + React Router
- **Data Fetching (Frontend)**: Axios + TanStack React Query
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
- **Data Fetching**: The frontend uses `axios` for HTTP requests (configured with `withCredentials: true` for auth cookies) and `@tanstack/react-query` for query caching, state management, and loading states.
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

### Writing Tests with the AI Agent

This project has a dedicated **`playwright-e2e` agent skill** (`.agents/skills/playwright-e2e/SKILL.md`) that knows the full test setup — ports, selectors, seeded credentials, DB lifecycle, and idiomatic patterns.

**To generate or add a test, just ask the AI:**
> *"write e2e tests for the login page"*
> *"add a Playwright test for the /users admin redirect"*
> *"write tests covering logout behaviour"*

The agent will automatically:
- Place test files in `e2e/tests/*.spec.ts`
- Use the correct `baseURL`-relative paths and seeded credentials
- Follow the project's test conventions (no `waitForTimeout`, proper `describe` blocks, etc.)

> Full skill reference: `.agents/skills/playwright-e2e/SKILL.md`

### Quick Start

```bash
# 1. Start the test DB container
docker compose up postgres_test -d

# 2. Run all tests
cd e2e && npm test

# 3. Interactive UI mode
cd e2e && npm run test:ui
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
