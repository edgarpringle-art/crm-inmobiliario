"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import ZoneSelector from "@/components/ZoneSelector";
import { PROPERTY_TYPES } from "@/lib/constants";
import { HiSearch, HiX, HiAdjustments, HiChat, HiTrendingUp, HiTrendingDown } from "react-icons/hi";

interface Oferta {
  id: number;
  tipo: string;
  zona: string;
  precio: number | null;
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
  mensaje_original: string | null;
}

interface Busqueda {
  id: number;
  tipo: string;
  zona: string;
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  presupuesto_texto: string;
  modalidad: string;
  habitaciones_min: number | null;
  requisitos: string;
  contacto_nombre: string;
  contacto_tel: string;
  grupo_nombre: string;
  fecha: string;
  hora: string;
  mensaje_original: string | null;
}

type Tab = "ofertas" | "busquedas";
type Dias = 1 | 7 | 30;

// Parse "$950.00/mes", "$1,200,000", etc → 950, 1200000
function parsePrice(text: string | null | undefined): number | null {
  if (!text) return null;
  const cleaned = String(text).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function GruposPage() {
  const [tab, setTab] = useState<Tab>("ofertas");
  const [dias, setDias] = useState<Dias>(7);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [busquedas, setBusquedas] = useState<Busqueda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [modalidadFilter, setModalidadFilter] = useState<string>("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [zonasFilter, setZonasFilter] = useState<string[]>([]);
  const [precioMin, setPrecioMin] = useState<string>("");
  const [precioMax, setPrecioMax] = useState<string>("");
  const [habMin, setHabMin] = useState<string>("");
  const [habMax, setHabMax] = useState<string>("");

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

  function clearFilters() {
    setModalidadFilter("");
    setTipoFilter("");
    setZonasFilter([]);
    setPrecioMin("");
    setPrecioMax("");
    setHabMin("");
    setHabMax("");
    setBuscar("");
  }

  const activeFiltersCount = [
    modalidadFilter, tipoFilter, precioMin, precioMax, habMin, habMax,
  ].filter(Boolean).length + (zonasFilter.length > 0 ? 1 : 0);

  // ── Filter logic ──
  function matchesCommon(it: { tipo?: string; zona?: string; modalidad?: string }): boolean {
    // Modalidad
    if (modalidadFilter) {
      const m = (it.modalidad || "").toLowerCase();
      if (modalidadFilter === "VENTA" && !m.includes("venta") && !m.includes("compra")) return false;
      if (modalidadFilter === "ALQUILER" && !m.includes("alquil") && !m.includes("rent")) return false;
    }
    // Tipo (property type)
    if (tipoFilter) {
      const t = normalize(it.tipo || "");
      const target = normalize(tipoFilter);
      // Match aliases
      const aliases: Record<string, string[]> = {
        apartamento: ["apartamento", "apto", "apt"],
        casa: ["casa"],
        penthouse: ["penthouse", "ph"],
        local: ["local"],
        oficina: ["oficina"],
        terreno: ["terreno", "lote"],
        nave: ["nave", "bodega", "galera"],
        villa: ["villa"],
        proyecto: ["proyecto"],
      };
      const aliasList = aliases[target] || [target];
      if (!aliasList.some((a) => t.includes(a))) return false;
    }
    // Zones (OR)
    if (zonasFilter.length > 0) {
      const itemZone = normalize(it.zona || "");
      const matchZone = zonasFilter.some((z) => {
        const zn = normalize(z);
        return itemZone.includes(zn) || zn.includes(itemZone);
      });
      if (!matchZone) return false;
    }
    return true;
  }

  const ofertasFiltradas = useMemo(() => {
    const q = normalize(buscar.trim());
    const pMin = precioMin ? parseFloat(precioMin) : null;
    const pMax = precioMax ? parseFloat(precioMax) : null;
    const hMin = habMin ? parseInt(habMin) : null;
    const hMax = habMax ? parseInt(habMax) : null;

    return ofertas.filter((o) => {
      // Text search
      if (q) {
        const haystack = normalize([o.tipo, o.zona, o.precio_texto, o.contacto_nombre, o.grupo_nombre, o.descripcion].join(" "));
        if (!haystack.includes(q)) return false;
      }
      if (!matchesCommon(o)) return false;

      // Price
      const price = o.precio ?? parsePrice(o.precio_texto);
      if (pMin != null) {
        if (price == null || price < pMin) return false;
      }
      if (pMax != null) {
        if (price == null || price > pMax) return false;
      }

      // Habitaciones
      if (hMin != null) {
        if (o.habitaciones == null || o.habitaciones < hMin) return false;
      }
      if (hMax != null) {
        if (o.habitaciones == null || o.habitaciones > hMax) return false;
      }

      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ofertas, buscar, modalidadFilter, tipoFilter, zonasFilter, precioMin, precioMax, habMin, habMax]);

  const busquedasFiltradas = useMemo(() => {
    const q = normalize(buscar.trim());
    const pMin = precioMin ? parseFloat(precioMin) : null;
    const pMax = precioMax ? parseFloat(precioMax) : null;
    const hMin = habMin ? parseInt(habMin) : null;
    const hMax = habMax ? parseInt(habMax) : null;

    return busquedas.filter((b) => {
      if (q) {
        const haystack = normalize([b.tipo, b.zona, b.presupuesto_texto, b.contacto_nombre, b.grupo_nombre, b.requisitos].join(" "));
        if (!haystack.includes(q)) return false;
      }
      if (!matchesCommon(b)) return false;

      // Price overlap: [bMin, bMax] vs [pMin, pMax]
      const bMin = b.presupuesto_min ?? parsePrice(b.presupuesto_texto);
      const bMax = b.presupuesto_max ?? parsePrice(b.presupuesto_texto);
      if (pMin != null && bMax != null && bMax < pMin) return false;
      if (pMax != null && bMin != null && bMin > pMax) return false;

      // Habitaciones (filter by min)
      if (hMin != null) {
        if (b.habitaciones_min == null || b.habitaciones_min < hMin) return false;
      }
      if (hMax != null && b.habitaciones_min != null && b.habitaciones_min > hMax) {
        return false;
      }

      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedas, buscar, modalidadFilter, tipoFilter, zonasFilter, precioMin, precioMax, habMin, habMax]);

  const items = tab === "ofertas" ? ofertasFiltradas : busquedasFiltradas;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Mensajes de Grupos WhatsApp"
        subtitle="Ofertas y búsquedas captadas automáticamente por el bot EP Realty"
      />

      {/* Tabs + time range */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
          {(["ofertas", "busquedas"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                tab === t
                  ? t === "ofertas" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t === "ofertas" ? <HiTrendingUp className="w-4 h-4" /> : <HiTrendingDown className="w-4 h-4" />}
              {t === "ofertas" ? `Ofertas (${ofertas.length})` : `Búsquedas (${busquedas.length})`}
            </button>
          ))}
        </div>

        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white">
          {([1, 7, 30] as Dias[]).map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-2 text-sm font-semibold transition-colors ${
                dias === d ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {d === 1 ? "Hoy" : d === 7 ? "7 días" : "30 días"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
            showFilters || activeFiltersCount > 0
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <HiAdjustments className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar zona, tipo, contacto, descripción..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {buscar && (
          <button onClick={() => setBuscar("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
            <HiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Filtros avanzados</h3>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-red-500 font-medium hover:text-red-700 flex items-center gap-1">
                <HiX className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>

          {/* Modalidad pills */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Modalidad</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { v: "", l: "Todas" },
                { v: "VENTA", l: "Venta", c: "bg-blue-500" },
                { v: "ALQUILER", l: "Alquiler", c: "bg-emerald-500" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setModalidadFilter(o.v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    modalidadFilter === o.v
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {o.c && <span className={`inline-block w-2 h-2 rounded-full ${o.c} mr-1.5 align-middle`} />}
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de propiedad pills */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Tipo de propiedad</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTipoFilter("")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                  !tipoFilter ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                Todos
              </button>
              {PROPERTY_TYPES.filter((t) => t.value !== "OTRO").map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTipoFilter(tipoFilter === t.value ? "" : t.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    tipoFilter === t.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zones */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Zonas (puedes elegir varias)</label>
            <ZoneSelector value={zonasFilter} onChange={setZonasFilter} maxSelect={8} placeholder="Todas las zonas" />
          </div>

          {/* Price + bedrooms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Rango de precio (USD)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number" placeholder="Mín" value={precioMin}
                  onChange={(e) => setPrecioMin(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number" placeholder="Máx" value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Habitaciones</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number" placeholder="Mín" value={habMin}
                  onChange={(e) => setHabMin(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number" placeholder="Máx" value={habMax}
                  onChange={(e) => setHabMax(e.target.value)}
                  className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading / error */}
      {loading && <div className="text-center py-16 text-gray-500">Cargando feed...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          <p className="text-xs text-gray-500 font-medium mb-3">
            {items.length} resultado{items.length !== 1 ? "s" : ""}
            {activeFiltersCount > 0 && ` · ${activeFiltersCount} filtro${activeFiltersCount !== 1 ? "s" : ""} aplicado${activeFiltersCount !== 1 ? "s" : ""}`}
          </p>
          <div className="space-y-2">
            {items.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <HiChat className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {activeFiltersCount > 0 || buscar
                    ? "Sin resultados con estos filtros."
                    : `Sin ${tab} en este periodo.`}
                </p>
                {(activeFiltersCount > 0 || buscar) && (
                  <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline mt-2">
                    Limpiar filtros
                  </button>
                )}
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

// ── Oferta Card (light theme) ─────────────────────────────────────────────────
function OfertaCard({ o }: { o: Oferta }) {
  const [expanded, setExpanded] = useState(false);
  const isVenta = /venta|compra/i.test(o.modalidad || "");
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden flex">
      <div className="w-1 bg-emerald-500 flex-shrink-0" />
      <div className="flex-1 p-4">
        <div className="flex flex-wrap gap-2 items-start mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
            OFERTA
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            isVenta ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
          }`}>
            {o.modalidad || "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3 items-start">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{(o.tipo || "—").toUpperCase()} · {o.zona || "—"}</p>
            <p className="text-emerald-700 font-bold text-base mt-0.5">{o.precio_texto || "—"}</p>
            {o.descripcion && <p className="text-gray-600 text-xs mt-1 line-clamp-2">{o.descripcion}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {o.habitaciones != null && <span className="flex items-center gap-1">🛏 {o.habitaciones} hab</span>}
              {o.m2 != null && <span className="flex items-center gap-1">📐 {o.m2} m²</span>}
              {o.grupo_nombre && <span className="flex items-center gap-1 truncate max-w-[200px]">📌 {o.grupo_nombre}</span>}
              {o.fecha && <span className="flex items-center gap-1">🕐 {o.fecha}{o.hora ? ` ${o.hora}` : ""}</span>}
            </div>
            {o.mensaje_original && (
              <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-gray-500 hover:text-gray-900 underline mt-2">
                {expanded ? "Ocultar mensaje original" : "Ver mensaje original"}
              </button>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            {o.contacto_nombre && <p className="text-xs text-gray-900 font-bold">{o.contacto_nombre}</p>}
            {o.contacto_tel && (
              <a
                href={`https://wa.me/${o.contacto_tel.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg mt-1 font-semibold transition-colors"
              >
                📲 {o.contacto_tel}
              </a>
            )}
          </div>
        </div>
        {expanded && o.mensaje_original && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Mensaje original</p>
            <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{o.mensaje_original}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Búsqueda Card (light theme) ───────────────────────────────────────────────
function BusquedaCard({ b }: { b: Busqueda }) {
  const [expanded, setExpanded] = useState(false);
  const isCompra = /compra|venta/i.test(b.modalidad || "");
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden flex">
      <div className="w-1 bg-blue-500 flex-shrink-0" />
      <div className="flex-1 p-4">
        <div className="flex flex-wrap gap-2 items-start mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-100 text-blue-700">
            BÚSQUEDA
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            isCompra ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
          }`}>
            {b.modalidad || "—"}
          </span>
        </div>
        <div className="flex justify-between gap-3 items-start">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm">{(b.tipo || "—").toUpperCase()} · {b.zona || "—"}</p>
            <p className="text-blue-700 font-bold text-base mt-0.5">{b.presupuesto_texto || "—"}</p>
            {b.requisitos && <p className="text-gray-600 text-xs mt-1 line-clamp-2">{b.requisitos}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {b.habitaciones_min != null && <span className="flex items-center gap-1">🛏 {b.habitaciones_min}+ hab</span>}
              {b.grupo_nombre && <span className="flex items-center gap-1 truncate max-w-[200px]">📌 {b.grupo_nombre}</span>}
              {b.fecha && <span className="flex items-center gap-1">🕐 {b.fecha}{b.hora ? ` ${b.hora}` : ""}</span>}
            </div>
            {b.mensaje_original && (
              <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-gray-500 hover:text-gray-900 underline mt-2">
                {expanded ? "Ocultar mensaje original" : "Ver mensaje original"}
              </button>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            {b.contacto_nombre && <p className="text-xs text-gray-900 font-bold">{b.contacto_nombre}</p>}
            {b.contacto_tel && (
              <a
                href={`https://wa.me/${b.contacto_tel.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg mt-1 font-semibold transition-colors"
              >
                📲 {b.contacto_tel}
              </a>
            )}
          </div>
        </div>
        {expanded && b.mensaje_original && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Mensaje original</p>
            <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{b.mensaje_original}</p>
          </div>
        )}
      </div>
    </div>
  );
}
