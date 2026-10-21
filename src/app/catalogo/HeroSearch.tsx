"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ZONAS } from "@/lib/zonas";
import { PROPERTY_TYPE_OPTIONS, portalHref } from "@/components/portal/brand";
import { IconChevron, IconSearch } from "@/components/portal/icons";

export default function HeroSearch({ portal = false }: { portal?: boolean }) {
  const router = useRouter();
  const [op, setOp] = useState("");
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("");
  const [type, setType] = useState("");

  function go() {
    const params = new URLSearchParams();
    if (op) params.set("op", op);
    if (q.trim()) params.set("q", q.trim());
    if (zone) params.set("zone", zone);
    if (type) params.set("type", type);
    router.push(`${portalHref("/propiedades", portal)}${params.toString() ? `?${params}` : ""}`);
  }

  const field = "w-full appearance-none bg-[#FBF8F3] border border-[#E4D9C6] text-[#1E1A15] text-sm rounded-lg px-3.5 py-3 focus:outline-none focus:border-[#B8945F] transition-colors";

  return (
    <form onSubmit={(e) => { e.preventDefault(); go(); }}
      className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-2.5 sm:p-3 max-w-3xl mx-auto text-left">
      <div className="flex gap-1 mb-2.5 p-1 bg-[#F3ECDF] rounded-full">
        {[{ v: "", l: "Todo" }, { v: "VENTA", l: "Comprar" }, { v: "ALQUILER", l: "Alquilar" }].map((o) => (
          <button type="button" key={o.v} onClick={() => setOp(o.v)}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-[0.15em] rounded-full transition-all ${
              op === o.v ? "bg-[#1E1A15] text-white shadow-sm" : "text-[#6B6155] hover:text-[#1E1A15]"
            }`}>
            {o.l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-4 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9182] pointer-events-none"><IconSearch /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre, PH o sector..." className={`${field} pl-10`} />
        </div>
        <div className="sm:col-span-3 relative">
          <select value={zone} onChange={(e) => setZone(e.target.value)} className={`${field} pr-9 cursor-pointer`}>
            <option value="">Todas las zonas</option>
            {ZONAS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.zones.map((z) => <option key={z} value={z}>{z}</option>)}
              </optgroup>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
        </div>
        <div className="sm:col-span-3 relative">
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${field} pr-9 cursor-pointer`}>
            {PROPERTY_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
        </div>
        <button type="submit"
          className="sm:col-span-2 flex items-center justify-center gap-2 bg-[#B8945F] hover:bg-[#A4824F] text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-lg px-4 py-3 transition-colors">
          <IconSearch className="w-4 h-4" /> Buscar
        </button>
      </div>
    </form>
  );
}
