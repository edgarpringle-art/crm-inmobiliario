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
  miOferta: boolean;     // my property side
  miBusqueda: boolean;   // my client búsqueda side
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
      // Match between two group entities — shouldn't happen in normal feed but handle gracefully
      key = `external_${m.id}`;
      myEntity = m.oferta;
    }

    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        miOferta,
        miBusqueda,
        myEntity,
        matches: [],
        bestScore: 0,
        latestDate: m.created_at,
      };
      groups.set(key, g);
    }
    g.matches.push(m);
    if (m.score > g.bestScore) g.bestScore = m.score;
    if (m.created_at > g.latestDate) g.latestDate = m.created_at;
  }

  return Array.from(groups.values()).sort((a, b) => b.bestScore - a.bestScore);
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-300 border-emerald-600 bg-emerald-800/40";
  if (score >= 80) return "text-green-300 border-green-600 bg-green-800/40";
  if (score >= 70) return "text-blue-300 border-blue-600 bg-blue-800/40";
  return "text-slate-300 border-slate-600 bg-slate-800/40";
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
      // also search within individual matches
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
        <div className="flex rounded-xl overflow-hidden border border-slate-700">
          {([1, 7, 15, 30] as Dias[]).map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                dias === d ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
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
          className="flex-1 min-w-[200px] px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />

        <div className="flex gap-2">
          <button onClick={expandAll} className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-lg transition-colors">
            Expandir todo
          </button>
          <button onClick={collapseAll} className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-lg transition-colors">
            Colapsar
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-slate-400">Cargando matches...</div>}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-xs text-slate-500 mb-3">
            {filtered.length} grupo{filtered.length !== 1 ? "s" : ""} · {filtered.reduce((s, g) => s + g.matches.length, 0)} match{filtered.reduce((s, g) => s + g.matches.length, 0) !== 1 ? "es" : ""}
          </p>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">Sin matches en este periodo.</div>
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

// ── Group card with accordion ──────────────────────────────────────────────────
function MatchGroupCard({ group, isExpanded, onToggle }: { group: MatchGroup; isExpanded: boolean; onToggle: () => void }) {
  const isOferta = group.miOferta;
  const e = group.myEntity;
  const count = group.matches.length;

  // Header tone matches "my" side
  const headerBg = isOferta ? "bg-green-900/20 border-green-700" : "bg-blue-900/20 border-blue-700";
  const sideLabel = isOferta ? "MI OFERTA" : "MI CLIENTE";
  const sideColor = isOferta ? "text-green-300" : "text-blue-300";

  return (
    <div className={`rounded-xl border ${headerBg} overflow-hidden`}>
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors cursor-pointer"
      >
        {/* Chevron */}
        <svg
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>

        {/* Best score badge */}
        <div className={`px-3 py-1 rounded-full border text-sm font-bold flex-shrink-0 ${scoreColor(group.bestScore)}`}>
          {group.bestScore.toFixed(0)}%
        </div>

        {/* My entity info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${sideColor}`}>⭐ {sideLabel}</span>
            <span className="text-[10px] text-slate-500">·</span>
            <span className="text-[10px] text-slate-400">{e.modalidad || ""}</span>
          </div>
          <p className="text-white text-sm font-semibold truncate">
            {(e.tipo || "—")} · {e.zona || "Sin zona"}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {isOferta ? (e.precio_texto || "Sin precio") : (e.presupuesto_texto || "Sin presupuesto")}
            {e.contacto_nombre ? ` · ${e.contacto_nombre}` : ""}
          </p>
        </div>

        {/* Count badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="bg-purple-600/30 border border-purple-500/50 text-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold">
            {count} match{count !== 1 ? "es" : ""}
          </div>
        </div>
      </button>

      {/* Body (accordion) */}
      {isExpanded && (
        <div className="border-t border-slate-700/50 bg-slate-900/40">
          {/* CRM link for my entity */}
          {e.crm_id && (
            <div className="px-4 py-3 border-b border-slate-700/30 flex items-center gap-2">
              <a
                href={isOferta && e.crm_tabla === "properties" ? `/propiedades/${e.crm_id}` :
                       !isOferta && (e.crm_tabla === "busquedas" || e.crm_tabla === "clients") ?
                       (e.crm_tabla === "clients" ? `/clientes/${e.crm_id}` : `/busquedas/${e.crm_id}/editar`) :
                       "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  isOferta ? "bg-green-700/40 hover:bg-green-700/60 text-green-200" : "bg-blue-700/40 hover:bg-blue-700/60 text-blue-200"
                }`}
              >
                Ver ficha en CRM →
              </a>
            </div>
          )}

          {/* Individual match list */}
          <div className="divide-y divide-slate-700/30">
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

// ── Single match row inside expanded accordion ────────────────────────────────
function IndividualMatch({ match, myIsOferta }: { match: Match; myIsOferta: boolean }) {
  const [showOriginal, setShowOriginal] = useState(false);
  // The "other" side — the WhatsApp group entity we matched against
  const other = myIsOferta ? match.busqueda : match.oferta;
  const otherKind = myIsOferta ? "Búsqueda de grupo" : "Oferta de grupo";
  const otherColor = myIsOferta ? "text-blue-300" : "text-green-300";

  return (
    <div className="p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className={`px-2.5 py-0.5 rounded-full border text-xs font-bold flex-shrink-0 ${scoreColor(match.score)}`}>
          {match.score.toFixed(0)}%
        </div>
        <div className="flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${otherColor}`}>{otherKind}</p>
          <p className="text-xs text-slate-500">
            {new Date(match.created_at).toLocaleString("es-PA", { dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        {/* Other side details */}
        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
          <p className="text-white text-sm font-semibold">
            {other.tipo || "—"} · {other.zona || "—"}
          </p>
          <p className={`font-bold text-sm mt-0.5 ${otherColor}`}>
            {myIsOferta ? (other.presupuesto_texto || "—") : (other.precio_texto || "—")}
          </p>
          <p className="text-slate-300 text-xs mt-1">{other.modalidad || ""}</p>
          {other.habitaciones != null && <p className="text-slate-400 text-xs">{other.habitaciones} hab</p>}
          {other.habitaciones_min != null && <p className="text-slate-400 text-xs">mín {other.habitaciones_min} hab</p>}
          {other.m2 != null && <p className="text-slate-400 text-xs">{other.m2} m²</p>}
        </div>

        {/* Contact */}
        <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3">
          {other.contacto_nombre && (
            <p className="text-white text-sm font-semibold">{other.contacto_nombre}</p>
          )}
          {other.contacto_tel && (
            <a
              href={`https://wa.me/${other.contacto_tel.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-1 text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
            >
              📲 {other.contacto_tel}
            </a>
          )}
          {other.grupo_nombre && (
            <p className="text-slate-400 text-[11px] mt-2 truncate">📌 {other.grupo_nombre}</p>
          )}
          {!other.contacto_nombre && !other.contacto_tel && (
            <p className="text-xs text-slate-500">Sin datos de contacto</p>
          )}
        </div>
      </div>

      {/* Criterios */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {match.criterios_ok.map((c, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 bg-green-900/40 text-green-300 rounded border border-green-700">
            ✓ {c}
          </span>
        ))}
        {match.criterios_no.map((c, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 bg-red-900/40 text-red-300 rounded border border-red-700">
            ✗ {c}
          </span>
        ))}
      </div>

      {/* Original message toggle */}
      {(other.msg_original || (myIsOferta ? match.oferta.msg_original : match.busqueda.msg_original)) && (
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="text-[11px] text-slate-500 hover:text-slate-300 underline mt-1"
        >
          {showOriginal ? "Ocultar mensaje original" : "Ver mensaje original"}
        </button>
      )}

      {showOriginal && other.msg_original && (
        <div className="mt-2 p-3 bg-slate-900 border border-slate-700 rounded-lg">
          <p className="text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Mensaje original</p>
          <p className="text-xs text-slate-200 whitespace-pre-wrap">{other.msg_original}</p>
        </div>
      )}
    </div>
  );
}
