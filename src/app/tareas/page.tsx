"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { AGENTS, formatDate, getLabel } from "@/lib/constants";
import {
  HiCheckCircle, HiClock, HiExclamation, HiPlus, HiTrash, HiX, HiCalendar, HiPencil,
  HiFire, HiSearch, HiChevronDown, HiChevronUp, HiSparkles, HiUser,
} from "react-icons/hi";

const AGENT_EMAILS: Record<string, string> = {
  EDGAR: "edgarpringle@gmail.com",
  ANA_LORENA: "alchanis@gmail.com",
  VALENTINA: "valentina.velasquez777@gmail.com",
};

function parseAgents(assignedAgent: string | null): string[] {
  if (!assignedAgent) return [];
  return assignedAgent.split(",").map((s) => s.trim()).filter(Boolean);
}

function buildCalendarUrl(task: Task): string {
  const dateStr = task.dueDate ? task.dueDate.replace(/-/g, "") : "";

  let dates = "";
  if (task.dueDate && task.dueTime) {
    const [h, m] = task.dueTime.split(":").map(Number);
    const start = new Date(`${task.dueDate}T${task.dueTime}:00-05:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    dates = `${fmt(start)}/${fmt(end)}`;
    void h; void m;
  } else if (task.dueDate) {
    const nextDay = new Date(new Date(task.dueDate).getTime() + 86400000).toISOString().split("T")[0].replace(/-/g, "");
    dates = `${dateStr}/${nextDay}`;
  }

  const assignedAgents = parseAgents(task.assignedAgent);
  const agentNames = assignedAgents.map((a) => getLabel(AGENTS, a)).join(", ");

  const details = [
    task.description || "",
    task.client ? `Cliente: ${task.client.firstName} ${task.client.lastName}` : "",
    agentNames ? `Responsables: ${agentNames}` : "",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: task.title,
    dates,
    details,
    ctz: "America/Panama",
  });

  for (const agent of assignedAgents) {
    const email = AGENT_EMAILS[agent];
    if (email) params.append("add", email);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  dueTime: string | null;
  priority: string;
  completed: boolean | number;
  assignedAgent: string | null;
  clientId: string | null;
  dealId: string | null;
  createdAt: string;
  client: { firstName: string; lastName: string } | null;
  deal: { property: { title: string } | null } | null;
}

const PRIORITIES = [
  { value: "ALTA", label: "Alta", color: "bg-red-100 text-red-700 border-red-200", stripe: "bg-red-500", dot: "bg-red-500" },
  { value: "MEDIA", label: "Media", color: "bg-amber-100 text-amber-700 border-amber-200", stripe: "bg-amber-400", dot: "bg-amber-400" },
  { value: "BAJA", label: "Baja", color: "bg-gray-100 text-gray-600 border-gray-200", stripe: "bg-gray-300", dot: "bg-gray-300" },
];

const AGENT_CHIP_COLORS: Record<string, string> = {
  EDGAR: "bg-blue-100 text-blue-700 border-blue-200",
  ANA_LORENA: "bg-purple-100 text-purple-700 border-purple-200",
  VALENTINA: "bg-pink-100 text-pink-700 border-pink-200",
};

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const EMPTY_FORM = {
  title: "", description: "", dueDate: "", dueTime: "",
  priority: "MEDIA", assignedAgents: [] as string[], clientId: "",
};

// ── Date helpers ──────────────────────────────────────────────────────────────
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function daysFromToday(dueDate: string): number {
  const due = parseLocalDate(dueDate);
  const today = startOfToday();
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function addDaysISO(dueDate: string | null, days: number): string {
  const base = dueDate ? parseLocalDate(dueDate) : startOfToday();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

// Smart bucket: Vencidas / Hoy / Mañana / Esta semana / Más tarde / Sin fecha
type Bucket = "vencidas" | "hoy" | "manana" | "semana" | "tarde" | "sinfecha";

function bucketize(task: Task): Bucket {
  if (!task.dueDate) return "sinfecha";
  const d = daysFromToday(task.dueDate);
  if (d < 0) return "vencidas";
  if (d === 0) return "hoy";
  if (d === 1) return "manana";
  if (d <= 7) return "semana";
  return "tarde";
}

const BUCKET_META: Record<Bucket, { title: string; icon: typeof HiFire; tint: string; ring: string; barColor: string }> = {
  vencidas: { title: "Vencidas",     icon: HiFire,        tint: "text-red-700",     ring: "ring-red-200",     barColor: "bg-red-500" },
  hoy:      { title: "Hoy",          icon: HiExclamation, tint: "text-amber-700",   ring: "ring-amber-200",   barColor: "bg-amber-400" },
  manana:   { title: "Mañana",       icon: HiClock,       tint: "text-orange-700",  ring: "ring-orange-200",  barColor: "bg-orange-400" },
  semana:   { title: "Esta semana",  icon: HiCalendar,    tint: "text-blue-700",    ring: "ring-blue-200",    barColor: "bg-blue-500" },
  tarde:    { title: "Más tarde",    icon: HiSparkles,    tint: "text-indigo-700",  ring: "ring-indigo-200",  barColor: "bg-indigo-400" },
  sinfecha: { title: "Sin fecha",    icon: HiClock,       tint: "text-gray-600",    ring: "ring-gray-200",    barColor: "bg-gray-300" },
};

const BUCKET_ORDER: Bucket[] = ["vencidas", "hoy", "manana", "semana", "tarde", "sinfecha"];

// ── Component ─────────────────────────────────────────────────────────────────
export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()).catch(() => []),
      fetch("/api/clients").then((r) => r.json()).catch(() => []),
    ]).then(([t, c]) => {
      setTasks(Array.isArray(t) ? t : []);
      setClients(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(task: Task) {
    setEditingId(task.id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate || "",
      dueTime: task.dueTime || "",
      priority: task.priority || "MEDIA",
      assignedAgents: parseAgents(task.assignedAgent),
      clientId: task.clientId || "",
    });
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleAgent(agentCode: string) {
    setForm((p) => ({
      ...p,
      assignedAgents: p.assignedAgents.includes(agentCode)
        ? p.assignedAgents.filter((a) => a !== agentCode)
        : [...p.assignedAgents, agentCode],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        dueDate: form.dueDate || null,
        dueTime: form.dueTime || null,
        priority: form.priority,
        assignedAgent: form.assignedAgents.length ? form.assignedAgents.join(",") : null,
        clientId: form.clientId || null,
      };

      if (editingId) {
        const res = await fetch(`/api/tasks/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          const clientObj = clients.find((c) => c.id === form.clientId);
          setTasks((prev) => prev.map((t) => t.id === editingId
            ? { ...t, ...updated, client: clientObj ? { firstName: clientObj.firstName, lastName: clientObj.lastName } : null }
            : t));
          setShowForm(false); resetForm();
        }
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newTask = await res.json();
          const clientObj = clients.find((c) => c.id === form.clientId);
          setTasks((prev) => [
            { ...newTask, client: clientObj ? { firstName: clientObj.firstName, lastName: clientObj.lastName } : null, deal: null },
            ...prev,
          ]);
          setShowForm(false); resetForm();
        }
      }
    } finally { setSaving(false); }
  }

  async function toggleComplete(task: Task) {
    const completed = !task.completed;
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: completed ? 1 : 0 }),
    });
    if (res.ok) setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed } : t));
  }

  async function snooze(task: Task, days: number) {
    const newDate = addDaysISO(task.dueDate, days);
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: newDate }),
    });
    if (res.ok) setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, dueDate: newDate } : t));
  }

  async function deleteTask(id: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  // ── Filtering ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tasks.filter((t) => {
      if (q) {
        const fields = [
          t.title, t.description,
          t.client ? `${t.client.firstName} ${t.client.lastName}` : "",
          t.deal?.property?.title || "",
        ].join(" ").toLowerCase();
        if (!fields.includes(q)) return false;
      }
      if (priorityFilter.length && !priorityFilter.includes(t.priority)) return false;
      if (agentFilter.length) {
        const taskAgents = parseAgents(t.assignedAgent);
        if (!agentFilter.some((a) => taskAgents.includes(a))) return false;
      }
      return true;
    });
  }, [tasks, search, priorityFilter, agentFilter]);

  // ── Stats ──
  const stats = useMemo(() => {
    const out = { overdue: 0, today: 0, week: 0, completedThisWeek: 0 };
    const today = startOfToday();
    for (const t of tasks) {
      if (t.completed) {
        // Approx "completed this week" — use updatedAt? Use createdAt fallback
        // We don't track completedAt, so use createdAt as a soft proxy.
        const d = new Date(t.createdAt);
        if (today.getTime() - d.getTime() <= 7 * 86400000) out.completedThisWeek++;
        continue;
      }
      if (!t.dueDate) continue;
      const diff = daysFromToday(t.dueDate);
      if (diff < 0) out.overdue++;
      else if (diff === 0) out.today++;
      else if (diff <= 7) out.week++;
    }
    return out;
  }, [tasks]);

  // ── Bucketing ──
  const pending = filtered.filter((t) => !t.completed);
  const completed = filtered.filter((t) => !!t.completed);

  const buckets = useMemo(() => {
    const groups: Record<Bucket, Task[]> = {
      vencidas: [], hoy: [], manana: [], semana: [], tarde: [], sinfecha: [],
    };
    for (const t of pending) {
      groups[bucketize(t)].push(t);
    }
    // Sort: priority ALTA first, then by due date (and time)
    const prioWeight: Record<string, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };
    for (const k of Object.keys(groups) as Bucket[]) {
      groups[k].sort((a, b) => {
        const pa = prioWeight[a.priority] ?? 1;
        const pb = prioWeight[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        // Date asc
        if (a.dueDate && b.dueDate) {
          const cmp = a.dueDate.localeCompare(b.dueDate);
          if (cmp !== 0) return cmp;
          if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
        }
        return 0;
      });
    }
    return groups;
  }, [pending]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  const selectableAgents = AGENTS.filter((a) => a.value !== "AMBOS");

  return (
    <div>
      <PageHeader
        title="Tareas y Seguimientos"
        subtitle={`${pending.length} pendiente${pending.length !== 1 ? "s" : ""}${stats.overdue ? ` · ${stats.overdue} vencida${stats.overdue !== 1 ? "s" : ""}` : ""}`}
      >
        <button
          onClick={() => { if (showForm) { resetForm(); setShowForm(false); } else { openCreateForm(); } }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200"
        >
          {showForm ? <HiX className="w-4 h-4" /> : <HiPlus className="w-4 h-4" />}
          {showForm ? "Cancelar" : "Nueva Tarea"}
        </button>
      </PageHeader>

      {/* ─── Stats dashboard ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Vencidas" value={stats.overdue} icon={HiFire} accent="from-red-500 to-rose-600" tint="text-red-700" bg="bg-red-50" border="border-red-100" />
        <StatCard label="Hoy" value={stats.today} icon={HiExclamation} accent="from-amber-400 to-orange-500" tint="text-amber-700" bg="bg-amber-50" border="border-amber-100" />
        <StatCard label="Esta semana" value={stats.week} icon={HiCalendar} accent="from-blue-500 to-indigo-600" tint="text-blue-700" bg="bg-blue-50" border="border-blue-100" />
        <StatCard label="Completadas (7d)" value={stats.completedThisWeek} icon={HiCheckCircle} accent="from-emerald-500 to-green-600" tint="text-emerald-700" bg="bg-emerald-50" border="border-emerald-100" />
      </div>

      {/* ─── Form ─── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            {editingId ? <><HiPencil className="w-4 h-4 text-blue-500" /> Editar Tarea</> : <><HiPlus className="w-4 h-4 text-blue-500" /> Nueva Tarea</>}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="sm:col-span-2 md:col-span-3">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Título *</label>
              <input required className={inputClass} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ej: Llamar al cliente para seguimiento..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha límite</label>
              <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Hora</label>
              <input type="time" className={inputClass} value={form.dueTime} onChange={(e) => setForm((p) => ({ ...p, dueTime: e.target.value }))} disabled={!form.dueDate} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Prioridad</label>
              <select className={inputClass} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Cliente vinculado</label>
              <select className={inputClass} value={form.clientId} onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}>
                <option value="">Sin vincular</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Notas</label>
              <input className={inputClass} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Detalles adicionales..." />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 mb-2 block">Asignar a (puedes seleccionar varios)</label>
            <div className="flex flex-wrap gap-2">
              {selectableAgents.map((a) => {
                const selected = form.assignedAgents.includes(a.value);
                const color = AGENT_CHIP_COLORS[a.value] || "bg-gray-100 text-gray-700 border-gray-200";
                return (
                  <button
                    type="button" key={a.value}
                    onClick={() => toggleAgent(a.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      selected ? `${color} border-current` : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {selected && <span className="mr-1">✓</span>}{a.label}
                  </button>
                );
              })}
              {form.assignedAgents.length === 0 && (
                <span className="text-xs text-gray-400 italic self-center">Sin asignar</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
              {saving ? "Guardando..." : editingId ? "Actualizar Tarea" : "Crear Tarea"}
            </button>
            {editingId && (
              <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-5 py-2 rounded-xl text-sm font-medium">
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {/* ─── Search + filters ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 space-y-3">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text" placeholder="Buscar por título, notas, cliente o propiedad..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-400 font-semibold uppercase tracking-wider">Prioridad:</span>
            {PRIORITIES.map((p) => {
              const selected = priorityFilter.includes(p.value);
              return (
                <button
                  key={p.value}
                  onClick={() => setPriorityFilter((prev) => selected ? prev.filter((x) => x !== p.value) : [...prev, p.value])}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                    selected ? p.color : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${p.dot} mr-1.5 align-middle`} />
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-gray-400 font-semibold uppercase tracking-wider">Agente:</span>
            {selectableAgents.map((a) => {
              const selected = agentFilter.includes(a.value);
              const color = AGENT_CHIP_COLORS[a.value] || "bg-gray-100 text-gray-700 border-gray-200";
              return (
                <button
                  key={a.value}
                  onClick={() => setAgentFilter((prev) => selected ? prev.filter((x) => x !== a.value) : [...prev, a.value])}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                    selected ? color : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {a.initials || a.label.charAt(0)}
                </button>
              );
            })}
          </div>

          {(priorityFilter.length > 0 || agentFilter.length > 0 || search) && (
            <button
              onClick={() => { setPriorityFilter([]); setAgentFilter([]); setSearch(""); }}
              className="text-red-500 hover:text-red-700 font-medium ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ─── Buckets ─── */}
      {pending.length === 0 && completed.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
            <HiCheckCircle className="w-9 h-9 text-emerald-500" />
          </div>
          <p className="text-gray-600 font-semibold mb-1">¡Sin tareas pendientes!</p>
          <p className="text-xs text-gray-400">Cuando crees nuevas tareas aparecerán organizadas por fecha aquí.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {BUCKET_ORDER.map((bk) => {
            const items = buckets[bk];
            if (items.length === 0) return null;
            const meta = BUCKET_META[bk];
            const Icon = meta.icon;
            return (
              <section key={bk}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Icon className={`w-4 h-4 ${meta.tint}`} />
                  <h3 className={`text-sm font-bold ${meta.tint} uppercase tracking-wider`}>{meta.title}</h3>
                  <span className="text-[10px] font-bold bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((task) => (
                    <TaskCard
                      key={task.id} task={task} bucket={bk}
                      onToggle={() => toggleComplete(task)}
                      onSnooze={(days) => snooze(task, days)}
                      onEdit={() => openEditForm(task)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* Completed (collapsible) */}
          {completed.length > 0 && (
            <section>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center gap-2 mb-2 px-1 group"
              >
                <HiCheckCircle className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wider">Completadas</h3>
                <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">
                  {completed.length}
                </span>
                <span className="ml-auto text-gray-400 group-hover:text-gray-700 transition-colors">
                  {showCompleted ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                </span>
              </button>
              {showCompleted && (
                <div className="space-y-2">
                  {completed.map((task) => (
                    <TaskCard
                      key={task.id} task={task} bucket="sinfecha"
                      onToggle={() => toggleComplete(task)}
                      onSnooze={(days) => snooze(task, days)}
                      onEdit={() => openEditForm(task)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──
function StatCard({
  label, value, icon: Icon, accent, tint, bg, border,
}: {
  label: string; value: number; icon: typeof HiFire; accent: string;
  tint: string; bg: string; border: string;
}) {
  return (
    <div className={`${bg} rounded-2xl p-4 border ${border} relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${tint}`}>{label}</p>
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${tint} leading-tight`}>{value}</p>
    </div>
  );
}

// ── Task Card ──
function TaskCard({
  task, bucket, onToggle, onSnooze, onEdit, onDelete,
}: {
  task: Task;
  bucket: Bucket;
  onToggle: () => void;
  onSnooze: (days: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const priorityInfo = PRIORITIES.find((p) => p.value === task.priority);
  const taskAgents = parseAgents(task.assignedAgent);
  const hasCalendarAgents = taskAgents.some((a) => AGENT_EMAILS[a]);
  const dueRel = task.dueDate ? daysFromToday(task.dueDate) : null;

  let datePill: { label: string; class: string } | null = null;
  if (!task.completed && task.dueDate) {
    if (dueRel! < 0) datePill = { label: `Hace ${Math.abs(dueRel!)}d`, class: "bg-red-100 text-red-700 border-red-200" };
    else if (dueRel === 0) datePill = { label: task.dueTime ? task.dueTime : "Hoy", class: "bg-amber-100 text-amber-700 border-amber-200" };
    else if (dueRel === 1) datePill = { label: "Mañana", class: "bg-orange-100 text-orange-700 border-orange-200" };
    else if (dueRel! <= 7) datePill = { label: `En ${dueRel}d`, class: "bg-blue-100 text-blue-700 border-blue-200" };
    else datePill = { label: formatDate(task.dueDate), class: "bg-gray-100 text-gray-600 border-gray-200" };
  }

  return (
    <div className={`group flex items-stretch bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all overflow-hidden ${task.completed ? "opacity-60" : ""}`}>
      {/* Priority stripe */}
      <div className={`w-1 ${priorityInfo?.stripe || "bg-gray-200"} flex-shrink-0`} />

      <div className="flex-1 flex items-start gap-3 p-4">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.completed
              ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200"
              : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
          }`}
        >
          {task.completed && <HiCheckCircle className="w-4 h-4 text-white" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <p className={`font-semibold text-sm leading-snug ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
              {task.title}
            </p>
            {priorityInfo && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityInfo.color} flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} />
                {priorityInfo.label}
              </span>
            )}
            {datePill && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${datePill.class} flex items-center gap-1`}>
                <HiClock className="w-3 h-3" />
                {datePill.label}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {taskAgents.map((ag) => {
              const color = AGENT_CHIP_COLORS[ag] || "bg-indigo-50 text-indigo-600 border-indigo-100";
              return (
                <span key={ag} className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full flex items-center gap-1 ${color}`}>
                  <HiUser className="w-2.5 h-2.5" /> {getLabel(AGENTS, ag)}
                </span>
              );
            })}
            {task.client && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                👤 {task.client.firstName} {task.client.lastName}
              </span>
            )}
            {task.deal?.property?.title && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                🏠 {task.deal.property.title}
              </span>
            )}
            {task.dueDate && task.dueTime && bucket === "hoy" && (
              <span className="text-xs text-gray-400">⏰ {task.dueTime}</span>
            )}
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {!task.completed && task.dueDate && (
            <>
              <button onClick={() => onSnooze(1)} title="Posponer 1 día"
                className="text-[10px] font-semibold text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                +1d
              </button>
              <button onClick={() => onSnooze(7)} title="Posponer 1 semana"
                className="text-[10px] font-semibold text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                +1sem
              </button>
            </>
          )}
          {!task.completed && task.dueDate && hasCalendarAgents && (
            <a
              href={buildCalendarUrl(task)} target="_blank" rel="noopener noreferrer"
              title={`Agregar al calendario`}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <HiCalendar className="w-4 h-4" />
            </a>
          )}
          <button onClick={onEdit} title="Editar"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <HiPencil className="w-4 h-4" />
          </button>
          <button onClick={onDelete} title="Eliminar"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
