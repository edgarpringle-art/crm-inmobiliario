"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";

interface Entidad {
  id: number;
  tipo?: string;
  zona?: string;
  precio_texto?: string;
  presupuesto_texto?: string;
  modalidad?: string;
  habitaciones?: number | null;
  habitaciones_min?: number | null;
  m2?: number | null;
  descripcion?: string;
  requisitos?: string;
  contacto_nombre?: string;
  contacto_tel?: string;
  grupo_nombre?: string;
  fecha?: string;
  hora?: string;
  modo?: string;
  msg_original?: string | null;
  crm_id?: string | null;
  crm_tabla?: string | null;
}

interface Match {
  id: number;
  score: number;
  oferta_tabla: string;
  busqueda_tabla: string;
  criterios_ok: string[];
  criterios_no: string[];
  oferta: Entidad;
  busqueda: Entidad;
  created_at: string;
}

interface MatchGroup {
  key: string;
  miOferta: boolean;
  miBusqueda: boolean;
  myEntity: Entidad;
  matches: Match[];
  bestScore: number;
  latestDate: string;
}

type Dias = 1 | 7 | 15 | 30;

function groupMatches(matches: Match[]): MatchGroup[] {
  const groups = new Map<string, MatchGroup>();

  for (const m of matches) {
    const miOferta = m.oferta_tabla === "mis_listados";
    const miBusqueda = m.busqueda_tabla === "mis_listados";

    let key: string;
    let myEntity: Entidad;

    if (miOferta) {
      key = `prop_${m.oferta.id}`;
      myEntity = m.oferta;
    } else if (miBusqueda) {
      key = `bus_${m.busqueda.id}`;
      myEntity = m.busqueda;
    } else {
      key = `external_${m.id}`;
      myEntity = m.oferta;
    }

    let g = groups.get(key);
    if (!g) {
      g = {
        key, miOferta, miBusqueda, myEntity,
        matches: [], bestScore: 0, latestDate: m.created_at,
      };
      groups.set(key, g);
    }
    g.matches.push(m);
    if (m.score > g.bestScore) g.bestScore = m.score;
    if (m.created_at > g.latestDate) g.latestDate = m.created_at;
  }

  return Array.from(groups.values()).sort((a, b) => b.bestScore - a.bestScore);
}

// High-contrast score badge — solid backgrounds, dark text
function scoreClass(score: number): string {
  if (score >= 90) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 70) return "bg-blue-100 text-blue-800 border-blue-300";
  return "bg-gray-100 text-gray-700 border-gray-300";
}

export default function MatchesPage() {
  const [dias, setDias] = useState<Dias>(15);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/matches-feed?dias=${dias}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setMatches(Array.isArray(data.matches) ? data.matches : []);
      })
      .catch(() => setError("No se pudo conectar al bot. Verifica que EP Realty esté activo."))
      .finally(() => setLoading(false));
  }, [dias]);

  const grouped = useMemo(() => groupMatches(matches), [matches]);

  const filtered = useMemo(() => {
    const q = buscar.toLowerCase().trim();
    if (!q) return grouped;
    return grouped.filter((g) => {
      const myFields = [g.myEntity.tipo, g.myEntity.zona, g.myEntity.contacto_nombre, g.myEntity.grupo_nombre];
      if (myFields.some((c) => (c || "").toLowerCase().includes(q))) return true;
      return g.matches.some((m) => {
        const fields = [
          m.oferta.tipo, m.oferta.zona, m.oferta.contacto_nombre, m.oferta.grupo_nombre,
          m.busqueda.tipo, m.busqueda.zona, m.busqueda.contacto_nombre, m.busqueda.grupo_nombre,
        ];
        return fields.some((c) => (c || "").toLowerCase().includes(q));
      });
    });
  }, [grouped, buscar]);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(filtered.map((g) => g.key)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Matches Automáticos"
        subtitle="Coincidencias detectadas por el bot entre tus propiedades/clientes y los grupos de WhatsApp"
      />

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
          {([1, 7, 15, 30] as Dias[]).map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                dias === d ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {d === 1 ? "Hoy" : d === 7 ? "7 días" : d === 15 ? "15 días" : "30 días"}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Buscar zona, tipo, contacto..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />

        <div className="flex gap-2">
          <button onClick={expandAll} className="text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
            Expandir todo
          </button>
          <button onClick={collapseAll} className="text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
            Colapsar
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-gray-500">Cargando matches...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4 font-medium">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-xs text-gray-500 mb-3 font-medium">
            {filtered.length} grupo{filtered.length !== 1 ? "s" : ""} · {filtered.reduce((s, g) => s + g.matches.length, 0)} match{filtered.reduce((s, g) => s + g.matches.length, 0) !== 1 ? "es" : ""}
          </p>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                Sin matches en este periodo.
              </div>
            )}
            {filtered.map((g) => (
              <MatchGroupCard
                key={g.key}
                group={g}
                isExpanded={expanded.has(g.key)}
                onToggle={() => toggle(g.key)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MatchGroupCard({ group, isExpanded, onToggle }: { group: MatchGroup; isExpanded: boolean; onToggle: () => void }) {
  const isOferta = group.miOferta;
  const e = group.myEntity;
  const count = group.matches.length;

  // Side colors — high contrast for light theme
  const sideLabel = isOferta ? "MI OFERTA" : "MI CLIENTE";
  const sideAccent = isOferta ? "bg-emerald-500" : "bg-blue-500";
  const sideTextOnWhite = isOferta ? "text-emerald-700" : "text-blue-700";
  const sideBgSoft = isOferta ? "bg-emerald-50" : "bg-blue-50";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        {/* Color stripe on left */}
        <div className={`w-1 self-stretch rounded-full ${sideAccent} flex-shrink-0`} />

        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        {/* Best score */}
        <div className={`px-3 py-1 rounded-lg border text-sm font-bold flex-shrink-0 ${scoreClass(group.bestScore)}`}>
          {group.bestScore.toFixed(0)}%
        </div>

        {/* My entity info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${sideBgSoft} ${sideTextOnWhite}`}>
              ⭐ {sideLabel}
            </span>
            {e.modalidad && (
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                {e.modalidad}
              </span>
            )}
          </div>
          <p className="text-gray-900 text-sm font-bold truncate">
            {(e.tipo || "—").toUpperCase()} · {e.zona || "Sin zona"}
          </p>
          <p className="text-xs text-gray-500 truncate">
            <span className="font-semibold text-gray-700">
              {isOferta ? (e.precio_texto || "Sin precio") : (e.presupuesto_texto || "Sin presupuesto")}
            </span>
            {e.contacto_nombre ? <> · {e.contacto_nombre}</> : null}
          </p>
        </div>

        {/* Count badge */}
        <div className="flex-shrink-0">
          <div className="bg-purple-100 border border-purple-300 text-purple-800 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap">
            {count} match{count !== 1 ? "es" : ""}
          </div>
        </div>
      </button>

      {/* Body (accordion) */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {/* CRM link */}
          {e.crm_id && (
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <a
                href={isOferta && e.crm_tabla === "properties" ? `/propiedades/${e.crm_id}` :
                       !isOferta && (e.crm_tabla === "busquedas" || e.crm_tabla === "clients") ?
                       (e.crm_tabla === "clients" ? `/clientes/${e.crm_id}` : `/busquedas/${e.crm_id}/editar`) :
                       "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  isOferta ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Ver ficha en CRM →
              </a>
            </div>
          )}

          {/* Individual matches */}
          <div className="divide-y divide-gray-200">
            {group.matches
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((m) => (
                <IndividualMatch key={m.id} match={m} myIsOferta={isOferta} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IndividualMatch({ match, myIsOferta }: { match: Match; myIsOferta: boolean }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const other = myIsOferta ? match.busqueda : match.oferta;
  const otherKind = myIsOferta ? "Búsqueda de grupo" : "Oferta de grupo";
  const otherIconBg = myIsOferta ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700";
  const otherPriceColor = myIsOferta ? "text-blue-700" : "text-emerald-700";

  return (
    <div className="p-4 hover:bg-white transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold flex-shrink-0 ${scoreClass(match.score)}`}>
          {match.score.toFixed(0)}%
        </div>
        <div className="flex-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${otherIconBg}`}>
            {otherKind}
          </span>
          <p className="text-[11px] text-gray-500 mt-1">
            {new Date(match.created_at).toLocaleString("es-PA", { dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        {/* Other side details */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Detalles</p>
          <p className="text-gray-900 text-sm font-bold">
            {other.tipo || "—"} · {other.zona || "—"}
          </p>
          <p className={`font-bold text-base mt-1 ${otherPriceColor}`}>
            {myIsOferta ? (other.presupuesto_texto || "—") : (other.precio_texto || "—")}
          </p>
          <p className="text-gray-600 text-xs mt-1 capitalize">{other.modalidad || ""}</p>
          <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-gray-500">
            {other.habitaciones != null && <span>{other.habitaciones} hab</span>}
            {other.habitaciones_min != null && <span>mín {other.habitaciones_min} hab</span>}
            {other.m2 != null && <span>{other.m2} m²</span>}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Contacto</p>
          {other.contacto_nombre && (
            <p className="text-gray-900 text-sm font-bold">{other.contacto_nombre}</p>
          )}
          {other.contacto_tel && (
            <a
              href={`https://wa.me/${other.contacto_tel.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
            >
              📲 {other.contacto_tel}
            </a>
          )}
          {other.grupo_nombre && (
            <p className="text-gray-500 text-[11px] mt-2 truncate">📌 {other.grupo_nombre}</p>
          )}
          {!other.contacto_nombre && !other.contacto_tel && (
            <p className="text-xs text-gray-400 italic">Sin datos de contacto</p>
          )}
        </div>
      </div>

      {/* Criterios */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {match.criterios_ok.map((c, i) => (
          <span key={i} className="text-[11px] font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded border border-green-300">
            ✓ {c}
          </span>
        ))}
        {match.criterios_no.map((c, i) => (
          <span key={i} className="text-[11px] font-medium px-2 py-0.5 bg-red-100 text-red-800 rounded border border-red-300">
            ✗ {c}
          </span>
        ))}
      </div>

      {other.msg_original && (
        <>
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-[11px] font-medium text-gray-600 hover:text-gray-900 underline mt-1"
          >
            {showOriginal ? "Ocultar mensaje original" : "Ver mensaje original"}
          </button>
          {showOriginal && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[10px] text-amber-700 mb-1 font-bold uppercase tracking-wider">Mensaje original (WhatsApp)</p>
              <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{other.msg_original}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
