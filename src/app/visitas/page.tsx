"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import { AGENTS } from "@/lib/constants";
import { HiCalendar, HiChat, HiPlus, HiTrash, HiX } from "react-icons/hi";

interface Visit {
  id: string; clientId: string | null; propertyId: string | null; propertyLabel: string | null; address: string | null;
  date: string; time: string | null; agent: string | null; status: string; notes: string | null; feedback: string | null;
  reminderSentAt: string | null; clientFirstName: string | null; clientLastName: string | null; clientPhone: string | null;
}
interface Opt { id: string; label: string; address?: string | null; phone?: string | null }

const STATUSES = [
  { value: "PROGRAMADA", label: "Programada", color: "bg-blue-100 text-blue-800" },
  { value: "CONFIRMADA", label: "Confirmada", color: "bg-emerald-100 text-emerald-800" },
  { value: "REALIZADA", label: "Realizada", color: "bg-purple-100 text-purple-800" },
  { value: "CANCELADA", label: "Cancelada", color: "bg-gray-100 text-gray-600" },
];

const ymd = (offset = 0) => new Date(Date.now() + offset * 86_400_000).toLocaleDateString("en-CA", { timeZone: "America/Panama" });
const dayLabel = (d: string) => {
  if (d === ymd()) return "Hoy";
  if (d === ymd(1)) return "Mañana";
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString("es-PA", { weekday: "long", day: "numeric", month: "long" });
};
const time12 = (t: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "a. m." : "p. m."}`;
};
const agentName = (code: string | null) => AGENTS.find((a) => a.value === (code || "").toUpperCase())?.label || code || "";
const waPhone = (p: string | null) => { const d = (p || "").replace(/\D/g, ""); return d.length === 8 ? `507${d}` : d; };

function calendarUrl(v: Visit): string {
  const params = new URLSearchParams({
    action: "TEMPLATE", ctz: "America/Panama",
    text: `Visita: ${v.propertyLabel || "propiedad"}${v.clientFirstName ? ` con ${v.clientFirstName} ${v.clientLastName || ""}` : ""}`,
    details: [v.clientPhone && `Tel. cliente: ${v.clientPhone}`, v.notes].filter(Boolean).join("\n"),
    location: v.address || v.propertyLabel || "",
  });
  if (v.time) {
    const start = new Date(`${v.date}T${v.time}:00-05:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    params.set("dates", `${f(start)}/${f(end)}`);
  } else {
    const [y, m, d] = v.date.split("-").map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10).replace(/-/g, "");
    params.set("dates", `${v.date.replace(/-/g, "")}/${next}`);
  }
  return `https://calendar.google.com/calendar/render?${params}`;
}

function reminderText(v: Visit): string {
  const when = v.date === ymd() ? "hoy" : v.date === ymd(1) ? "mañana" : dayLabel(v.date);
  return `Hola ${v.clientFirstName || ""}, te recuerdo nuestra visita ${when}${v.time ? ` a las ${time12(v.time)}` : ""} a ${v.propertyLabel || "la propiedad"}${v.address ? ` (${v.address})` : ""}. ¿Me confirmas tu asistencia? Saludos, ${agentName(v.agent)} · PanamaInmo`;
}

const emptyForm = { clientId: "", propertyId: "", propertyLabel: "", address: "", date: ymd(1), time: "10:00", agent: "", notes: "" };

export default function VisitasPage() {
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [past, setPast] = useState(false);
  const [clients, setClients] = useState<Opt[]>([]);
  const [props, setProps] = useState<Opt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    const q = past ? `?to=${ymd(-1)}` : `?from=${ymd()}`;
    fetch(`/api/visitas${q}`).then((r) => r.json()).then((d) => setVisits(Array.isArray(d) ? (past ? d.reverse() : d) : [])).catch(() => setVisits([]));
  };
  useEffect(load, [past]);

  useEffect(() => {
    if (!showForm || clients.length) return;
    fetch("/api/clients").then((r) => r.json()).then((d) => Array.isArray(d) && setClients(
      d.map((c: Record<string, string>) => ({ id: c.id, label: `${c.firstName} ${c.lastName || ""}`.trim(), phone: c.phone }))
        .sort((a: Opt, b: Opt) => a.label.localeCompare(b.label, "es"))
    )).catch(() => {});
    fetch("/api/properties").then((r) => r.json()).then((d) => Array.isArray(d) && setProps(
      d.filter((p: Record<string, string>) => p.status === "DISPONIBLE" || p.status === "RESERVADO")
        .map((p: Record<string, string>) => ({ id: p.id, label: p.title, address: [p.address, p.sector, p.city].filter(Boolean).join(", ") }))
    )).catch(() => {});
  }, [showForm, clients.length]);

  const groups = useMemo(() => {
    const m = new Map<string, Visit[]>();
    for (const v of visits || []) m.set(v.date, [...(m.get(v.date) || []), v]);
    return [...m.entries()];
  }, [visits]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId && !form.propertyLabel) return toast.error("Elige el cliente o la propiedad");
    setSaving(true);
    const res = await fetch("/api/visitas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!res.ok) return toast.error((await res.json().catch(() => ({}))).error || "No se pudo guardar");
    toast.success("Visita agendada");
    setForm(emptyForm); setShowForm(false); load();
  }

  async function patch(id: string, data: Partial<Visit>) {
    const res = await fetch(`/api/visitas/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) return toast.error("No se pudo actualizar");
    load();
  }

  async function del(id: string) {
    if (!confirm("¿Eliminar esta visita?")) return;
    await fetch(`/api/visitas/${id}`, { method: "DELETE" });
    load();
  }

  function remind(v: Visit) {
    window.open(`https://wa.me/${waPhone(v.clientPhone)}?text=${encodeURIComponent(reminderText(v))}`, "_blank", "noopener");
    patch(v.id, { reminderSentAt: new Date().toISOString() });
  }

  const input = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div>
      <PageHeader title="Visitas" subtitle="Agenda de visitas a propiedades con recordatorio por WhatsApp">
        <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 text-sm">
          <button onClick={() => setPast(false)} className={`px-3 py-1.5 rounded-md ${!past ? "bg-blue-600 text-white" : "text-gray-600"}`}>Próximas</button>
          <button onClick={() => setPast(true)} className={`px-3 py-1.5 rounded-md ${past ? "bg-blue-600 text-white" : "text-gray-600"}`}>Pasadas</button>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {showForm ? <HiX /> : <HiPlus />} {showForm ? "Cerrar" : "Agendar visita"}
        </button>
      </PageHeader>

      {showForm && (
        <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs text-gray-500 sm:col-span-2">Cliente
            <select className={input} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">— Elegir cliente —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.label}{c.phone ? ` · ${c.phone}` : ""}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-500 sm:col-span-2">Propiedad del inventario
            <select className={input} value={form.propertyId} onChange={(e) => {
              const p = props.find((x) => x.id === e.target.value);
              setForm({ ...form, propertyId: e.target.value, propertyLabel: p?.label || form.propertyLabel, address: p?.address || form.address });
            }}>
              <option value="">— Otra / MLS (escribir abajo) —</option>
              {props.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-500 sm:col-span-2">Propiedad (nombre)
            <input className={input} value={form.propertyLabel} onChange={(e) => setForm({ ...form, propertyLabel: e.target.value })} placeholder="Ej: PH Atrium apto 12B" />
          </label>
          <label className="text-xs text-gray-500 sm:col-span-2">Dirección / punto de encuentro
            <input className={input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle 53, Obarrio" />
          </label>
          <label className="text-xs text-gray-500">Fecha
            <input type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </label>
          <label className="text-xs text-gray-500">Hora
            <input type="time" className={input} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </label>
          <label className="text-xs text-gray-500">Agente
            <select className={input} value={form.agent} onChange={(e) => setForm({ ...form, agent: e.target.value })}>
              <option value="">Yo</option>
              {AGENTS.filter((a) => a.value !== "AMBOS").map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-500">Notas
            <input className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Llaves en conserjería…" />
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg disabled:opacity-60">{saving ? "Guardando…" : "Guardar visita"}</button>
          </div>
        </form>
      )}

      {visits === null ? <p className="text-sm text-gray-500">Cargando…</p> : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
          <HiCalendar className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          {past ? "No hay visitas pasadas." : "No hay visitas agendadas. Usa “Agendar visita”."}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, list]) => (
            <div key={date}>
              <p className={`text-sm font-semibold mb-2 capitalize ${date === ymd() ? "text-blue-700" : "text-gray-700"}`}>{dayLabel(date)}</p>
              <div className="space-y-2">
                {list.map((v) => {
                  const st = STATUSES.find((s) => s.value === v.status) || STATUSES[0];
                  const open = v.status === "PROGRAMADA" || v.status === "CONFIRMADA";
                  return (
                    <div key={v.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="w-20 shrink-0 text-lg font-bold text-gray-900">{time12(v.time) || "—"}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {v.propertyId ? <Link href={`/propiedades/${v.propertyId}`} className="hover:text-blue-700">{v.propertyLabel}</Link> : v.propertyLabel || "Propiedad"}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {v.clientId ? <Link href={`/clientes/${v.clientId}`} className="hover:text-blue-700">{v.clientFirstName} {v.clientLastName}</Link> : "Sin cliente"}
                          {v.address ? ` · ${v.address}` : ""} · {agentName(v.agent)}
                        </p>
                        {v.notes && <p className="text-xs text-gray-400 mt-0.5">{v.notes}</p>}
                        {!open && (
                          <input defaultValue={v.feedback || ""} placeholder="¿Qué le pareció al cliente?" onBlur={(e) => e.target.value !== (v.feedback || "") && patch(v.id, { feedback: e.target.value })}
                            className="mt-2 w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select value={v.status} onChange={(e) => patch(v.id, { status: e.target.value })} className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 ${st.color}`}>
                          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {open && v.clientPhone && (
                          <button onClick={() => remind(v)} title={v.reminderSentAt ? "Recordatorio ya enviado" : "Enviar recordatorio"}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg ${v.reminderSentAt ? "bg-gray-100 text-gray-500" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}>
                            <HiChat /> {v.reminderSentAt ? "Recordado" : "Recordar"}
                          </button>
                        )}
                        <a href={calendarUrl(v)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                          <HiCalendar /> Calendar
                        </a>
                        <button onClick={() => del(v.id)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label="Eliminar"><HiTrash /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
