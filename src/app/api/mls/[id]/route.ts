import { NextRequest, NextResponse } from "next/server";
import { removeMlsListing } from "@/lib/mls/sync";

// Removes an imported MLS listing from the web (session required by middleware).
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await removeMlsListing(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MLS delete failed:", error);
    return NextResponse.json({ error: "No se pudo quitar" }, { status: 500 });
  }
}
