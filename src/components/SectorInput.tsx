"use client";

import { useMemo } from "react";
import { useMlsZones } from "@/lib/useMlsZones";

const key = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

/**
 * Corregimiento / Sector field: free text with suggestions from the classic list for the district
 * plus the MLS áreas and barrios of that district (or province), so names match the MLS.
 */
export default function SectorInput({ value, onChange, district, province, baseSectors, className }: {
  value: string; onChange: (v: string) => void;
  district: string; province: string; baseSectors: string[]; className?: string;
}) {
  const mls = useMlsZones();
  const options = useMemo(() => {
    const d = key(district || ""), p = key(province || "");
    const inDistrict = mls.filter((g) => d && key(g.district || "") === d);
    const scope = inDistrict.length ? inDistrict : mls.filter((g) => p && key(g.province || "") === p);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const z of [...scope.flatMap((g) => [...g.barrios, g.area]), ...baseSectors]) {
      if (z && !seen.has(key(z))) { seen.add(key(z)); out.push(z); }
    }
    return out.sort((a, b) => a.localeCompare(b, "es"));
  }, [mls, district, province, baseSectors]);

  return (
    <>
      <input className={className} value={value} onChange={(e) => onChange(e.target.value)} list="sector-options"
        placeholder={district ? "Escribe o elige un barrio..." : "Elige primero el distrito"} autoComplete="off" />
      <datalist id="sector-options">
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}
