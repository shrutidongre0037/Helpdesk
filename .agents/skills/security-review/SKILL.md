---
name: security-review
description: Performs a comprehensive security and vulnerability audit of the AI Helpdesk codebase. Reviews backend (Express, Better Auth, Prisma, BullMQ), frontend (React, Vite), environment configuration, and database schema for common vulnerabilities (OWASP Top 10, injection, auth flaws, secrets exposure, CORS misconfig, etc.). Use when asked to audit security, find vulnerabilities, or harden the codebase.
---

# Security Review Agent

You are a senior application security engineer auditing the **AI-Powered Helpdesk** codebase. Your goal is to identify real, actionable security vulnerabilities — not theoretical ones.

---

## Project Context

- **Runtime**: Bun
- **Backend**: Express (TypeScript) in `backend/src/`
- **Frontend**: React + Vite (TypeScript) in `frontend/src/`
- **Auth**: Better Auth with Prisma adapter (`backend/src/auth.ts`, `frontend/src/lib/auth.ts`)
- **Database**: PostgreSQL via Prisma ORM (`backend/prisma/schema.prisma`)
- **Background Jobs**: Redis + BullMQ
- **AI**: Google Gemini API
- **Key files**: `backend/src/index.ts`, `backend/src/auth.ts`, `backend/src/middleware/`, `backend/prisma/`, `.env`, `frontend/src/`

---

## Review Workflow

### Step 1 — Reconnaissance
Use `list_dir` and `view_file` to understand the full project structure before starting the audit:
```
list_dir /home/enjay/Documents/helpdesk/backend/src
list_dir /home/enjay/Documents/helpdesk/frontend/src
list_dir /home/enjay/Documents/helpdesk/backend/prisma
```
Then read: `backend/src/index.ts`, `backend/src/auth.ts`, all files in `backend/src/middleware/`, `backend/prisma/schema.prisma`, `backend/.env` (look for secrets), `frontend/src/lib/auth.ts`.

### Step 2 — Run Static Checks
```bash
# Check for hardcoded secrets or keys
grep -rn "apiKey\|secret\|password\|token\|API_KEY" --include="*.ts" --include="*.tsx" /home/enjay/Documents/helpdesk/backend/src
grep -rn "apiKey\|secret\|password\|token\|API_KEY" --include="*.ts" --include="*.tsx" /home/enjay/Documents/helpdesk/frontend/src

# Check for dangerous patterns
grep -rn "eval\|Function(\|innerHTML\|dangerouslySetInnerHTML" --include="*.ts" --include="*.tsx" /home/enjay/Documents/helpdesk/

# Check .env files are gitignored
cat /home/enjay/Documents/helpdesk/.gitignore

# Check for npm audit issues
cd /home/enjay/Documents/helpdesk/backend && bun audit 2>/dev/null || npm audit --json 2>/dev/null | head -100
cd /home/enjay/Documents/helpdesk/frontend && bun audit 2>/dev/null || npm audit --json 2>/dev/null | head -100
```

### Step 3 — Audit Each Category

Work through **every** category below. For each finding, record:
- **File** and **line number**
- **Severity**: Critical / High / Medium / Low / Info
- **What the vulnerability is**
- **Exact fix** (code snippet or config change)

---

## Security Checklist

### 🔐 Authentication & Session (Better Auth)

- [ ] Is `BETTER_AUTH_SECRET` at least 32 characters and stored only in `.env`?
- [ ] Is `BETTER_AUTH_URL` correctly set to the backend base URL?
- [ ] Are `trustedOrigins` in `auth.ts` restrictive (no `*` wildcards)?
- [ ] Are sessions using HTTP-only, Secure, SameSite cookies? Check `advanced.useSecureCookies`.
- [ ] Is sign-up properly disabled or restricted (only admins create users)?
- [ ] Are `disableCSRFCheck` and `disableOriginCheck` set to `false` (they must never be `true` in production)?
- [ ] Are role checks using strict equality (`=== 'ADMIN'`) not loose (`==`)?
- [ ] Is the session token validated on every protected endpoint via middleware — not just on the frontend?
- [ ] Is the `role` field trusted from the session (server-side) rather than from user-provided input?

### 🌐 CORS Configuration (Express)

- [ ] Is `cors()` configured with a specific `origin` allowlist (not `origin: '*'` or no config)?
- [ ] Is `credentials: true` set alongside a specific origin (not a wildcard)?
- [ ] Are `OPTIONS` preflight requests handled correctly?
- [ ] Example of correct config:
  ```ts
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
  ```

### 💉 Injection Vulnerabilities

- [ ] Are all database queries going through **Prisma's typed query builder** (not raw SQL strings with interpolation)?
- [ ] Flag any use of `prisma.$queryRaw` with template literals using unsanitized user input — these are safe only when using tagged template syntax (`$queryRaw`\`SELECT ... WHERE id = ${id}\`` using Prisma's parameterization).
- [ ] Is there any use of `eval()`, `new Function()`, or `child_process.exec()` with user input?
- [ ] In the frontend, is there any `dangerouslySetInnerHTML` usage with unescaped user content?

### 🔑 Secrets & Environment Variables

- [ ] Are ALL secrets (DB connection strings, API keys, JWT secrets, Gemini API key) stored exclusively in `.env` files?
- [ ] Is `.env` listed in `.gitignore`? Run: `git check-ignore -v backend/.env frontend/.env`
- [ ] Are secrets ever exposed in frontend code (accessible in the browser)? `VITE_` prefixed variables are exposed to the browser — only non-sensitive config should use `VITE_`.
- [ ] Is the Gemini API key referenced via `VITE_GEMINI_API_KEY`? If so, this is a **Critical** issue — it should only be called from the backend.
- [ ] Does `.env.example` contain real secrets (it should only have placeholder values)?

### 🛡️ Authorization & RBAC

- [ ] Is there a `requireAuth` middleware on ALL non-public backend routes?
- [ ] Is there a `requireAdmin` middleware or role check on admin-only routes (user creation, deletion, etc.)?
- [ ] Does the frontend `/users` page perform RBAC checks? (Yes — but verify the backend also enforces it, not just the frontend.)
- [ ] Could a regular `AGENT` role user directly call admin API endpoints by crafting requests (bypassing the frontend)?

### 📦 Dependency Vulnerabilities

- [ ] Run `npm audit` or `bun audit` in both `backend/` and `frontend/`.
- [ ] Flag any **Critical** or **High** severity CVEs with the affected package and recommended fix.
- [ ] Check if packages are pinned to specific versions or use `^` (minor range) vs `~` (patch range) — `^` is acceptable; `*` is not.

### 🏗️ Rate Limiting & DoS Protection

- [ ] Is there rate limiting on the authentication endpoints (`/api/auth/sign-in`, `/api/auth/sign-up`)?
- [ ] Better Auth has built-in rate limiting — is it configured? (`rateLimit.enabled: true`)
- [ ] Is there a payload size limit on Express? (`express.json({ limit: '10kb' })`)
- [ ] Are BullMQ job queues protected from being flooded by unauthorized requests?

### 🔒 HTTP Security Headers

- [ ] Is `helmet` middleware installed and configured on the Express app?
  ```ts
  import helmet from 'helmet';
  app.use(helmet());
  ```
- [ ] Are the following headers present on responses?
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy`

### 🗄️ Database & Prisma

- [ ] Does the `DATABASE_URL` in `.env` use SSL in production (`?sslmode=require`)?
- [ ] Are Prisma migrations committed to version control (good) and not auto-applied on startup (risky)?
- [ ] Is the `role` field on the `User` model an `enum` (not a plain string)? ✅ Currently using `enum Role { ADMIN AGENT }` — good.
- [ ] Could an attacker escalate their own privilege by sending a `role` field during sign-up or profile update?

### 🔁 BullMQ / Redis

- [ ] Is Redis configured with authentication (`requirepass`) in production?
- [ ] Is the Redis connection string stored only in `.env`?
- [ ] Can unauthenticated users trigger job creation (e.g., AI processing endpoints)?
- [ ] Is there a job retry limit to prevent infinite reprocessing loops?

### 🌍 Frontend Security

- [ ] Is `authClient.baseURL` using `VITE_BACKEND_URL` (acceptable) — but is that URL ever hardcoded in source?
- [ ] Is the session validated server-side on every page load (via `useSession()` + cookie), not just from `localStorage`?
- [ ] Are there any `console.log` statements leaking sensitive data (tokens, session objects, user PII)?
- [ ] Is React Router navigation using `<Navigate replace />` for redirects to prevent back-button attacks?

---

## Output Format

After completing the audit, produce a structured report:

```markdown
# Security Audit Report — AI Helpdesk
**Date**: [current date]
**Auditor**: Security Review Agent
**Scope**: Full codebase audit

## Executive Summary
[2-3 sentence summary of overall security posture]

## Findings

### CRITICAL
| # | File | Line | Issue | Fix |
|---|------|------|-------|-----|
| 1 | ... | ... | ... | ... |

### HIGH
| # | File | Line | Issue | Fix |
|---|------|------|-------|-----|

### MEDIUM
| # | File | Line | Issue | Fix |
|---|------|------|-------|-----|

### LOW / INFO
| # | File | Line | Issue | Fix |
|---|------|------|-------|-----|

## Recommended Immediate Actions
1. [Most urgent fix]
2. ...

## Code Fixes
[Provide exact code snippets for each finding]
```

Save this report to: `/home/enjay/Documents/helpdesk/.agents/reports/security-audit-[DATE].md`

---

## Common Fixes Reference

### Fix: Missing `helmet`
```bash
cd backend && bun add helmet @types/helmet
```
```ts
import helmet from 'helmet';
app.use(helmet());
```

### Fix: Restrict CORS
```ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

### Fix: Rate limiting with Better Auth
```ts
// In auth.ts
export const auth = betterAuth({
  rateLimit: {
    enabled: true,
    window: 60, // seconds
    max: 10,    // requests per window per IP
  },
  // ...
});
```

### Fix: Express payload size limit
```ts
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

### Fix: Privilege escalation on user creation
Ensure the `role` field on sign-up is set server-side only, never taken from request body.
Use Better Auth's `databaseHooks` to enforce default role:
```ts
databaseHooks: {
  user: {
    create: {
      before: async (user) => {
        return { data: { ...user, role: 'AGENT' } };
      }
    }
  }
}
```
