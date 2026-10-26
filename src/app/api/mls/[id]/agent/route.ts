import { NextRequest, NextResponse } from "next/server";
import { getDb, query } from "@/lib/db";
import { ensureMlsTable } from "@/lib/mls/sync";
import { fetchXposure } from "@/lib/mls/xposure";

// Listing agent of an MLS listing, read on demand from its public Xposure page and saved
// (session required by middleware; internal use only, never shown on the public site).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await ensureMlsTable();
    const [row] = await query<{ url: string; code: string }>("SELECT url, code FROM MlsListing WHERE id = ?", [id]);
    if (!row) return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    const rec = await fetchXposure(row.url, row.code);
    if (!rec) return NextResponse.json({ error: "La propiedad ya no está en el MLS" }, { status: 404 });
    await getDb().execute({
      sql: "UPDATE MlsListing SET listingAgent = ?, listingAgentPhone = ?, listingOffice = ? WHERE id = ?",
      args: [rec.listingAgent, rec.listingAgentPhone, rec.listingOffice, id],
    });
    return NextResponse.json({ listingAgent: rec.listingAgent, listingAgentPhone: rec.listingAgentPhone, listingOffice: rec.listingOffice });
  } catch (error) {
    console.error("MLS agent lookup failed:", error);
    return NextResponse.json({ error: "No se pudo consultar el MLS" }, { status: 502 });
  }
}
