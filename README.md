# AI-Powered Ticket Management System (MVP)

## Project Memory & AI Rules
- **Context7 Integration**: Use **Context7 MCP** to fetch up-to-date documentation whenever asking about a library, framework, SDK, API, CLI tool, or cloud service (e.g., React, Tailwind, Prisma, Bun). Always start with `resolve-library-id` and then use `query-docs` before generating code for specific libraries.

## Core Tech Stack
- **Runtime & Package Manager**: Bun
- **Frontend**: React (Vite) + TypeScript + Tailwind CSS (v4) + React Router
- **Backend**: Express + TypeScript (Running on Bun)
- **Database**: PostgreSQL (with `pgvector` for AI embeddings)
- **ORM**: Prisma
- **Background Queue**: Redis + BullMQ
- **AI Intelligence**: Google Gemini API

## Architecture Overview
- **Structure**: Monorepo with `frontend/` and `backend/` directories.
- **Authentication**: Database-backed session authentication using HTTP-only cookies.
- **Environment**: Docker containerization used for local dependencies (PostgreSQL + Redis).

## 8-Phase Implementation Roadmap
1. **Project Setup**: Scaffolding, DB initialization, Prisma schema, Admin seed script. *(Completed)*
2. **Authentication**: Login UI, session management, route protection. *(Pending)*
3. **User Management**: Admin CRUD for agents, role-based access.
4. **Ticket CRUD**: Core ticket operations, list/detail pages with filtering.
5. **AI Features**: Gemini API integration for classification, summaries, suggested replies, knowledge base.
6. **Email Integration**: Inbound webhook (SendGrid/Mailgun) to create tickets, outbound replies, threading.
7. **Dashboard**: Stats overview, category breakdown, quick filters.
8. **Polish & Deployment**: Validation, error handling, Docker prep.

## How to Run Locally
Ensure you have Docker running and Bun installed.

1. **Start Databases**: `docker compose up -d`
2. **Start Backend**: `cd backend && bun run dev` (Available on `http://localhost:3000`)
3. **Start Frontend**: `cd frontend && bun run dev` (Available on `http://localhost:5173`)
