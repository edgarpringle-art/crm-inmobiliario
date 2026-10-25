"use client";

import { useEffect, useMemo, useState } from "react";
import ZoneSelect from "@/components/portal/ZoneSelect";
import PropertyCard from "@/components/portal/PropertyCard";
import { PROPERTY_TYPE_OPTIONS, SERIF, buildPlaceTree, buildZoneGroups, inPlace, placeKey, waLink, type PortalProperty } from "@/components/portal/brand";
import { IconChevron, IconHouse, IconSearch, IconWA } from "@/components/portal/icons";
import { tr, type Lang } from "@/components/portal/i18n";
import { track } from "@/components/portal/WebTracker";
import AlertForm from "@/components/portal/AlertForm";

// lowercase + no accents, so "Panama" finds "Panamá"
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface Filters { op: string; type: string; prov: string; dist: string; zone: string; q: string; beds: string; maxPrice?: string }

const PRICE_STEPS = ["1000", "2000", "3500", "150000", "300000", "500000", "1000000"];

export default function Listing({ properties, initial, basePath, lang = "es" }: { properties: PortalProperty[]; initial: Filters; basePath: string; lang?: Lang }) {
  const t = tr(lang);
  const [f, setF] = useState<Filters>({ ...initial, maxPrice: "" });
  // Province → district → zone cascade: changing a level clears the ones below it.
  const set = (k: keyof Filters, v: string) => setF((prev) => ({
    ...prev, [k]: v,
    ...(k === "prov" ? { dist: "", zone: "" } : k === "dist" ? { zone: "" } : {}),
  }));

  // Keep the URL shareable without a server round trip.
  useEffect(() => {
    const params = new URLSearchParams();
    (["op", "type", "prov", "dist", "zone", "q", "beds"] as const).forEach((key) => f[key] && params.set(key, f[key]));
    const url = `${basePath}${params.toString() ? `?${params}` : ""}`;
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, "", url);
  }, [f, basePath]);

  // Record what people search for (only once filters have been stable for 2.5s).
  useEffect(() => {
    const meta: Record<string, string> = {};
    (["op", "type", "prov", "dist", "zone", "beds", "maxPrice"] as const).forEach((k) => { if (f[k]) meta[k] = String(f[k]); });
    if (f.q.trim()) meta.q = f.q.trim().slice(0, 60);
    if (!Object.keys(meta).length) return;
    const id = setTimeout(() => track("search", { meta }), 2500);
    return () => clearTimeout(id);
  }, [f]);

  const filtered = useMemo(() => {
    const q = fold(f.q.trim());
    const zone = fold(f.zone);
    const max = f.maxPrice ? Number(f.maxPrice) : null;
    return properties.filter((p) => {
      if (f.op && !(p.operationType === f.op || p.operationType === "VENTA_Y_ALQUILER")) return false;
      if (f.type && p.propertyType !== f.type) return false;
      if (!inPlace(p, f.prov, f.dist)) return false;
      if (zone && ![p.sector, p.corregimiento, p.city, p.state, p.title].some((s) => s && fold(s).includes(zone))) return false;
      if (f.beds && (p.bedrooms ?? 0) < Number(f.beds)) return false;
      if (max != null) {
        const price = f.op === "ALQUILER" ? p.rentPrice : f.op === "VENTA" ? p.salePrice : (p.salePrice ?? p.rentPrice);
        if (price == null || price > max) return false;
      }
      if (q && ![p.title, p.sector, p.corregimiento, p.city, p.state].some((s) => s && fold(s).includes(q))) return false;
      return true;
    });
  }, [properties, f]);

  const PAGE = 24;
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [f]);
  const visible = filtered.slice(0, shown);

  const places = useMemo(() => buildPlaceTree(properties), [properties]);
  const districts = places.find((p) => placeKey(p.name) === placeKey(f.prov))?.districts
    ?? places.flatMap((p) => p.districts);
  const zoneGroups = useMemo(
    () => buildZoneGroups(properties.filter((p) => inPlace(p, f.prov, f.dist))),
    [properties, f.prov, f.dist]
  );

  const hasFilters = f.op || f.type || f.prov || f.dist || f.zone || f.q || f.beds || f.maxPrice;
  const field = "w-full appearance-none bg-white border border-[#E4D9C6] text-[#1E1A15] text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#B8945F] transition-colors";

  return (
    <section className="px-4 sm:px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Filters */}
        <div className="-mt-6 relative z-10 bg-white rounded-2xl border border-[#E9E0D0] shadow-[0_20px_40px_-28px_rgba(30,26,21,0.45)] p-4 sm:p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {[{ v: "", l: t.search.all }, { v: "VENTA", l: t.search.buy }, { v: "ALQUILER", l: t.search.rent }].map((o) => (
              <button key={o.v} onClick={() => set("op", o.v)}
                className={`px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] rounded-full border transition-all ${
                  f.op === o.v ? "bg-[#1E1A15] text-white border-[#1E1A15]" : "border-[#E4D9C6] text-[#6B6155] hover:border-[#B8945F] hover:text-[#1E1A15]"
                }`}>
                {o.l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="col-span-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9182] pointer-events-none"><IconSearch className="w-4 h-4" /></span>
              <input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder={t.listing.searchPh} className={`${field} pl-9`} />
            </div>
            <div className="relative">
              <select value={f.type} onChange={(e) => set("type", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                {PROPERTY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value ? t.types[o.value] : t.allTypes}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
            <div className="relative">
              <select value={f.maxPrice} onChange={(e) => set("maxPrice", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                <option value="">{t.listing.noLimit}</option>
                {PRICE_STEPS.map((v) => <option key={v} value={v}>{t.listing.upTo(`$${Number(v).toLocaleString("en-US")}`)}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
            <div className="relative">
              <select value={f.prov} onChange={(e) => set("prov", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                <option value="">{t.search.allProvinces}</option>
                {places.map((o) => <option key={o.name} value={o.name}>{o.name} ({o.count})</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
            <div className="relative">
              <select value={f.dist} onChange={(e) => set("dist", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                <option value="">{t.search.allDistricts}</option>
                {districts.map((o) => <option key={o.name} value={o.name}>{o.name} ({o.count})</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
            <div className="relative">
<ZoneSelect lang={lang} groups={zoneGroups} value={f.zone} onChange={(v) => set("zone", v)} className={`${field} pr-9 cursor-pointer`} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>
            <div className="relative">
              <select value={f.beds} onChange={(e) => set("beds", e.target.value)} className={`${field} pr-9 cursor-pointer`}>
                <option value="">{t.listing.beds}</option>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{t.listing.bedsN(n)}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
            </div>

          </div>
        </div>

        <div className="flex items-center justify-between mt-8 mb-6">
          <p className="text-sm text-[#6B6155]">
            <span className="text-[#1E1A15] font-semibold">{filtered.length}</span> {t.listing.results(filtered.length)}
          </p>
          {hasFilters && (
            <button onClick={() => { setF({ op: "", type: "", prov: "", dist: "", zone: "", q: "", beds: "", maxPrice: "" }); }}
              className="text-xs text-[#8A6A3A] hover:text-[#1E1A15] underline underline-offset-4">
              {t.listing.clear}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-[#F3ECDF] border border-[#E9E0D0]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center text-[#B8945F]"><IconHouse /></div>
            <p className="text-lg mb-1" style={SERIF}>{t.listing.emptyTitle}</p>
            <p className="text-sm text-[#6B6155] mb-5">{t.listing.emptyText}</p>
            <a href={waLink(t.listing.emptyWaMsg)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1E1A15] hover:bg-[#B8945F] text-white font-semibold px-6 py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
              <IconWA /> {t.listing.emptyWa}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((p) => <PropertyCard key={p.id} p={p} lang={lang} />)}
          </div>
        )}
        {filtered.length > shown && (
          <div className="text-center mt-10">
            <p className="text-xs text-[#6B6155] mb-3">{t.listing.showing(shown, filtered.length)}</p>
            <button onClick={() => setShown((n) => n + PAGE)}
              className="inline-flex items-center gap-2 border border-[#1E1A15] hover:bg-[#1E1A15] hover:text-white text-[#1E1A15] font-semibold px-8 py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
              {t.listing.more}
            </button>
          </div>
        )}
        <div className="mt-12">
          <AlertForm lang={lang} prefill={{
            op: f.op === "ALQUILER" ? "ALQUILER" : "COMPRA", type: f.type, beds: f.beds, maxPrice: f.maxPrice,
            zone: [f.zone, f.dist, f.prov].find(Boolean) || "",
          }} />
        </div>
      </div>
    </section>
  );
}
