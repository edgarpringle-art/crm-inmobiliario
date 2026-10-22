import { NextResponse } from "next/server";
import { getMlsZoneGroups } from "@/lib/mls/zones";

// MLS zone catalog for the CRM pickers (session required by middleware).
export async function GET() {
  try {
    return NextResponse.json(await getMlsZoneGroups());
  } catch (error) {
    console.error("Error loading MLS zones:", error);
    return NextResponse.json([]);
  }
}
