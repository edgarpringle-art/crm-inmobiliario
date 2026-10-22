import { NextRequest, NextResponse } from "next/server";
import { pruneMls } from "@/lib/mls/sync";

// Hides published MLS listings missing from a full-inventory search file (session required by middleware).
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const codes: string[] = Array.isArray(body.codes) ? body.codes.filter((c: unknown) => typeof c === "string" && /^[a-z0-9]+$/i.test(c)) : [];
  // Guard against wiping the inventory with an empty or tiny (filtered) search.
  if (codes.length < 200) return NextResponse.json({ error: "El archivo tiene muy pocas propiedades para usarlo como inventario completo" }, { status: 400 });
  try {
    return NextResponse.json({ hidden: await pruneMls(codes) });
  } catch (error) {
    console.error("MLS prune failed:", error);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }
}
