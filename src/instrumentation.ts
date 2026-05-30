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

    // Busqueda — extra range columns mirroring Client (filled by syncBusqueda)
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN habitacionesMax INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN banosMin INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN banosMax INTEGER");

    // Busqueda — amenity + extra criteria columns mirrored from Client by syncBusqueda
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN currency TEXT");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN telefono2 TEXT");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN amoblado TEXT");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasPool INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasGym INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasElevator INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasSecurity INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasGenerator INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasFurniture INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasAppliances INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasAC INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasBalcony INTEGER");
    await safeAlter("ALTER TABLE Busqueda ADD COLUMN hasGarden INTEGER");

    // Client — richer search criteria so the form replaces the old /busquedas page
    await safeAlter("ALTER TABLE Client ADD COLUMN searchZones TEXT");
    await safeAlter("ALTER TABLE Client ADD COLUMN currency TEXT");
    await safeAlter("ALTER TABLE Client ADD COLUMN bedroomsMax INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN bathroomsMax INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN amoblado TEXT");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasPool INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasGym INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasElevator INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasSecurity INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasGenerator INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasFurniture INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasAppliances INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasAC INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasBalcony INTEGER");
    await safeAlter("ALTER TABLE Client ADD COLUMN hasGarden INTEGER");

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
