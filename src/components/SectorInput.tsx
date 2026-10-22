"use client";

import { useMemo } from "react";
import { useMlsZones } from "@/lib/useMlsZones";
import { getCorregimientos } from "@/lib/locations";

const key = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

function uniqueSorted(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((z) => z && !seen.has(key(z)) && seen.add(key(z))).sort((a, b) => a.localeCompare(b, "es"));
}

/** Corregimiento field: official corregimientos of the district plus the MLS áreas of that district. */
export function CorregimientoInput({ value, onChange, district, province, className }: {
  value: string; onChange: (v: string) => void; district: string; province: string; className?: string;
}) {
  const mls = useMlsZones();
  const options = useMemo(() => {
    const d = key(district || "");
    return uniqueSorted([
      ...getCorregimientos(district, province),
      ...mls.filter((g) => d && key(g.district || "") === d).map((g) => g.area),
    ]);
  }, [mls, district, province]);

  return (
    <>
      <input className={className} value={value} onChange={(e) => onChange(e.target.value)} list="corregimiento-options"
        placeholder={district ? "Escribe o elige el corregimiento..." : "Elige primero el distrito"} autoComplete="off" />
      <datalist id="corregimiento-options">
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}

/**
 * Barrio / urbanización field: free text with suggestions — MLS barrios of the chosen
 * corregimiento (or of the district when none is chosen) plus the known sectors of the district.
 */
export default function SectorInput({ value, onChange, district, province, corregimiento = "", baseSectors, className }: {
  value: string; onChange: (v: string) => void;
  district: string; province: string; corregimiento?: string; baseSectors: string[]; className?: string;
}) {
  const mls = useMlsZones();
  const options = useMemo(() => {
    const c = key(corregimiento), d = key(district || ""), p = key(province || "");
    const byCorr = c ? mls.filter((g) => key(g.area) === c) : [];
    const byDistrict = mls.filter((g) => d && key(g.district || "") === d);
    const scope = byCorr.length ? byCorr : byDistrict.length ? byDistrict : mls.filter((g) => p && key(g.province || "") === p);
    return uniqueSorted([...scope.flatMap((g) => g.barrios), ...(byCorr.length ? [] : baseSectors)]);
  }, [mls, district, province, corregimiento, baseSectors]);

  return (
    <>
      <input className={className} value={value} onChange={(e) => onChange(e.target.value)} list="sector-options"
        placeholder={district ? "Escribe o elige el barrio..." : "Elige primero el distrito"} autoComplete="off" />
      <datalist id="sector-options">
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}
