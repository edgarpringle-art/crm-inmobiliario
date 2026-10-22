import { NextRequest, NextResponse } from "next/server";
import { recheckMls } from "@/lib/mls/sync";

export const maxDuration = 60;

// Daily Vercel Cron (see vercel.json). Vercel sends "Authorization: Bearer ${CRON_SECRET}".
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    return NextResponse.json(await recheckMls({ budgetMs: 50_000 }));
  } catch (error) {
    console.error("MLS cron sync failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 });
  }
}
