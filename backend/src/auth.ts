import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";

export const auth = betterAuth({
  hooks: {
    // Exact path match to prevent sign-up; startsWith is too broad
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-up/email' || ctx.path === '/sign-up/social') {
        throw new APIError("FORBIDDEN", {
          message: "Registration is not open. Contact your administrator.",
        });
      }
    }),
  },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8, // stronger minimum
  },
  // Rate limiting: enabled only in production to avoid blocking dev/test workflows
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 60,  // seconds
    max: 100,    // generous limit
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
    : ["http://localhost:5173", "http://localhost:5174"],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});
