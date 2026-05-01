/**
 * Next.js Instrumentation Hook — runs once on server startup.
 * Used to apply idempotent DB column migrations.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getDb } = await import("@/lib/db");
    const db = getDb();

    // Run each ALTER TABLE inside a try/catch so "duplicate column" errors are silent
    const safeAlter = async (sql: string) => {
      try {
        await db.execute({ sql, args: [] });
      } catch {
        // Column already exists — ignore
      }
    };

    // Property
    await safeAlter("ALTER TABLE Property ADD COLUMN photos TEXT");

    // Deal split columns (added in multi-agent phase)
    await safeAlter("ALTER TABLE Deal ADD COLUMN companyShare REAL");
    await safeAlter("ALTER TABLE Deal ADD COLUMN internalAgentId TEXT");
    await safeAlter("ALTER TABLE Deal ADD COLUMN internalAgentShare REAL");
    await safeAlter("ALTER TABLE Deal ADD COLUMN externalAgentName TEXT");
    await safeAlter("ALTER TABLE Deal ADD COLUMN externalAgentPhone TEXT");
    await safeAlter("ALTER TABLE Deal ADD COLUMN externalAgentShare REAL");

    // Agent table (added in multi-agent phase)
    await safeAlter("ALTER TABLE Deal ADD COLUMN commissionDate TEXT");

    // Ingreso table — for non-commission income (contracts, consulting, etc.)
    await db.execute({
      sql: `CREATE TABLE IF NOT EXISTS Ingreso (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        category TEXT,
        clientName TEXT,
        assignedAgent TEXT,
        date TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
      args: [],
    });
  }
}
