"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import {
  HiSpeakerphone, HiCheckCircle, HiXCircle, HiClock, HiRefresh,
  HiSearch, HiHome, HiChat,
} from "react-icons/hi";

interface Grupo {
  id: string;
  nombre: string;
  mensajes: number;
  ultimo_ms: number;
  tipo: "oferta" | "busqueda" | "mixto";
  clasificado: boolean;
}

interface ResultadoEnvio {
  grupo_id: string;
  grupo_nombre: string;
  ok: boolean;
  error?: string | null;
}

interface Envio {
  id: number;
  agente: string;
  tipo: string;
  texto: string;
  grupos_total: number;
  grupos_ok: number;
  estado: string;
  created_at: string;
  resultados: ResultadoEnvio[];
}

const TIPO_LABEL: Record<string, string> = {
  oferta: "Ofertas",
  busqueda: "Búsquedas",
  mixto: "Mixto",
};

const TIPO_STYLE: Record<string, string> = {
  oferta: "bg-purple-100 text-purple-700 border-purple-200",
  busqueda: "bg-blue-100 text-blue-700 border-blue-200",
  mixto: "bg-gray-100 text-gray-600 border-gray-200",
};

function diasDesde(ms: number): string {
  if (!ms) return "—";
  const d = Math.floor((Date.now() - ms) / 86400000);
  if (d <= 0) return "hoy";
  if (d === 1) return "ayer";
  return `hace ${d}d`;
}

export default function PublicarPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modo, setModo] = useState<"oferta" | "busqueda">("oferta");
  const [texto, setTexto] = useState("");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [historial, setHistorial] = useState<Envio[]>([]);

  async function cargarGrupos() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/grupos-lista?dias=60");
      const d = await r.json();
      if (d.error) { setError(d.error); setGrupos([]); }
      else setGrupos(Array.isArray(d.grupos) ? d.grupos : []);
    } catch {
      setError("No se pudo conectar al bot");
    } finally {
      setLoading(false);
    }
  }

  async function cargarHistorial() {
    try {
      const r = await fetch("/api/grupos-enviar");
      const d = await r.json();
      setHistorial(Array.isArray(d.envios) ? d.envios : []);
    } catch { /* silencioso */ }
  }

  useEffect(() => { cargarGrupos(); cargarHistorial(); }, []);

  // Al cambiar de modo se limpia la selección: un grupo de ofertas no sirve
  // para publicar una búsqueda y viceversa.
  useEffect(() => { setSeleccion(new Set()); }, [modo]);

  // Poll del avance mientras el envío corre en el bot
  useEffect(() => {
    if (!envio || envio.estado !== "enviando") return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/grupos-enviar?id=${envio.id}`);
        const d = await r.json();
        if (d && !d.error) {
          setEnvio(d);
          if (d.estado !== "enviando") {
            setEnviando(false);
            cargarHistorial();
            toast.success(`Publicado en ${d.grupos_ok} de ${d.grupos_total} grupos`);
          }
        }
      } catch { /* reintenta en el próximo tick */ }
    }, 3000);
    return () => clearInterval(t);
  }, [envio]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return grupos
      .filter((g) => g.tipo === modo || g.tipo === "mixto")
      .filter((g) => !q || g.nombre.toLowerCase().includes(q));
  }, [grupos, modo, busqueda]);

  async function cambiarTipo(g: Grupo, tipo: Grupo["tipo"]) {
    setGrupos((prev) => prev.map((x) => (x.id === g.id ? { ...x, tipo, clasificado: true } : x)));
    setSeleccion((prev) => { const n = new Set(prev); n.delete(g.id); return n; });
    try {
      await fetch("/api/grupos-lista", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: g.id, nombre: g.nombre, tipo }),
      });
    } catch { toast.error("No se pudo guardar la categoría"); }
  }

  function toggle(id: string) {
    setSeleccion((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function publicar() {
    if (!texto.trim()) { toast.error("Escribe el mensaje"); return; }
    if (seleccion.size === 0) { toast.error("Selecciona al menos un grupo"); return; }

    const elegidos = grupos.filter((g) => seleccion.has(g.id));
    const ok = confirm(
      `Vas a publicar en ${elegidos.length} grupo(s) desde el WhatsApp de la oficina:\n\n` +
      elegidos.map((g) => `· ${g.nombre}`).join("\n") +
      `\n\n¿Confirmas?`
    );
    if (!ok) return;

    setEnviando(true);
    setEnvio(null);
    try {
      const r = await fetch("/api/grupos-enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: texto.trim(),
          tipo: modo,
          grupos: elegidos.map((g) => ({ id: g.id, nombre: g.nombre })),
        }),
      });
      const d = await r.json();
      if (!r.ok || d.error) {
        toast.error(d.error || "Error al enviar");
        setEnviando(false);
        return;
      }
      toast.success(`Enviando a ${d.grupos_total} grupos…`);
      setEnvio({
        id: d.envio_id, agente: "", tipo: modo, texto: texto.trim(),
        grupos_total: d.grupos_total, grupos_ok: 0,
        estado: "enviando", created_at: "", resultados: [],
      });
      setSeleccion(new Set());
      setTexto("");
    } catch {
      toast.error("No se pudo conectar al bot");
      setEnviando(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  }

  return (
    <div>
      <PageHeader title="Publicar en Grupos" subtitle="Envía una oferta o búsqueda a los grupos de WhatsApp">
        <button onClick={() => { cargarGrupos(); cargarHistorial(); }} className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <HiRefresh className="w-4 h-4" /> Actualizar
        </button>
      </PageHeader>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">{error}</div>
      )}

      {/* Aviso: sale del WhatsApp de la oficina */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <HiChat className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Los mensajes salen del <strong>WhatsApp de la oficina</strong>, no del tuyo. Se envían de a uno
          con pausa entre grupos. Publica solo en grupos que acepten el tipo de mensaje — publicar mal te saca del grupo.
        </p>
      </div>

      {/* Envío en curso */}
      {envio && (
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 border-l-4 border-l-blue-500 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              {envio.estado === "enviando"
                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" /> Enviando…</>
                : <><HiCheckCircle className="w-5 h-5 text-green-500" /> Envío terminado</>}
            </h2>
            <span className="text-sm font-bold text-gray-700">{envio.grupos_ok} / {envio.grupos_total}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${envio.grupos_total ? (envio.grupos_ok / envio.grupos_total) * 100 : 0}%` }} />
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {envio.resultados.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {r.ok ? <HiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      : <HiXCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                <span className="text-gray-700 truncate">{r.grupo_nombre}</span>
                {!r.ok && r.error && <span className="text-red-500 truncate">· {r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Redacción */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">1 · Escribe el mensaje</h2>

          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-4">
            {([
              { id: "oferta", label: "Ofrezco una propiedad", icon: HiHome },
              { id: "busqueda", label: "Busco para un cliente", icon: HiSearch },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setModo(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  modo === t.id ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>

          <textarea
            className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={10}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={modo === "oferta"
              ? "🏢 Se alquila apartamento en Costa del Este\n📍 PH ...\n💰 $1,800/mes\n✔️ 2 rec · 2 baños · 110 m²\n\nEdgar Pringle · PN5016\n+507 ..."
              : "🔍 Busco para cliente:\nApartamento en alquiler, Costa del Este o San Francisco\n💰 Hasta $2,000/mes\n✔️ 2-3 recámaras, amoblado\n\nEdgar Pringle · PN5016\n+507 ..."}
          />
          <p className="text-xs text-gray-400 mt-2">{texto.length} caracteres</p>

          <button
            onClick={publicar}
            disabled={enviando || seleccion.size === 0 || !texto.trim()}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <HiSpeakerphone className="w-5 h-5" />
            {enviando ? "Enviando…" : `Publicar en ${seleccion.size} grupo${seleccion.size === 1 ? "" : "s"}`}
          </button>
        </div>

        {/* Grupos */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">2 · Elige los grupos</h2>
            <div className="flex gap-2">
              <button onClick={() => setSeleccion(new Set(visibles.map((g) => g.id)))}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800">Todos</button>
              <span className="text-gray-300">·</span>
              <button onClick={() => setSeleccion(new Set())}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700">Ninguno</button>
            </div>
          </div>

          <input
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar grupo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <p className="text-xs text-gray-400 mb-3">
            Mostrando grupos de <strong>{modo === "oferta" ? "ofertas" : "búsquedas"}</strong> y mixtos.
            Cambia la categoría de un grupo si está mal clasificado.
          </p>

          {visibles.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay grupos para este tipo</p>
          ) : (
            <div className="space-y-1.5 max-h-[28rem] overflow-y-auto pr-1">
              {visibles.map((g) => {
                const activo = seleccion.has(g.id);
                return (
                  <div key={g.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      activo ? "bg-blue-50 border-blue-200" : "border-gray-100 hover:bg-gray-50"
                    }`}>
                    <input type="checkbox" checked={activo} onChange={() => toggle(g.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(g.id)}>
                      <p className="text-sm font-semibold text-gray-900 truncate">{g.nombre}</p>
                      <p className="text-[11px] text-gray-400">
                        {g.mensajes} mensajes · {diasDesde(g.ultimo_ms)}
                        {!g.clasificado && <span className="ml-1 text-amber-500">· categoría sugerida</span>}
                      </p>
                    </div>
                    <select
                      value={g.tipo}
                      onChange={(e) => cambiarTipo(g, e.target.value as Grupo["tipo"])}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer flex-shrink-0 ${TIPO_STYLE[g.tipo]}`}
                    >
                      <option value="oferta">Ofertas</option>
                      <option value="busqueda">Búsquedas</option>
                      <option value="mixto">Mixto</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Historial */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Publicaciones recientes</h2>
        {historial.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Todavía no se ha publicado nada</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {historial.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  e.estado === "enviando" ? "bg-blue-100" : e.grupos_ok === e.grupos_total ? "bg-green-100" : "bg-amber-100"
                }`}>
                  {e.estado === "enviando"
                    ? <HiClock className="w-5 h-5 text-blue-600" />
                    : <HiCheckCircle className={`w-5 h-5 ${e.grupos_ok === e.grupos_total ? "text-green-600" : "text-amber-600"}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-2">{e.texto}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {e.created_at} · {e.agente} · <span className={`font-semibold ${TIPO_STYLE[e.tipo]?.split(" ")[1] || ""}`}>{TIPO_LABEL[e.tipo] || e.tipo}</span>
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-600 flex-shrink-0">{e.grupos_ok}/{e.grupos_total}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
