import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";

export const auth = betterAuth({
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path.startsWith("/sign-up")) {
                throw new APIError("BAD_REQUEST", {
                    message: "Sign-up is disabled",
                });
            }
        }),
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "sqlite"
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "AGENT"
            }
        }
    }
});
