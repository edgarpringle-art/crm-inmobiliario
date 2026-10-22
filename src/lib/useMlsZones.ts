"use client";

import { useEffect, useState } from "react";
import type { MlsZoneGroup } from "@/lib/mls/zones";

let cache: Promise<MlsZoneGroup[]> | null = null;

/** MLS zone catalog (áreas → barrios), fetched once per page load. */
export function useMlsZones(): MlsZoneGroup[] {
  const [zones, setZones] = useState<MlsZoneGroup[]>([]);
  useEffect(() => {
    cache ??= fetch("/api/zonas").then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);
    let alive = true;
    cache.then((z) => { if (alive) setZones(z); });
    return () => { alive = false; };
  }, []);
  return zones;
}
