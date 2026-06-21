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

## Architecture Overview
- **Structure**: Monorepo with `frontend/` and `backend/` directories.
- **Authentication**: Database-backed session authentication using Better Auth with HTTP-only cookies and cross-origin CORS support.
- **Environment**: Docker containerization used for local dependencies (PostgreSQL + Redis).
- **UI Design System**: Shadcn UI combined with custom glassmorphism and modern styling for a premium aesthetic.

## Authentication Details
The system utilizes **Better Auth** to provide a secure and modern authentication flow:
- **Backend Core**: Configured with the Better Auth Prisma adapter (`backend/src/auth.ts`) to securely store users and sessions in PostgreSQL.
- **Frontend Client**: Utilizes the Better Auth React client (`frontend/src/lib/auth.ts`) for seamless hook-based state management (e.g., `useSession`, `signIn`, `signOut`).
- **Security**: Uses HTTP-only cookies to persist sessions. Cross-Origin Resource Sharing (CORS) is strictly configured on the Express server (`credentials: true`) to allow the Vite frontend to securely exchange session cookies.
- **Protected Routes**: Frontend routing enforces authentication checks (redirecting to `/login` if unauthenticated), leveraging Shadcn UI components for sleek loading states (`<Skeleton>`) and error handling. Specific routes like `/users` implement Role-Based Access Control (RBAC) restricted to `ADMIN` users.

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
8. **Polish & Deployment**: Validation, error handling, Docker prep.

## How to Run Locally
Ensure you have Docker running and Bun installed.

1. **Start Databases**: `docker compose up -d`
2. **Start Backend**: `cd backend && bun run dev` (Available on `http://localhost:3000`)
3. **Start Frontend**: `cd frontend && bun run dev` (Available on `http://localhost:5173`)

