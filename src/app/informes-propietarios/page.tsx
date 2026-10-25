"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import { formatCurrency } from "@/lib/constants";
import { HiChat, HiClipboardCopy, HiDocumentReport } from "react-icons/hi";

interface Item {
  id: string; title: string; status: string; zone: string; operationType: string; price: number | null; currency: string;
  ownerName: string | null; ownerPhone: string | null; reportAt: string | null; agent: string | null; listedAt: string;
  views: number; viewsPrev: number; whatsapp: number; leads: number; visits: number;
}

const RANGES = [30, 60, 90];
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-PA", { day: "numeric", month: "short", timeZone: "America/Panama" }) : null);
const waPhone = (p: string | null) => { const d = (p || "").replace(/\D/g, ""); return d.length === 8 ? `507${d}` : d; };
const sentThisMonth = (iso: string | null) => !!iso && iso.slice(0, 7) === new Date().toISOString().slice(0, 7);

function reportText(i: Item, days: number): string {
  const first = (i.ownerName || "").split(" ")[0];
  const trend = i.viewsPrev ? Math.round(((i.views - i.viewsPrev) / i.viewsPrev) * 100) : null;
  const lines = [
    `Hola${first ? ` ${first}` : ""}, le comparto el informe de los últimos ${days} días de su propiedad *${i.title}*:`,
    "",
    `👀 ${i.views} visitas a la ficha en panamainmo.com${trend != null ? ` (${trend >= 0 ? "+" : ""}${trend}% vs. el período anterior)` : ""}`,
    `💬 ${i.whatsapp} consultas por WhatsApp`,
    `📩 ${i.leads} solicitudes de información`,
    `🏠 ${i.visits} visitas presenciales`,
    "",
    `Ficha publicada: https://panamainmo.com/p/${i.id}`,
    "",
    i.views + i.whatsapp + i.leads === 0
      ? "Le sugiero que conversemos sobre el precio o nuevas fotos para aumentar el interés."
      : "Seguimos promocionándola en la web, en la red MLS y con nuestra base de clientes. Cualquier novedad le aviso.",
    "",
    "Saludos, PanamaInmo",
  ];
  return lines.join("\n");
}

export default function InformesPropietariosPage() {
  const [days, setDays] = useState(30);
  const [items, setItems] = useState<Item[] | null>(null);

  const load = () => fetch(`/api/owner-reports?days=${days}`).then((r) => r.json()).then((d) => setItems(Array.isArray(d?.items) ? d.items : [])).catch(() => setItems([]));
  useEffect(() => { load(); }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markSent(id: string) {
    await fetch("/api/owner-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId: id }) });
    load();
  }
  function send(i: Item) {
    window.open(`https://wa.me/${waPhone(i.ownerPhone)}?text=${encodeURIComponent(reportText(i, days))}`, "_blank", "noopener");
    markSent(i.id);
  }
  async function copy(i: Item) {
    await navigator.clipboard.writeText(reportText(i, days)).catch(() => {});
    toast.success("Informe copiado");
  }

  const pending = (items || []).filter((i) => !sentThisMonth(i.reportAt)).length;
  return (
    <div>
      <PageHeader title="Informes para propietarios" subtitle={`Interés que generó cada propiedad en la web. ${pending ? `${pending} sin informe este mes.` : "Todos enviados este mes."}`}>
        <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)} className={`px-3 py-1.5 text-sm rounded-md ${days === r ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"}`}>{r} días</button>
          ))}
        </div>
      </PageHeader>

      {items === null ? <p className="text-sm text-gray-500">Cargando…</p> : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
          <HiDocumentReport className="w-10 h-10 mx-auto mb-3 text-gray-300" />No hay propiedades propias disponibles.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Propiedad</th>
                <th className="px-3 py-3 font-medium text-right">Visitas web</th>
                <th className="px-3 py-3 font-medium text-right">WhatsApp</th>
                <th className="px-3 py-3 font-medium text-right">Formularios</th>
                <th className="px-3 py-3 font-medium text-right">Visitas</th>
                <th className="px-4 py-3 font-medium">Propietario</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((i) => {
                const trend = i.viewsPrev ? Math.round(((i.views - i.viewsPrev) / i.viewsPrev) * 100) : null;
                return (
                  <tr key={i.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/propiedades/${i.id}`} className="font-medium text-gray-900 hover:text-blue-700">{i.title}</Link>
                      <p className="text-xs text-gray-400">{i.zone}{i.price ? ` · ${formatCurrency(i.price, i.currency)}` : ""}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      <span className="font-semibold text-gray-900">{i.views}</span>
                      {trend != null && <span className={`block text-[11px] ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%</span>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{i.whatsapp}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{i.leads}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{i.visits}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{i.ownerName || <span className="text-gray-400">Sin propietario</span>}</p>
                      <p className="text-xs text-gray-400">{sentThisMonth(i.reportAt) ? `✓ Enviado ${fmtDate(i.reportAt)}` : i.reportAt ? `Último: ${fmtDate(i.reportAt)}` : "Nunca enviado"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => copy(i)} className="p-2 text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg" title="Copiar informe"><HiClipboardCopy /></button>
                        {i.ownerPhone ? (
                          <button onClick={() => send(i)} className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg ${sentThisMonth(i.reportAt) ? "bg-gray-100 text-gray-600" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
                            <HiChat /> Enviar
                          </button>
                        ) : <span className="text-xs text-gray-400 self-center">Falta teléfono</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3">Las visitas web excluyen bots y a quienes navegan con sesión del CRM. Las visitas presenciales salen de la agenda de Visitas.</p>
    </div>
  );
}
