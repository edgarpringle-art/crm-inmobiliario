import { NextResponse } from "next/server";
import { recheckMls } from "@/lib/mls/sync";

export const maxDuration = 60;

// Manual re-check of published MLS listings (session required by middleware).
export async function POST() {
  try {
    return NextResponse.json(await recheckMls({ budgetMs: 45_000 }));
  } catch (error) {
    console.error("MLS sync failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error al sincronizar" }, { status: 500 });
  }
}
