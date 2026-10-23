"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ZoneSelect from "@/components/portal/ZoneSelect";
import { PROPERTY_TYPE_OPTIONS, buildPlaceTree, buildZoneGroups, inPlace, placeKey, portalHref, type PlaceItem } from "@/components/portal/brand";
import { tr, type Lang } from "@/components/portal/i18n";
import { IconChevron, IconSearch } from "@/components/portal/icons";
import { track } from "@/components/portal/WebTracker";

export default function HeroSearch({ portal = false, places = [], lang = "es" }: { portal?: boolean; places?: PlaceItem[]; lang?: Lang }) {
  const t = tr(lang);
  const router = useRouter();
  const [op, setOp] = useState("");
  const [q, setQ] = useState("");
  const [prov, setProv] = useState("");
  const [dist, setDist] = useState("");
  const [zone, setZone] = useState("");

  const tree = useMemo(() => buildPlaceTree(places), [places]);
  const districts = tree.find((p) => placeKey(p.name) === placeKey(prov))?.districts ?? tree.flatMap((p) => p.districts);
  const zones = useMemo(() => buildZoneGroups(places.filter((p) => inPlace(p, prov, dist))), [places, prov, dist]);
  const [type, setType] = useState("");

  function go() {
    const params = new URLSearchParams();
    if (op) params.set("op", op);
    if (q.trim()) params.set("q", q.trim());
    if (prov) params.set("prov", prov);
    if (dist) params.set("dist", dist);
    if (zone) params.set("zone", zone);
    if (type) params.set("type", type);
    const meta = Object.fromEntries([...params.entries()].map(([k, v]) => [k, v.slice(0, 60)]));
    if (Object.keys(meta).length) track("search", { meta: { ...meta, from: "home" } });
    router.push(`${portalHref("/propiedades", portal)}${params.toString() ? `?${params}` : ""}`);
  }

  const field = "w-full appearance-none bg-[#FBF8F3] border border-[#E4D9C6] text-[#1E1A15] text-sm rounded-lg px-3.5 py-3 focus:outline-none focus:border-[#B8945F] transition-colors";

  return (
    <form onSubmit={(e) => { e.preventDefault(); go(); }}
      className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-2.5 sm:p-3 max-w-3xl mx-auto text-left">
      <div className="flex gap-1 mb-2.5 p-1 bg-[#F3ECDF] rounded-full">
        {[{ v: "", l: t.search.all }, { v: "VENTA", l: t.search.buy }, { v: "ALQUILER", l: t.search.rent }].map((o) => (
          <button type="button" key={o.v} onClick={() => setOp(o.v)}
            className={`flex-1 py-2 text-xs font-semibold uppercase tracking-[0.15em] rounded-full transition-all ${
              op === o.v ? "bg-[#1E1A15] text-white shadow-sm" : "text-[#6B6155] hover:text-[#1E1A15]"
            }`}>
            {o.l}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-6 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9182] pointer-events-none"><IconSearch /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search.placeholder} className={`${field} pl-10`} />
        </div>
        <div className="sm:col-span-4 relative">
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${field} pr-9 cursor-pointer`}>
            {PROPERTY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value ? t.types[o.value] : t.allTypes}</option>)}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
        </div>
        <button type="submit"
          className="sm:col-span-2 sm:row-span-2 flex items-center justify-center gap-2 bg-[#B8945F] hover:bg-[#A4824F] text-white text-xs font-semibold uppercase tracking-[0.15em] rounded-lg px-4 py-3 transition-colors">
          <IconSearch className="w-4 h-4" /> {t.search.button}
        </button>
        <div className="sm:col-span-3 relative">
          <select value={prov} onChange={(e) => { setProv(e.target.value); setDist(""); setZone(""); }} className={`${field} pr-9 cursor-pointer`}>
            <option value="">{t.search.allProvinces}</option>
            {tree.map((p) => <option key={p.name} value={p.name}>{p.name} ({p.count})</option>)}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
        </div>
        <div className="sm:col-span-3 relative">
          <select value={dist} onChange={(e) => { setDist(e.target.value); setZone(""); }} className={`${field} pr-9 cursor-pointer`}>
            <option value="">{t.search.allDistricts}</option>
            {districts.map((d) => <option key={d.name} value={d.name}>{d.name} ({d.count})</option>)}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
        </div>
        <div className="sm:col-span-4 relative">
          <ZoneSelect lang={lang} groups={zones} value={zone} onChange={setZone} className={`${field} pr-9 cursor-pointer`} />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9182]"><IconChevron /></span>
        </div>
      </div>
    </form>
  );
}
