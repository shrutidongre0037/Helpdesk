# Security Audit Report — AI Helpdesk
**Date**: 2026-06-22  
**Auditor**: Security Review Agent (`security-review` skill)  
**Scope**: Authentication & Authorization — full codebase review  
**Files reviewed**: `backend/src/auth.ts`, `backend/src/index.ts`, `backend/src/middleware/requireAuth.ts`, `backend/.env`, `backend/.env.example`, `backend/prisma/schema.prisma`, `frontend/src/lib/auth.ts`, `frontend/src/App.tsx`, `frontend/src/pages/*.tsx`, `frontend/src/components/Navbar.tsx`

---

## Executive Summary

The codebase has a solid foundation — Better Auth is correctly wired to Prisma, sessions use HTTP-only cookies, and the frontend redirects unauthenticated users. However, there are **two critical issues** that must be fixed before this project is deployed or shared: the `.env` file containing real credentials is committed to and tracked by git, and the backend server entry point (`index.ts`) is completely empty, meaning **there is no persistent backend** — all protection disappears on restart. Additionally, RBAC is enforced only on the frontend and has no backend enforcement at all, creating a direct API bypass path for any attacker.

---

## Findings

### 🔴 CRITICAL

| # | File | Line | Issue | Impact |
|---|------|------|-------|--------|
| C1 | `backend/.env` | All | **`.env` is tracked by git** — `git ls-files backend/.env` returns a result, and the file appears in 4 commits | Real `BETTER_AUTH_SECRET`, `DATABASE_URL`, `ADMIN_PASSWORD` are exposed in repository history to anyone with read access |
| C2 | `backend/src/index.ts` | — | **Server entry point is empty (0 bytes)** — the live server is a zombie process from a previous run; on restart, the app serves nothing | All auth middleware, CORS config, and API routes disappear permanently on any restart |

---

### 🟠 HIGH

| # | File | Line | Issue | Impact |
|---|------|------|-------|--------|
| H1 | `backend/src/` | — | **No backend RBAC enforcement** — `requireAuth` exists but there is no `requireAdmin` middleware; the ADMIN check on `/users` is **frontend-only** | Any authenticated agent can directly call admin API endpoints by crafting HTTP requests, bypassing the React UI |
| H2 | `backend/src/auth.ts` | 9 | **Sign-up restriction uses `startsWith("/sign-up")` — fragile path matching** | Not the documented hook structure (should be array); fragile against path changes |
| H3 | `backend/.env.example` | 2 | **`.env.example` contains `BETTER_AUTH_SECRET="1234567"` (7 chars, far below 32-char minimum)** | Developers who copy this file verbatim run with a trivially brute-forceable secret |

---

### 🟡 MEDIUM

| # | File | Line | Issue | Impact |
|---|------|------|-------|--------|
| M1 | `backend/src/index.ts` | — | **Previous code used bare `app.use(cors())` with no options** — defaults to `origin: '*'` | Allows any website to make credentialed cross-origin requests to the API |
| M2 | `backend/src/auth.ts` | 22–29 | **`role` additionalField is typed as `"string"` with no enum validation** — a crafted sign-up (if restriction fails) could pass `role: "ADMIN"` | Privilege escalation if sign-up restriction ever fails |
| M3 | `frontend/src/pages/Users.tsx` | 18 | **`(session.user as any).role`** — role check bypasses TypeScript entirely | Type errors on role field not caught at compile time |

---

### 🔵 LOW / INFO

| # | File | Line | Issue | Impact |
|---|------|------|-------|--------|
| L1 | `backend/src/auth.ts` | — | **No rate limiting configured** — Better Auth supports it but it is not set | Brute-force password attacks against `/api/auth/sign-in` are unrestricted |
| L2 | `frontend/src/pages/Home.tsx` | 24 | **Home page is accessible without login** — no redirect for unauthenticated users, just conditionally renders content | Broken access control on the dashboard route |
| L3 | `backend/src/middleware/requireAuth.ts` | 8–9 | **`req.user` and `req.session` typed as `any`** | Loss of type safety on all downstream route handlers |

---

## Recommended Immediate Actions (Priority Order)

1. **[C1]** Remove `.env` from git tracking and rotate ALL secrets NOW
2. **[C2]** Restore `backend/src/index.ts` with proper CORS + helmet config
3. **[H1]** Add `requireAdmin` middleware; protect all admin API routes server-side
4. **[H2]** Fix sign-up hook to use array form and exact path matching
5. **[M1]** Ensure CORS is configured with an explicit `origin` when restoring index.ts
6. **[L1]** Enable `rateLimit` in `auth.ts`
7. **[L2]** Add auth redirect to `Home.tsx`

---

## Code Fixes

### Fix C1 — Remove `.env` from git tracking

```bash
# 1. Add .env to .gitignore
echo ".env" >> backend/.gitignore
# or at root level:
echo "backend/.env" >> .gitignore

# 2. Remove from git tracking (file stays on disk)
git rm --cached backend/.env
git commit -m "chore: untrack .env — contains secrets"

# 3. Rotate your secrets — they are in git history:
openssl rand -base64 32   # new BETTER_AUTH_SECRET
# Change ADMIN_PASSWORD to something strong (16+ chars, mixed case)
```

Update `backend/.env.example` to use clearly fake placeholders:
```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/helpdesk?schema=public"
BETTER_AUTH_SECRET="replace-with-output-of-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="replace-with-strong-password"
FRONTEND_URL="http://localhost:5173"
```

---

### Fix C2 + M1 — Restore `backend/src/index.ts` with security hardening

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import prisma from './db';
import { requireAuth } from './middleware/requireAuth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// CORS — explicit allowlist, not wildcard
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Payload size limit (DoS protection)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Better Auth — must come before JSON parsing for some routes
app.all('/api/auth', toNodeHandler(auth));
app.all('/api/auth/*path', toNodeHandler(auth));

// Public routes
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', engine: 'bun', db: 'connected' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Protected routes
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'Protected route OK', user: req.user });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

Install `helmet`:
```bash
cd backend && bun add helmet && bun add -d @types/helmet
```

---

### Fix H1 — Add `requireAdmin` middleware

Create `backend/src/middleware/requireAdmin.ts`:
```typescript
import type { RequestHandler } from 'express';

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  next();
};
```

Use on admin routes:
```typescript
import { requireAdmin } from './middleware/requireAdmin';

// requireAuth validates session, requireAdmin validates role
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  res.json(users);
});
```

---

### Fix H2 + L1 + M2 — Harden `backend/src/auth.ts`

```typescript
import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";

export const auth = betterAuth({
  hooks: {
    // Use array form (documented API); match exact paths
    before: [
      createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-up/email' || ctx.path === '/sign-up/social') {
          throw new APIError("FORBIDDEN", {
            message: "Registration is not open. Contact your administrator.",
          });
        }
      }),
    ],
  },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8, // stronger minimum
  },
  // Fix L1: rate limiting on auth endpoints
  rateLimit: {
    enabled: true,
    window: 60,  // seconds
    max: 10,     // requests per window per IP
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "AGENT",
      },
    },
  },
  // Fix M2: enforce role server-side on creation — never trust client input
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          return { data: { ...user, role: 'AGENT' } };
        },
      },
    },
  },
  trustedOrigins: process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : ["http://localhost:5173"],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});
```

---

### Fix L2 — Protect Home page

In `frontend/src/pages/Home.tsx`, add a redirect for unauthenticated users:
```typescript
import { Navigate } from 'react-router-dom';

export default function Home() {
  const { data: session, isPending } = useSession();

  if (isPending) { /* existing skeleton */ }

  // Add this — redirect unauthenticated users
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // ... rest of component unchanged
}
```

---

### Fix M3 — Type-safe role (eliminate `as any`)

In `frontend/src/lib/auth.ts`, infer types from the server auth instance:
```typescript
import { createAuthClient } from "better-auth/react";
// Import type from backend (works in monorepos)
import type { auth } from "../../backend/src/auth";

export const authClient = createAuthClient<typeof auth>({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
});

export const { useSession, signIn, signOut } = authClient;
```

This makes `session.user.role` properly typed throughout the frontend — no more `as any` casts needed in `Users.tsx` or `Navbar.tsx`.
