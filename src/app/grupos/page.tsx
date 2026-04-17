"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

interface Oferta {
  id: number;
  tipo: string;
  zona: string;
  precio_texto: string;
  modalidad: string;
  habitaciones: number | null;
  m2: number | null;
  descripcion: string;
  contacto_nombre: string;
  contacto_tel: string;
  grupo_nombre: string;
  fecha: string;
  hora: string;
}

interface Busqueda {
  id: number;
  tipo: string;
  zona: string;
  presupuesto_texto: string;
  modalidad: string;
  habitaciones_min: number | null;
  requisitos: string;
  contacto_nombre: string;
  contacto_tel: string;
  grupo_nombre: string;
  fecha: string;
  hora: string;
}

type Tab = "ofertas" | "busquedas";
type Dias = 1 | 7 | 30;

export default function GruposPage() {
  const [tab, setTab] = useState<Tab>("ofertas");
  const [dias, setDias] = useState<Dias>(7);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [busquedas, setBusquedas] = useState<Busqueda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/grupos-feed?dias=${dias}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setOfertas(Array.isArray(data.ofertas) ? data.ofertas : []);
        setBusquedas(Array.isArray(data.busquedas) ? data.busquedas : []);
      })
      .catch(() => setError("No se pudo conectar al bot. Verifica que EP Realty esté activo."))
      .finally(() => setLoading(false));
  }, [dias]);

  const q = buscar.toLowerCase();
  const ofertasFiltradas = ofertas.filter((o) =>
    !q || [o.tipo, o.zona, o.precio_texto, o.contacto_nombre, o.grupo_nombre, o.descripcion]
      .some((f) => (f || "").toLowerCase().includes(q))
  );
  const busquedasFiltradas = busquedas.filter((b) =>
    !q || [b.tipo, b.zona, b.presupuesto_texto, b.contacto_nombre, b.grupo_nombre, b.requisitos]
      .some((f) => (f || "").toLowerCase().includes(q))
  );

  const items = tab === "ofertas" ? ofertasFiltradas : busquedasFiltradas;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Feed de Grupos WhatsApp"
        subtitle="Propiedades capturadas automáticamente de los grupos"
      />

      {/* Controles */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-slate-700">
          {(["ofertas", "busquedas"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {t === "ofertas" ? `Ofertas (${ofertas.length})` : `Búsquedas (${busquedas.length})`}
            </button>
          ))}
        </div>

        {/* Rango de días */}
        <div className="flex rounded-xl overflow-hidden border border-slate-700">
          {([1, 7, 30] as Dias[]).map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                dias === d
                  ? "bg-slate-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {d === 1 ? "Hoy" : d === 7 ? "7 días" : "30 días"}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <input
          type="text"
          placeholder="Buscar zona, tipo, contacto..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Estado */}
      {loading && (
        <div className="text-center py-16 text-slate-400">Cargando feed...</div>
      )}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Lista */}
      {!loading && !error && (
        <>
          <p className="text-xs text-slate-500 mb-3">{items.length} resultados</p>
          <div className="space-y-3">
            {items.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">
                Sin {tab} en este periodo.
              </div>
            )}
            {tab === "ofertas"
              ? ofertasFiltradas.map((o) => <OfertaCard key={o.id} o={o} />)
              : busquedasFiltradas.map((b) => <BusquedaCard key={b.id} b={b} />)}
          </div>
        </>
      )}
    </div>
  );
}

function OfertaCard({ o }: { o: Oferta }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex gap-4 items-start hover:border-slate-600 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-green-900/50 border border-green-700/50 flex items-center justify-center flex-shrink-0">
        <span className="text-green-400 text-xs font-bold">OF</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-2 items-center mb-1">
          <span className="font-semibold text-white text-sm">{o.tipo || "—"} · {o.zona || "—"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800">
            {o.modalidad}
          </span>
        </div>
        <p className="text-green-400 font-bold text-sm mb-1">{o.precio_texto || "—"}</p>
        <p className="text-slate-400 text-xs mb-2 line-clamp-2">{o.descripcion || ""}</p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          {o.habitaciones && <span>🛏 {o.habitaciones} hab</span>}
          {o.m2 && <span>📐 {o.m2} m²</span>}
          <span>📌 {o.grupo_nombre}</span>
          <span>🕐 {o.fecha} {o.hora}</span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        {o.contacto_nombre && (
          <p className="text-xs text-white font-semibold">{o.contacto_nombre}</p>
        )}
        {o.contacto_tel && (
          <a
            href={`https://wa.me/${o.contacto_tel.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-400 hover:text-green-300 mt-1 block"
          >
            📲 {o.contacto_tel}
          </a>
        )}
      </div>
    </div>
  );
}

function BusquedaCard({ b }: { b: Busqueda }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex gap-4 items-start hover:border-slate-600 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-blue-900/50 border border-blue-700/50 flex items-center justify-center flex-shrink-0">
        <span className="text-blue-400 text-xs font-bold">BQ</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-2 items-center mb-1">
          <span className="font-semibold text-white text-sm">{b.tipo || "—"} · {b.zona || "—"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800">
            {b.modalidad}
          </span>
        </div>
        <p className="text-blue-400 font-bold text-sm mb-1">{b.presupuesto_texto || "—"}</p>
        <p className="text-slate-400 text-xs mb-2 line-clamp-2">{b.requisitos || ""}</p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          {b.habitaciones_min && <span>🛏 {b.habitaciones_min}+ hab</span>}
          <span>📌 {b.grupo_nombre}</span>
          <span>🕐 {b.fecha} {b.hora}</span>
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        {b.contacto_nombre && (
          <p className="text-xs text-white font-semibold">{b.contacto_nombre}</p>
        )}
        {b.contacto_tel && (
          <a
            href={`https://wa.me/${b.contacto_tel.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 mt-1 block"
          >
            📲 {b.contacto_tel}
          </a>
        )}
      </div>
    </div>
  );
}
