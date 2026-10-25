"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import { formatCurrency } from "@/lib/constants";
import { HiBell, HiExternalLink } from "react-icons/hi";

interface AlertMatch { id: string; title: string; price: number | null; zone: string; source: "own" | "mls"; createdAt: string }
interface AlertRow {
  id: string; firstName: string; lastName: string | null; phone: string | null; email: string | null;
  alert: { op: string; type: string | null; zones: string[]; max: number | null; beds: number | null; lang?: string };
  since: string; sentAt: string | null; active: boolean; newMatches: AlertMatch[]; totalNew: number;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-PA", { day: "numeric", month: "short", timeZone: "America/Panama" }) : "—");
const summary = (a: AlertRow["alert"]) => [
  a.op === "ALQUILER" ? "Alquilar" : "Comprar", a.type?.toLowerCase(),
  a.zones.length ? a.zones.join(", ") : "cualquier zona",
  a.max ? `hasta ${formatCurrency(a.max, "USD")}` : null, a.beds ? `${a.beds}+ rec.` : null,
].filter(Boolean).join(" · ");

function waMessage(r: AlertRow): string {
  const en = r.alert.lang === "en";
  const base = en ? "https://panamainmo.com/en/p/" : "https://panamainmo.com/p/";
  const lines = r.newMatches.slice(0, 6).map((m) => `• ${m.title}${m.price ? ` — ${formatCurrency(m.price, "USD")}` : ""}\n${base}${m.id}`);
  return en
    ? `Hi ${r.firstName}! New properties matching your search on PanamaInmo:\n\n${lines.join("\n\n")}\n\nWould you like to schedule a visit?`
    : `¡Hola ${r.firstName}! Entraron propiedades que coinciden con tu búsqueda en PanamaInmo:\n\n${lines.join("\n\n")}\n\n¿Te gustaría coordinar una visita?`;
}

export default function AlertasWebPage() {
  const [rows, setRows] = useState<AlertRow[] | null>(null);
  const [onlyNew, setOnlyNew] = useState(true);

  const load = () => fetch("/api/web-alerts").then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  async function act(id: string, action: "sent" | "off" | "on") {
    const res = await fetch("/api/web-alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    if (!res.ok) return toast.error("No se pudo actualizar");
    if (action !== "sent") toast.success(action === "on" ? "Alerta activada" : "Alerta pausada");
    load();
  }

  function send(r: AlertRow) {
    const phone = (r.phone || "").replace(/\D/g, "");
    const full = phone.length === 8 ? `507${phone}` : phone;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(waMessage(r))}`, "_blank", "noopener");
    act(r.id, "sent");
    toast.success("Coincidencias marcadas como enviadas");
  }

  const list = (rows || []).filter((r) => !onlyNew || (r.active && r.totalNew > 0));
  const pending = (rows || []).filter((r) => r.active && r.totalNew > 0).length;

  return (
    <div>
      <PageHeader title="Alertas web" subtitle="Clientes que pidieron aviso desde panamainmo.com y las propiedades nuevas que les encajan">
        <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 text-sm">
          <button onClick={() => setOnlyNew(true)} className={`px-3 py-1.5 rounded-md ${onlyNew ? "bg-blue-600 text-white" : "text-gray-600"}`}>Con novedades ({pending})</button>
          <button onClick={() => setOnlyNew(false)} className={`px-3 py-1.5 rounded-md ${!onlyNew ? "bg-blue-600 text-white" : "text-gray-600"}`}>Todas ({rows?.length ?? 0})</button>
        </div>
      </PageHeader>

      {rows === null ? <p className="text-sm text-gray-500">Cargando…</p> : list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
          <HiBell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          {onlyNew ? "No hay propiedades nuevas para ninguna alerta. Cuando entre una que encaje, aparece aquí." : "Todavía nadie creó una alerta en la web."}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((r) => (
            <div key={r.id} className={`bg-white rounded-2xl border p-5 ${r.active ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/clientes/${r.id}`} className="font-semibold text-gray-900 hover:text-blue-700">{r.firstName} {r.lastName}</Link>
                  <p className="text-sm text-gray-600 mt-0.5">{summary(r.alert)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {r.phone || "sin teléfono"} · alerta desde {fmt(r.since)} · último envío {fmt(r.sentAt)}{r.alert.lang === "en" ? " · 🇺🇸 inglés" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.active && r.totalNew > 0 && r.phone && (
                    <button onClick={() => send(r)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                      Enviar {Math.min(6, r.totalNew)} por WhatsApp
                    </button>
                  )}
                  {r.active && r.totalNew > 0 && (
                    <button onClick={() => act(r.id, "sent")} className="text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">Marcar vistas</button>
                  )}
                  <button onClick={() => act(r.id, r.active ? "off" : "on")} className="text-sm text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
                    {r.active ? "Pausar" : "Reactivar"}
                  </button>
                </div>
              </div>
              {r.totalNew > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">{r.totalNew} propiedad{r.totalNew !== 1 ? "es" : ""} nueva{r.totalNew !== 1 ? "s" : ""} que encaja{r.totalNew !== 1 ? "n" : ""}</p>
                  <ul className="divide-y divide-gray-50">
                    {r.newMatches.map((m) => (
                      <li key={m.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0">
                          <span className="text-gray-900">{m.title}</span>
                          <span className="text-gray-400"> · {m.zone}{m.source === "mls" ? " · MLS" : ""}</span>
                        </span>
                        <span className="flex items-center gap-3 shrink-0">
                          {m.price != null && <span className="font-medium text-gray-900">{formatCurrency(m.price, "USD")}</span>}
                          <a href={`/p/${m.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800"><HiExternalLink /></a>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
