"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { HiEye, HiChat, HiDocumentText, HiSearch, HiExternalLink } from "react-icons/hi";

interface Stats {
  days: number;
  totals: { visits: number; propertyViews: number; whatsapp: number; leads: number; searches: number };
  daily: { date: string; visits: number; whatsapp: number; leads: number }[];
  topProperties: { id: string; title: string; zone: string | null; mlsId: string | null; views: number; whatsapp: number; leads: number }[];
  topZones: { name: string; count: number }[];
  topTypes: { name: string; count: number }[];
  ops: { name: string; count: number }[];
  topPages: { name: string; count: number }[];
  referrers: { name: string; count: number }[];
  langs: { name: string; count: number }[];
}

const RANGES = [7, 30, 90];
const fmtDay = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString("es-PA", { day: "numeric", month: "short" }); };

// Page path → readable label ("/catalogo/inmuebles/venta/casas/boquete" → "venta / casas / boquete").
const pageLabel = (p: string) => {
  const s = p.replace(/^\/catalogo(\/inmuebles)?/, "") || "/";
  return s === "/" ? "Inicio" : s.slice(1).replace(/-/g, " ").replace(/\//g, " / ");
};

function Tile({ icon: I, label, value, hint }: { icon: typeof HiEye; label: string; value: number; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium"><I className="w-4 h-4" />{label}</div>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString("es-PA")}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// Ranked list with an inline proportion bar (single hue: magnitude, not identity).
function RankList({ title, items, empty, label = (s: string) => s }: { title: string; items: { name: string; count: number }[]; empty: string; label?: (s: string) => string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="font-semibold text-gray-900 mb-3">{title}</p>
      {items.length === 0 ? <p className="text-sm text-gray-400">{empty}</p> : (
        <ul className="space-y-2.5">
          {items.map((i) => (
            <li key={i.name}>
              <div className="flex justify-between text-sm"><span className="text-gray-700 truncate pr-3">{label(i.name)}</span><span className="text-gray-900 font-medium tabular-nums">{i.count}</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full mt-1"><div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${(i.count / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EstadisticasWebPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/web-stats?days=${days}`).then((r) => r.json()).then((d) => setData(d?.totals ? d : null)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [days]);

  const maxDay = data ? Math.max(1, ...data.daily.map((d) => d.visits)) : 1;
  const t = data?.totals;
  const conv = t && t.propertyViews ? Math.round(((t.whatsapp + t.leads) / t.propertyViews) * 1000) / 10 : 0;

  return (
    <div>
      <PageHeader title="Estadísticas web" subtitle="Cómo usan los clientes panamainmo.com">
        <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)}
              className={`px-3 py-1.5 text-sm rounded-md ${days === r ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"}`}>
              {r} días
            </button>
          ))}
        </div>
      </PageHeader>

      {loading && !data ? <p className="text-sm text-gray-500">Cargando...</p> : !data ? (
        <p className="text-sm text-red-600">No se pudieron cargar las estadísticas.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Tile icon={HiEye} label="Visitas a la web" value={t!.visits} hint={`${t!.propertyViews.toLocaleString("es-PA")} a fichas de propiedades`} />
            <Tile icon={HiChat} label="Clics en WhatsApp" value={t!.whatsapp} />
            <Tile icon={HiDocumentText} label="Formularios enviados" value={t!.leads} hint={t!.propertyViews ? `${conv}% de las visitas a fichas terminan en contacto` : undefined} />
            <Tile icon={HiSearch} label="Búsquedas con filtros" value={t!.searches} />
          </div>

          {/* Visits per day — one series, so no legend; hover shows the day's numbers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-baseline justify-between mb-4">
              <p className="font-semibold text-gray-900">Visitas por día</p>
              <p className="text-xs text-gray-500 h-4">
                {hover != null && data.daily[hover]
                  ? `${fmtDay(data.daily[hover].date)}: ${data.daily[hover].visits} visitas · ${data.daily[hover].whatsapp} WhatsApp · ${data.daily[hover].leads} formularios`
                  : "Pasa el mouse sobre una barra para ver el detalle"}
              </p>
            </div>
            <div className="flex items-end h-48 border-b border-gray-200" style={{ gap: data.daily.length > 40 ? 1 : 2 }} onMouseLeave={() => setHover(null)}>
              {data.daily.map((d, i) => (
                <div key={d.date} className="flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)}
                  aria-label={`${fmtDay(d.date)}: ${d.visits} visitas`}>
                  <div className={`w-full rounded-t-[4px] transition-colors ${hover === i ? "bg-blue-700" : "bg-blue-500"}`}
                    style={{ height: `${(d.visits / maxDay) * 100}%`, minHeight: d.visits ? 2 : 0 }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
              <span>{fmtDay(data.daily[0].date)}</span>
              <span>{fmtDay(data.daily[data.daily.length - 1].date)}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
            <p className="font-semibold text-gray-900 mb-3">Propiedades con más interés</p>
            {data.topProperties.length === 0 ? <p className="text-sm text-gray-400">Aún no hay visitas a fichas en este periodo.</p> : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-3 font-medium">Propiedad</th>
                    <th className="py-2 px-3 font-medium text-right">Visitas</th>
                    <th className="py-2 px-3 font-medium text-right">WhatsApp</th>
                    <th className="py-2 pl-3 font-medium text-right">Formularios</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProperties.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 pr-3">
                        <a href={`/p/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
                          {p.title} <HiExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        </a>
                        <p className="text-xs text-gray-400">{[p.zone, p.mlsId ? `MLS #${p.mlsId}` : "Propia"].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-medium">{p.views}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{p.whatsapp}</td>
                      <td className="py-2.5 pl-3 text-right tabular-nums">{p.leads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <RankList title="Zonas más buscadas" items={data.topZones} empty="Sin búsquedas por zona todavía." />
            <RankList title="Tipos más buscados" items={[...data.ops, ...data.topTypes]} empty="Sin búsquedas todavía." />
            <RankList title="De dónde llegan" items={data.referrers} empty="Sin visitas todavía." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RankList title="Páginas más vistas" items={data.topPages} empty="Sin visitas todavía." label={pageLabel} />
            <RankList title="Idioma de los visitantes" items={data.langs} empty="Sin visitas todavía." />
          </div>

          <p className="text-xs text-gray-400">
            No se cuentan robots ni las visitas de usuarios con sesión abierta en el CRM. Para visitantes únicos, países y dispositivos usa{" "}
            <Link href="https://vercel.com/dashboard" target="_blank" className="underline">Vercel → Analytics</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
