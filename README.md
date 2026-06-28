# AI-Powered Ticket Management System (MVP)

## Project Memory & AI Rules
- **Context7 Integration**: Use **Context7 MCP** to fetch up-to-date documentation whenever asking about a library, framework, SDK, API, CLI tool, or cloud service (e.g., React, Tailwind, Prisma, Bun). Always start with `resolve-library-id` and then use `query-docs` before generating code for specific libraries.

## Core Tech Stack
- **Runtime & Package Manager**: Bun
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS (v4) + Shadcn UI (Radix) + React Router
- **Data Fetching (Frontend)**: Axios + TanStack React Query
- **Backend**: Express (v5+) + TypeScript (Running on Bun). *Express 5 natively handles rejected promises, allowing for clean async route handlers without unnecessary try/catch blocks.*
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
- **UI Design System**: Shadcn UI combined with custom glassmorphism and modern styling for a premium aesthetic. Includes reusable custom components like `ErrorMessage`.
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

**E2E Testing Rule**: E2E tests should ONLY be written for functionality that absolutely cannot be tested via unit tests. This includes cross-service integrations (e.g., webhook -> backend DB -> frontend rendering pipeline) and full-stack session behaviors. If a feature can be tested via a frontend component test or a backend unit test, it must NOT be an E2E test.

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

## Component Testing (Vitest + RTL)
The frontend uses **Vitest** and **React Testing Library** for lightning-fast, jsdom-based component testing.

### Writing Component Tests
- Component test files should be placed alongside their respective components, ending in `.test.tsx` (e.g., `frontend/src/pages/Users.test.tsx`).
- Tests should mock external dependencies like `axios` and `better-auth/react` (using `vi.mock`) to test UI states in isolation.
- Wrap components requiring context in a `QueryClientProvider` and `MemoryRouter` as needed.

### Executing Component Tests
You can execute these tests directly from the root of the project:

```bash
# Run all component tests once
npm run test:component

# Run component tests in watch mode (ideal during development)
cd frontend && bun run test:component:watch
```

## How to Run Locally
Ensure you have Docker running and Bun installed.

1. **Start all containers**: `docker compose up -d`
2. **Start Backend**: `cd backend && bun run dev` → `http://localhost:3000`
3. **Start Frontend**: `cd frontend && bun run dev` → `http://localhost:5173`

## Shared Core Package
The `@helpdesk/core` package is a shared workspace module used to enforce a single source of truth for validation schemas across the frontend and backend.

### How to define and use Zod schemas:
1. **Define**: Create your Zod schema in `core/src/schemas/<your-schema>.ts`.
2. **Export**: Export it from the file and ensure it is also exported from `core/src/index.ts`.
3. **Reference (Frontend)**: 
   ```typescript
   import { mySchema } from '@helpdesk/core';
   // Use with react-hook-form
   const form = useForm({ resolver: zodResolver(mySchema) });
   ```
4. **Reference (Backend)**: 
   ```typescript
   import { mySchema } from '@helpdesk/core';
   // Use for payload validation
   const data = mySchema.parse(req.body);
   ```

### Union Types vs Enums
We prefer **Union Types** over TypeScript `enum`s for shared constants (like user roles or ticket statuses). Union types provide excellent type safety while keeping the compiled JavaScript clean, avoiding the overhead and potential edge cases of TypeScript enums. Define union types in the `@helpdesk/core` package and use string literals safely.

```typescript
import type { TicketStatus } from '@helpdesk/core';

// Correct ✅ - Enforced by union type
const currentStatus: TicketStatus = 'NEW';

// Incorrect ❌ - Using an enum object
const currentStatus = TicketStatus.NEW;
```

## 8-Phase Implementation Roadmap
1. **Project Setup**: Scaffolding, DB initialization, Prisma schema, Admin seed script. *(Completed)*
2. **Authentication**: Better Auth backend integration, Login UI with Shadcn, session management, frontend route protection. *(Completed)*
3. **User Management**: Admin CRUD for agents, role-based access. *(In Progress)*
   - Implemented RBAC enforcing `ADMIN` requirements for user management views.
   - Created the `/users` dashboard page and admin-only navigation links.
   - Migrated user creation form to use `react-hook-form` and `zod` for robust client-side validation.
   - Utilized Prisma's generated `Role` enum across backend endpoints to ensure type-safe assignment (e.g., `Role.AGENT`).
4. **Ticket CRUD**: Core ticket operations, list/detail pages with filtering.
5. **AI Features**: Gemini API integration for classification, summaries, suggested replies, knowledge base.
6. **Email Integration**: Inbound webhook (SendGrid/Mailgun) to create tickets, outbound replies, threading.
7. **Dashboard**: Stats overview, category breakdown, quick filters. *(Basic UI scaffolded)*
8. **Polish & Deployment**: Validation, error handling, Docker prep, full E2E test coverage.
