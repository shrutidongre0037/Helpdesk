/**
 * seed.test.ts — Minimal test DB seed
 *
 * Directly inserts a known admin user via Prisma (no backend server required).
 *
 * IMPORTANT: Password MUST be hashed with Better Auth's own hashPassword utility
 * (scrypt-based, format: "salt:hex") — NOT bcrypt. Using bcrypt produces a hash
 * that Better Auth's verifyPassword cannot parse, causing "Invalid password hash".
 *
 * Run via: bun prisma/seed.test.ts (with DATABASE_URL pointing to helpdesk_test)
 */

import { PrismaClient } from "../src/generated/prisma";
import { hashPassword } from "@better-auth/utils/password";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const TEST_ADMIN = {
  email: process.env.ADMIN_EMAIL || "admin@test.local",
  password: process.env.ADMIN_PASSWORD || "Test1234!",
  name: "Test Admin",
};

async function main() {
  console.log("🌱 Seeding test database...");

  // Check if test user already exists — idempotent
  const existing = await prisma.user.findUnique({
    where: { email: TEST_ADMIN.email },
  });

  if (existing) {
    console.log(`✅ Test user already exists: ${TEST_ADMIN.email}`);
    return;
  }

  const userId = randomUUID();
  const accountId = randomUUID();
  // Use Better Auth's scrypt hasher — produces "salt:hex" format that verifyPassword expects
  const hashedPassword = await hashPassword(TEST_ADMIN.password);
  const now = new Date();

  // Insert User row
  await prisma.user.create({
    data: {
      id: userId,
      name: TEST_ADMIN.name,
      email: TEST_ADMIN.email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: "ADMIN",
    },
  });

  // Insert Account row (credential provider — Better Auth expects this)
  await prisma.account.create({
    data: {
      id: accountId,
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`✅ Created test admin: ${TEST_ADMIN.email}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
