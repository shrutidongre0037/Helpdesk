import { createAuthClient } from "better-auth/react";
// Import type from backend (works in monorepos)
import type { auth } from "../../backend/src/auth";

export const authClient = createAuthClient<typeof auth>({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:3000",
});

export const { useSession, signIn, signOut } = authClient;
