"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { AGENTS, formatDate, getLabel } from "@/lib/constants";
import { HiCheckCircle, HiClock, HiExclamation, HiPlus, HiTrash, HiX } from "react-icons/hi";

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
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
  { value: "ALTA", label: "Alta", color: "bg-red-100 text-red-700" },
  { value: "MEDIA", label: "Media", color: "bg-amber-100 text-amber-700" },
  { value: "BAJA", label: "Baja", color: "bg-gray-100 text-gray-600" },
];

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

function getDueDateStatus(dueDate: string | null, completed: boolean | number) {
  if (completed) return null;
  if (!dueDate) return null;
  const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "Vencida", class: "text-red-600", icon: "!" };
  if (days === 0) return { label: "Hoy", class: "text-red-500", icon: "!" };
  if (days <= 2) return { label: `${days}d`, class: "text-amber-600", icon: "!" };
  return { label: `${days}d`, class: "text-gray-400", icon: null };
}

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"pending" | "completed" | "all">("pending");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", dueDate: "", priority: "MEDIA", assignedAgent: "", clientId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()).catch(() => []),
      fetch("/api/clients").then((r) => r.json()).catch(() => []),
    ]).then(([t, c]) => {
      setTasks(Array.isArray(t) ? t : []);
      setClients(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dueDate: form.dueDate || null, assignedAgent: form.assignedAgent || null, clientId: form.clientId || null, description: form.description || null }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [{ ...newTask, client: clients.find((c) => c.id === form.clientId) ? { firstName: clients.find((c) => c.id === form.clientId)!.firstName, lastName: clients.find((c) => c.id === form.clientId)!.lastName } : null, deal: null }, ...prev]);
        setShowForm(false);
        setForm({ title: "", description: "", dueDate: "", priority: "MEDIA", assignedAgent: "", clientId: "" });
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

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return !!t.completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const overdueCount = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;

  return (
    <div>
      <PageHeader title="Tareas y Seguimientos" subtitle={`${pendingCount} pendientes${overdueCount > 0 ? ` · ${overdueCount} vencidas` : ""}`}>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 py-2.5 rounded-xl font-medium transition-all">
          {showForm ? <HiX className="w-4 h-4" /> : <HiPlus className="w-4 h-4" />}
          {showForm ? "Cancelar" : "Nueva Tarea"}
        </button>
      </PageHeader>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">Nueva Tarea</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div className="sm:col-span-2 md:col-span-3">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Título *</label>
              <input required className={inputClass} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Ej: Llamar al cliente para seguimiento..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha límite</label>
              <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Prioridad</label>
              <select className={inputClass} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Agente</label>
              <select className={inputClass} value={form.assignedAgent} onChange={(e) => setForm((p) => ({ ...p, assignedAgent: e.target.value }))}>
                <option value="">Sin asignar</option>
                {AGENTS.filter((a) => a.value !== "AMBOS").map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Cliente</label>
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
          <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? "Guardando..." : "Crear Tarea"}
          </button>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {([["pending", "Pendientes"], ["completed", "Completadas"], ["all", "Todas"]] as const).map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${filter === val ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            {label}
            {val === "pending" && pendingCount > 0 && <span className="ml-1.5 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <HiCheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
          <p className="text-gray-400">{filter === "pending" ? "¡Sin tareas pendientes!" : "No hay tareas aquí"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const dueDateStatus = getDueDateStatus(task.dueDate, task.completed);
            const priorityInfo = PRIORITIES.find((p) => p.value === task.priority);
            return (
              <div key={task.id} className={`flex items-start gap-4 bg-white rounded-2xl border p-4 transition-all ${task.completed ? "opacity-60 border-gray-100" : "border-gray-100 hover:border-blue-100 hover:shadow-sm"}`}>
                <button onClick={() => toggleComplete(task)} className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-green-400"}`}>
                  {task.completed && <HiCheckCircle className="w-4 h-4 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${task.completed ? "line-through text-gray-400" : "text-gray-900"}`}>{task.title}</p>
                    {priorityInfo && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityInfo.color}`}>{priorityInfo.label}</span>}
                    {task.assignedAgent && <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{getLabel(AGENTS, task.assignedAgent)}</span>}
                  </div>
                  {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {task.client && <span className="text-xs text-gray-400">👤 {task.client.firstName} {task.client.lastName}</span>}
                    {task.deal?.property?.title && <span className="text-xs text-gray-400">🏠 {task.deal.property.title}</span>}
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 text-xs font-medium ${dueDateStatus?.class || "text-gray-400"}`}>
                        {dueDateStatus?.icon && <HiExclamation className="w-3 h-3" />}
                        <HiClock className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                        {dueDateStatus && ` (${dueDateStatus.label})`}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
