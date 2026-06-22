import { execSync } from "child_process";
import { Client } from "pg";
import path from "path";

const TEST_DB_URL =
  "postgresql://postgres:password@localhost:5434/helpdesk_test?schema=public";
const BACKEND_DIR = path.resolve(__dirname, "../backend");

/**
 * global-setup.ts — Runs ONCE before all Playwright tests.
 *
 * Steps:
 * 1. Verify the test DB container is reachable (fail fast with a clear error)
 * 2. Apply all pending Prisma migrations to the test DB
 * 3. Run seed.test.ts to ensure the test admin user exists
 */
async function globalSetup() {
  console.log("\n🔧 [global-setup] Starting E2E test environment setup...\n");

  // ── Step 1: Verify DB connectivity ──────────────────────────────────────────
  const client = new Client({ connectionString: TEST_DB_URL });

  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    console.log("✅ [global-setup] Test DB is reachable on port 5433");
  } catch (err) {
    console.error(`
❌ [global-setup] Cannot connect to the test database!

Make sure the test DB container is running:
  docker compose up postgres_test -d

Then retry: cd e2e && npx playwright test
`);
    throw err;
  }

  // ── Step 2: Apply Prisma migrations ─────────────────────────────────────────
  console.log("🔄 [global-setup] Applying Prisma migrations to test DB...");
  try {
    execSync("npx prisma migrate deploy", {
      cwd: BACKEND_DIR,
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
      },
      stdio: "inherit",
    });
    console.log("✅ [global-setup] Migrations applied successfully");
  } catch (err) {
    console.error("❌ [global-setup] Migration failed:", err);
    throw err;
  }

  // ── Step 3: Seed the test admin user ────────────────────────────────────────
  console.log("🌱 [global-setup] Seeding test database...");
  try {
    execSync("bun prisma/seed.test.ts", {
      cwd: BACKEND_DIR,
      env: {
        ...process.env,
        DATABASE_URL: TEST_DB_URL,
        ADMIN_EMAIL: "admin@test.local",
        ADMIN_PASSWORD: "Test1234!",
      },
      stdio: "inherit",
    });
    console.log("✅ [global-setup] Test DB seeded\n");
  } catch (err) {
    console.error("❌ [global-setup] Seeding failed:", err);
    throw err;
  }
}

export default globalSetup;
