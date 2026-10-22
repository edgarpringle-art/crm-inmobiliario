"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { PROPERTY_TYPES, formatCurrency, getLabel } from "@/lib/constants";
import { HiRefresh, HiExternalLink, HiClipboardCopy, HiSearch, HiLocationMarker, HiPlus, HiTrash } from "react-icons/hi";

interface MlsItem {
  id: string; mlsId: string; url: string; title: string; propertyType: string; operationType: string;
  salePrice: number | null; rentPrice: number | null; currency: string;
  area: number | null; landArea: number | null; bedrooms: number | null; bathrooms: number | null;
  sector: string | null; city: string | null; photo: string | null;
}

interface ListResponse { items: MlsItem[]; total: number; page: number; limit: number; active: number; lastSync: string | null }

const SITE = "https://panamainmo.com";

function waText(p: MlsItem) {
  const price = p.salePrice != null ? formatCurrency(p.salePrice, p.currency) : p.rentPrice != null ? `${formatCurrency(p.rentPrice, p.currency)}/mes` : "";
  const specs = [p.bedrooms != null && `${p.bedrooms} rec`, p.bathrooms != null && `${p.bathrooms} baños`, (p.area ?? p.landArea) != null && `${p.area ?? p.landArea} m²`].filter(Boolean).join(" | ");
  return `🏢 ${p.title}\n📍 ${[p.sector, p.city].filter(Boolean).join(", ")}\n💰 ${price}${specs ? `\n✔️ ${specs}` : ""}\n\nVer fotos y detalles:\n${SITE}/p/${p.id}`;
}

export default function InventarioMlsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [op, setOp] = useState("");
  const [page, setPage] = useState(1);
  const [sync, setSync] = useState<{ running: boolean; msg: string }>({ running: false, msg: "" });
  const [copied, setCopied] = useState("");
  const stopRef = useRef(false);
  const [links, setLinks] = useState("");
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState<{ ok: boolean; text: string }[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; added: number; skipped: number; failed: number } | null>(null);
  const [fileCodes, setFileCodes] = useState<string[]>([]);
  const [fileHints, setFileHints] = useState<Record<string, { barrio: string; area: string }>>({});
  const [fileName, setFileName] = useState("");
  const [prune, setPrune] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (q.trim()) params.set("q", q.trim());
    if (type) params.set("type", type);
    if (op) params.set("op", op);
    try {
      const res = await fetch(`/api/mls?${params}`);
      setData(res.ok ? await res.json() : null);
    } catch { setData(null); }
    setLoading(false);
  }, [q, type, op, page]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  async function runSync() {
    stopRef.current = false;
    setSync({ running: true, msg: "Revisando propiedades publicadas..." });
    let checked = 0, hidden = 0;
    try {
      for (let round = 0; round < 30 && !stopRef.current; round++) {
        const res = await fetch("/api/mls/sync", { method: "POST" });
        const r = await res.json();
        if (!res.ok) throw new Error(r.error || "Error");
        checked += r.checked; hidden += r.hidden;
        setSync({ running: true, msg: `Revisadas ${checked} · faltan ${r.remaining}` });
        if (r.remaining === 0) { setSync({ running: false, msg: `Listo: ${checked} revisadas, ${hidden} retiradas del MLS, ${r.active} publicadas` }); break; }
      }
      if (stopRef.current) setSync({ running: false, msg: `Pausado. ${checked} revisadas.` });
    } catch (e) {
      setSync({ running: false, msg: `Error: ${e instanceof Error ? e.message : "no se pudo revisar"}` });
    }
    load();
  }

  // Imports in batches of 25 with live progress. Only failures are listed (bulk imports can be 1,000+).
  async function importUrls(urls: string[], { skipExisting = false, pruneCodes = [] as string[], hints = {} as Record<string, { barrio: string; area: string }> } = {}) {
    stopRef.current = false;
    setImporting(true); setImportLog([]);
    const log: { ok: boolean; text: string }[] = [];
    const prog = { done: 0, total: urls.length, added: 0, skipped: 0, failed: 0 };
    setProgress({ ...prog });
    for (let i = 0; i < urls.length && !stopRef.current; i += 25) {
      const batch = urls.slice(i, i + 25);
      try {
        const res = await fetch("/api/mls/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: batch, skipExisting, hints: Object.fromEntries(batch.map((u) => u.split("/").pop()!).filter((c) => hints[c]).map((c) => [c, hints[c]])) }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error");
        for (const r of data.results as { ok: boolean; skipped?: boolean; title?: string; error?: string; input: string }[]) {
          if (r.skipped) prog.skipped++;
          else if (r.ok) { prog.added++; if (urls.length <= 25) log.push({ ok: true, text: `✓ ${r.title}` }); }
          else { prog.failed++; log.push({ ok: false, text: `✗ ${r.error} — ${r.input.slice(0, 90)}` }); }
        }
      } catch (e) {
        prog.failed += batch.length;
        log.push({ ok: false, text: `✗ ${e instanceof Error ? e.message : "Error"} (lote de ${batch.length})` });
      }
      prog.done = Math.min(urls.length, i + batch.length);
      setProgress({ ...prog }); setImportLog([...log]);
    }
    if (pruneCodes.length && !stopRef.current) {
      try {
        const res = await fetch("/api/mls/prune", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codes: pruneCodes }) });
        const data = await res.json();
        log.push(res.ok ? { ok: true, text: `Se ocultaron ${data.hidden} propiedades que ya no están en el MLS` } : { ok: false, text: `✗ ${data.error}` });
        setImportLog([...log]);
      } catch { /* ignore */ }
    }
    setImporting(false);
    setPage(1); load();
    return prog;
  }

  async function runImport() {
    const urls = links.split(/\s+/).map((x) => x.trim()).filter((x) => x.startsWith("http"));
    if (!urls.length) { setImportLog([{ ok: false, text: "Pega al menos un enlace de propiedades.mlsacobir.com" }]); return; }
    const prog = await importUrls(urls);
    if (prog.added > 0) setLinks("");
  }

  // Reads a saved Xposure "Resultados de búsqueda" page: every row carries data-xpid="<code>".
  async function onFile(file: File | undefined) {
    setFileCodes([]); setFileName("");
    if (!file) return;
    const html = await file.text();
    const codes = [...new Set([...html.matchAll(/data-xpid="([a-z0-9]+)"/gi)].map((m) => m[1].toLowerCase()))];
    // Each result row: … tools cell, photo cell, building, address, neighborhood (barrio), area …
    const hints: Record<string, { barrio: string; area: string }> = {};
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("tr").forEach((tr) => {
      const tools = tr.querySelector(".xposure-tools[data-xpid]");
      if (!tools) return;
      const tds = [...tr.children];
      const i = tds.findIndex((td) => td.contains(tools));
      const barrio = tds[i + 4]?.textContent?.trim() || "";
      const area = tds[i + 5]?.textContent?.trim() || "";
      if (barrio) hints[(tools.getAttribute("data-xpid") || "").toLowerCase()] = { barrio, area };
    });
    setFileName(file.name);
    setFileHints(hints);
    setFileCodes(codes);
    setPrune(codes.length >= 200);
    if (!codes.length) setImportLog([{ ok: false, text: "No encontré propiedades en ese archivo. Debe ser la página de resultados de búsqueda de Xposure guardada como HTML." }]);
  }

  async function runFileImport() {
    if (!fileCodes.length) return;
    if (prune && !confirm("Se ocultarán de tu web las propiedades del MLS que no estén en este archivo. Úsalo solo si la búsqueda es de TODO el inventario. ¿Continuar?")) return;
    const urls = fileCodes.map((c) => `https://propiedades.mlsacobir.com/listing/p/p/${c}`);
    await importUrls(urls, { skipExisting: true, pruneCodes: prune ? fileCodes : [], hints: fileHints });
    setFileCodes([]); setFileName("");
  }

  async function remove(p: MlsItem) {
    if (!confirm(`¿Quitar "${p.title}" de tu web?`)) return;
    await fetch(`/api/mls/${p.id}`, { method: "DELETE" }).catch(() => null);
    load();
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(""), 1500); });
  }

  const pages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div>
      <PageHeader title="Inventario MLS ACOBIR" subtitle="Propiedades del MLS que publicas en panamainmo.com, mezcladas con las tuyas y con tus datos">
        {sync.running ? (
          <button onClick={() => { stopRef.current = true; }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium">Pausar</button>
        ) : (
          <button onClick={runSync} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium">
            <HiRefresh className="w-4 h-4" /> Revisar disponibilidad
          </button>
        )}
      </PageHeader>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <p className="font-semibold text-gray-900 mb-1">Agregar propiedades del MLS</p>
        <p className="text-xs text-gray-500 mb-3">Pega uno o varios enlaces de Xposure (los que envías a clientes, <span className="font-mono">propiedades.mlsacobir.com/listing/...</span>), uno por línea.</p>
        <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={4}
          placeholder={"https://propiedades.mlsacobir.com/listing/...\nhttps://propiedades.mlsacobir.com/listing/..."}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
        <div className="flex items-center gap-3 mt-3">
          <button onClick={runImport} disabled={importing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <HiPlus className="w-4 h-4" /> {importing ? "Importando..." : "Publicar en mi web"}
          </button>
        </div>
        <div className="border-t border-gray-100 mt-5 pt-5">
          <p className="font-semibold text-gray-900 mb-1">Importar muchas a la vez (archivo de búsqueda)</p>
          <p className="text-xs text-gray-500 mb-3">
            En Xposure, con tu sesión, haz la búsqueda en el MLS → clic derecho → <b>Guardar como…</b> → “Página web completa”, y sube aquí el archivo <span className="font-mono">.html</span>.
            Solo se importan las nuevas; las que ya están se saltan.
          </p>
          <input type="file" accept=".html,.htm,text/html" disabled={importing}
            onChange={(e) => onFile(e.target.files?.[0])}
            className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-800 file:font-medium hover:file:bg-gray-200" />
          {fileCodes.length > 0 && (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-gray-800"><b>{fileCodes.length}</b> propiedades encontradas en <span className="font-mono text-xs">{fileName}</span></p>
              <label className="flex items-start gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={prune} onChange={(e) => setPrune(e.target.checked)} className="mt-0.5" />
                <span>Ocultar de mi web las propiedades del MLS que <b>no</b> estén en este archivo (vendidas o retiradas). Úsalo solo si la búsqueda es de <b>todo</b> el inventario.</span>
              </label>
              <button onClick={runFileImport} disabled={importing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <HiPlus className="w-4 h-4" /> Importar {fileCodes.length} propiedades
              </button>
            </div>
          )}
        </div>

        {progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{importing ? "Importando..." : "Terminado"} {progress.done} de {progress.total} · nuevas {progress.added} · ya estaban {progress.skipped} · con error {progress.failed}</span>
              {importing && <button onClick={() => { stopRef.current = true; }} className="text-gray-500 hover:text-gray-800 underline">Pausar</button>}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            {importing && <p className="text-[11px] text-gray-400 mt-1">Deja esta página abierta hasta que termine (unos 10 minutos para 1,000 propiedades).</p>}
          </div>
        )}

        {importLog.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs max-h-40 overflow-auto">
            {importLog.map((l, i) => <li key={i} className={l.ok ? "text-emerald-700" : "text-red-600"}>{l.text}</li>)}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Publicadas en tu web</p>
          <p className="text-2xl font-bold text-gray-900">{data?.active ?? "—"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Última revisión</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {data?.lastSync ? new Date(data.lastSync).toLocaleString("es-PA", { timeZone: "America/Panama", dateStyle: "medium", timeStyle: "short" }) : "Nunca"}
          </p>
        </div>
        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500">Disponibilidad</p>
          <p className="text-sm text-gray-800 mt-1">{sync.msg || "Se revisan solas cada día a las 4:00 a. m. y se ocultan las que salgan del MLS."}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="md:col-span-2 relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Buscar por nombre, PH, sector o # MLS..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg text-sm px-3 py-2">
          <option value="">Todos los tipos</option>
          {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={op} onChange={(e) => { setOp(e.target.value); setPage(1); }} className="border border-gray-200 rounded-lg text-sm px-3 py-2">
          <option value="">Venta y alquiler</option>
          <option value="VENTA">Venta</option>
          <option value="ALQUILER">Alquiler</option>
        </select>
      </div>

      {loading && !data ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : !data || data.items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="font-semibold text-gray-900 mb-1">{data?.active ? "Sin resultados" : "Aún no has publicado propiedades del MLS"}</p>
          <p className="text-sm text-gray-500">{data?.active ? "Prueba con otra búsqueda." : "Pega arriba los enlaces de Xposure de las propiedades que quieres mostrar en tu web."}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-3">{data.total} resultados</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.items.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="relative h-40 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.photo && <img src={p.photo} alt={p.title} loading="lazy" className="w-full h-full object-cover" />}
                  <span className="absolute top-2 left-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded">MLS #{p.mlsId}</span>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400">{getLabel(PROPERTY_TYPES, p.propertyType)} · {p.operationType === "VENTA_Y_ALQUILER" ? "Venta / Alquiler" : p.operationType === "ALQUILER" ? "Alquiler" : "Venta"}</p>
                  <p className="font-semibold text-gray-900 leading-snug line-clamp-2">{p.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><HiLocationMarker />{[p.sector, p.city].filter(Boolean).join(", ")}</p>
                  <p className="text-sm font-bold text-gray-900 mt-2">
                    {p.salePrice != null && formatCurrency(p.salePrice, p.currency)}
                    {p.salePrice != null && p.rentPrice != null && " · "}
                    {p.rentPrice != null && `${formatCurrency(p.rentPrice, p.currency)}/mes`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {[p.bedrooms != null && `${p.bedrooms} rec`, p.bathrooms != null && `${p.bathrooms} baños`, (p.area ?? p.landArea) != null && `${p.area ?? p.landArea} m²`].filter(Boolean).join(" · ")}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-auto pt-4">
                    <a href={`https://wa.me/?text=${encodeURIComponent(waText(p))}`} target="_blank" rel="noopener noreferrer"
                      className="text-center bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg py-2">WhatsApp</a>
                    <button onClick={() => copy(`${SITE}/p/${p.id}`, p.id)}
                      className="flex items-center justify-center gap-1 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-lg py-2">
                      <HiClipboardCopy /> {copied === p.id ? "¡Copiado!" : "Enlace"}
                    </button>
                    <a href={`/p/${p.id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-lg py-2">
                      <HiExternalLink /> Ver
                    </a>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-400 hover:text-gray-600">Ficha en Xposure (con tus datos) ↗</a>
                    <button onClick={() => remove(p)} className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700"><HiTrash /> Quitar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Anterior</button>
              <span className="text-sm text-gray-600">Página {page} de {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
