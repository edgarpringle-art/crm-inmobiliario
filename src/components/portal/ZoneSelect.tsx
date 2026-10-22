"use client";

import type { ZoneGroup } from "./brand";

// Zone picker grouped like the MLS: each Área with "Todo <Área>" plus its barrios, with counts.
export default function ZoneSelect({ groups, value, onChange, className }: {
  groups: ZoneGroup[]; value: string; onChange: (v: string) => void; className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">Todas las zonas</option>
      {value && !groups.some((g) => g.area === value || g.barrios.some((b) => b.name === value)) && <option value={value}>{value}</option>}
      {groups.map((g) => (
        <optgroup key={g.area} label={g.area}>
          <option value={g.area}>{g.barrios.length ? `Todo ${g.area}` : g.area} ({g.count})</option>
          {g.barrios.map((b) => <option key={b.name} value={b.name}>{b.name} ({b.count})</option>)}
        </optgroup>
      ))}
    </select>
  );
}
