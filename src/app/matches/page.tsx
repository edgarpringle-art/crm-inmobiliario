"use client";

import { useEffect, useState } from "react";
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

type Dias = 1 | 7 | 15 | 30;

export default function MatchesPage() {
  const [dias, setDias] = useState<Dias>(15);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");

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

  const q = buscar.toLowerCase();
  const filtrados = matches.filter((m) => {
    if (!q) return true;
    const campos = [
      m.oferta.tipo, m.oferta.zona, m.oferta.contacto_nombre, m.oferta.grupo_nombre,
      m.busqueda.tipo, m.busqueda.zona, m.busqueda.contacto_nombre, m.busqueda.grupo_nombre,
    ];
    return campos.some((c) => (c || "").toLowerCase().includes(q));
  });

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
                dias === d
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
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
      </div>

      {loading && <div className="text-center py-16 text-slate-400">Cargando matches...</div>}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-xs text-slate-500 mb-3">{filtrados.length} matches</p>
          <div className="space-y-3">
            {filtrados.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">
                Sin matches en este periodo.
              </div>
            )}
            {filtrados.map((m) => <MatchCard key={m.id} m={m} />)}
          </div>
        </>
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-300 border-emerald-600 bg-emerald-800/40";
  if (score >= 80) return "text-green-300 border-green-600 bg-green-800/40";
  if (score >= 70) return "text-blue-300 border-blue-600 bg-blue-800/40";
  return "text-slate-300 border-slate-600 bg-slate-800/40";
}

function MatchCard({ m }: { m: Match }) {
  const [expanded, setExpanded] = useState(false);

  const miOferta     = m.oferta_tabla === "mis_listados";
  const miBusqueda   = m.busqueda_tabla === "mis_listados";

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 hover:border-purple-500 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className={`px-3 py-1 rounded-full border text-sm font-bold ${scoreColor(m.score)}`}>
          {m.score.toFixed(0)}%
        </div>
        <div className="flex-1 text-xs text-slate-400">
          {new Date(m.created_at).toLocaleString("es-PA", { dateStyle: "short", timeStyle: "short" })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {/* Oferta */}
        <div className={`rounded-lg p-3 border ${miOferta ? "bg-green-900/30 border-green-700" : "bg-slate-900 border-slate-700"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase ${miOferta ? "text-green-300" : "text-slate-400"}`}>
              {miOferta ? "⭐ MI OFERTA" : "OFERTA DE GRUPO"}
            </span>
          </div>
          <p className="text-white text-sm font-semibold">
            {m.oferta.tipo || "—"} · {m.oferta.zona || "—"}
          </p>
          <p className="text-green-300 font-bold text-sm">{m.oferta.precio_texto || "—"}</p>
          <p className="text-slate-300 text-xs mt-1">{m.oferta.modalidad}</p>
          {m.oferta.contacto_nombre && (
            <p className="text-white text-xs mt-1 font-semibold">{m.oferta.contacto_nombre}</p>
          )}
          {m.oferta.contacto_tel && (
            <a
              href={`https://wa.me/${m.oferta.contacto_tel.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 hover:text-green-200 text-xs block"
            >
              📲 {m.oferta.contacto_tel}
            </a>
          )}
          {m.oferta.grupo_nombre && (
            <p className="text-slate-400 text-xs mt-1">📌 {m.oferta.grupo_nombre}</p>
          )}
        </div>

        {/* Búsqueda */}
        <div className={`rounded-lg p-3 border ${miBusqueda ? "bg-blue-900/30 border-blue-700" : "bg-slate-900 border-slate-700"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase ${miBusqueda ? "text-blue-300" : "text-slate-400"}`}>
              {miBusqueda ? "⭐ MI CLIENTE" : "BÚSQUEDA DE GRUPO"}
            </span>
          </div>
          <p className="text-white text-sm font-semibold">
            {m.busqueda.tipo || "—"} · {m.busqueda.zona || "—"}
          </p>
          <p className="text-blue-300 font-bold text-sm">{m.busqueda.presupuesto_texto || "—"}</p>
          <p className="text-slate-300 text-xs mt-1">{m.busqueda.modalidad}</p>
          {m.busqueda.contacto_nombre && (
            <p className="text-white text-xs mt-1 font-semibold">{m.busqueda.contacto_nombre}</p>
          )}
          {m.busqueda.contacto_tel && (
            <a
              href={`https://wa.me/${m.busqueda.contacto_tel.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 text-xs block"
            >
              📲 {m.busqueda.contacto_tel}
            </a>
          )}
          {m.busqueda.grupo_nombre && (
            <p className="text-slate-400 text-xs mt-1">📌 {m.busqueda.grupo_nombre}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {m.criterios_ok.map((c, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-green-900/40 text-green-300 rounded border border-green-700">
            ✓ {c}
          </span>
        ))}
        {m.criterios_no.map((c, i) => (
          <span key={i} className="text-xs px-2 py-1 bg-red-900/40 text-red-300 rounded border border-red-700">
            ✗ {c}
          </span>
        ))}
      </div>

      {(m.oferta.msg_original || m.busqueda.msg_original) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-400 hover:text-white underline mt-3"
        >
          {expanded ? "Ocultar mensajes originales" : "Ver mensajes originales"}
        </button>
      )}

      {expanded && (
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {m.oferta.msg_original && (
            <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg">
              <p className="text-xs text-slate-400 mb-1 font-semibold">Mensaje de la oferta:</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{m.oferta.msg_original}</p>
            </div>
          )}
          {m.busqueda.msg_original && (
            <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg">
              <p className="text-xs text-slate-400 mb-1 font-semibold">Mensaje de la búsqueda:</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{m.busqueda.msg_original}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
