"use client";

import { useEffect, useMemo, useState } from "react";
import { ZONAS } from "@/lib/zonas";
import PropertyCard from "@/components/portal/PropertyCard";
import { PROPERTY_TYPE_OPTIONS, SERIF, waLink, type PortalProperty } from "@/components/portal/brand";
import { IconChevron, IconHouse, IconSearch, IconWA } from "@/components/portal/icons";

interface Filters { op: string; type: string; zone: string; q: string; beds: string; maxPrice?: string }

const PRICE_STEPS = [
  { v: "", l: "Sin límite" },
  { v: "1000", l: "Hasta $1,000" }, { v: "2000", l: "Hasta $2,000" }, { v: "3500", l: "Hasta $3,500" },
  { v: "150000", l: "Hasta $150,000" }, { v: "300000", l: "Hasta $300,000" }, { v: "500000", l: "Hasta $500,000" }, { v: "1000000", l: "Hasta $1,000,000" },
];

export default function Listing({ properties, initial, basePath }: { properties: PortalProperty[]; initial: Filters; basePath: string }) {
  const [f, setF] = useState<Filters>({ ...initial, maxPrice: "" });
  const set = (k: keyof Filters, v: string) => {
    setF((prev) => {
      const next = { ...prev, [k]: v };
      // Keep the URL shareable without a server round trip.
      const params = new URLSearchParams();
      (["op", "type", "zone", "q", "beds"] as const).forEach((key) => next[key] && params.set(key, next[key]));
      window.history.replaceState(null, "", `${basePath}${params.toString() ? `?${params}` : ""}`);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const max = f.maxPrice ? Number(f.maxPrice) : null;
    return properties.filter((p) => {
      if (f.op && !(p.operationType === f.op || p.operationType === "VENTA_Y_ALQUILER")) return false;
      if (f.type && p.propertyType !== f.type) return false;
      if (f.zone && p.sector !== f.zone && p.city !== f.zone) return false;
      if (f.beds && (p.bedrooms ?? 0) < Number(f.beds)) return false;
      if (max != null) {
        const price = f.op === "ALQUILER" ? p.rentPrice : f.op === "VENTA" ? p.salePrice : (p.salePrice ?? p.rentPrice);
        if (price == null || price > max) return false;
      }
      if (q && ![p.title, p.sector, p.city, p.state].some((s) => s?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [properties, f]);

  const PAGE = 24;
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [f]);
  const visible = filtered.slice(0, shown);

  const hasFilters = f.op || f.type || f.zone || f.q || f.beds || f.maxPrice;
  const field = "w-full appearance-none bg-white border border-[#E4D9C6] text-[#1E1A15] text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#B8945F] transition-colors";

  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="-mt-6 relative z-10 bg-white rounded-2xl border border-[#E9E0D0] shadow-[0_20px_40px_-28px_rgba(30,26,21,0.45)] p-4 sm:p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {[{ v: "", l: "Todo" }, { v: "VENTA", l: "Comprar" }, { v: "ALQUILER", l: "Alquilar" }].map((o) => (
              <button key={o.v} onClick={() => set("op", o.v)}
                className={`px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] rounded-full border transition-all ${
                  f.op === o.v ? "bg-[#1E1A15] text-white border-[#1E1A15]" : "border-[#E4D9C6] text-[#6B6155] hover:border-[#B8945F] hover:text-[#1E1A15]"
                }`}>
                {o.l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div className="col-span-2 lg:col-span-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9182] pointer-events-none"><IconSearch className="w-4 h-4" /></span>
              <input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Buscar..." className={`${field} pl-9`} />
            </div>
            <div className="relative">
              <select value={f.type} onChange={(e) => set("type", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                {PROPERTY_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
            <div className="relative">
              <select value={f.zone} onChange={(e) => set("zone", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                <option value="">Todas las zonas</option>
                {ZONAS.map((g) => (
                  <optgroup key={g.group} label={g.group}>{g.zones.map((z) => <option key={z} value={z}>{z}</option>)}</optgroup>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
            <div className="relative">
              <select value={f.beds} onChange={(e) => set("beds", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                <option value="">Habitaciones</option>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ hab</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
            <div className="relative">
              <select value={f.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                {PRICE_STEPS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 mb-6">
          <p className="text-sm text-[#6B6155]">
            <span className="text-[#1E1A15] font-semibold">{filtered.length}</span> propiedad{filtered.length !== 1 ? "es" : ""}
          </p>
          {hasFilters && (
            <button onClick={() => { setF({ op: "", type: "", zone: "", q: "", beds: "", maxPrice: "" }); window.history.replaceState(null, "", basePath); }}
              className="text-xs text-[#8A6A3A] hover:text-[#1E1A15] underline underline-offset-4">
              Limpiar filtros
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-[#F3ECDF] border border-[#E9E0D0]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center text-[#B8945F]"><IconHouse /></div>
            <p className="text-lg mb-1" style={SERIF}>Sin resultados</p>
            <p className="text-sm text-[#6B6155] mb-5">Cuéntanos qué buscas y te avisamos cuando tengamos opciones.</p>
            <a href={waLink("Hola PanamaInmo, busco una propiedad en Panamá.")} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1E1A15] hover:bg-[#B8945F] text-white font-semibold px-6 py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
              <IconWA /> Consultar disponibilidad
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        )}
        {filtered.length > shown && (
          <div className="text-center mt-10">
            <p className="text-xs text-[#6B6155] mb-3">Mostrando {shown} de {filtered.length}</p>
            <button onClick={() => setShown((n) => n + PAGE)}
              className="inline-flex items-center gap-2 border border-[#1E1A15] hover:bg-[#1E1A15] hover:text-white text-[#1E1A15] font-semibold px-8 py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
              Ver más propiedades
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
