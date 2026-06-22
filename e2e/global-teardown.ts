import { Client } from "pg";

const TEST_DB_URL =
  "postgresql://postgres:password@localhost:5434/helpdesk_test?schema=public";

/**
 * global-teardown.ts — Runs ONCE after all Playwright tests complete.
 *
 * Truncates all data tables so the DB is clean for the next test run.
 * The schema (tables, indexes, etc.) is preserved — only data is cleared.
 * This is faster than a full reset and avoids needing to re-migrate.
 */
async function globalTeardown() {
  console.log("\n🧹 [global-teardown] Cleaning up test database...\n");

  const client = new Client({ connectionString: TEST_DB_URL });

  try {
    await client.connect();

    // Truncate in correct order to respect foreign key constraints
    await client.query(`
      TRUNCATE TABLE
        "verification",
        "session",
        "account",
        "user"
      RESTART IDENTITY CASCADE;
    `);

    console.log("✅ [global-teardown] Test DB tables truncated\n");
  } catch (err) {
    // Teardown errors are non-fatal — log but don't fail the test run
    console.warn("⚠️  [global-teardown] Cleanup encountered an error:", err);
  } finally {
    await client.end();
  }
}

export default globalTeardown;
