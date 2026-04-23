"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { formatCurrency, AGENTS, getLabel } from "@/lib/constants";
import { HiPlus, HiSearch, HiPhone, HiPencil, HiTrash } from "react-icons/hi";

interface Busqueda {
  id: string;
  nombre: string;
  telefono: string | null;
  telefono2: string | null;
  email: string | null;
  modalidad: string;
  tipoPropiedad: string | null;
  presupuestoMin: number | null;
  presupuestoMax: number | null;
  currency: string;
  habitacionesMin: number | null;
  zonas: string | null;
  amoblado: string | null;
  requisitos: string | null;
  assignedAgent: string | null;
  status: string;
  createdAt: string;
}

const MODALIDAD_LABEL: Record<string, string> = {
  COMPRA: "Compra",
  ALQUILER: "Alquiler",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVO: "bg-green-100 text-green-800",
  PAUSADO: "bg-yellow-100 text-yellow-800",
  CERRADO: "bg-gray-100 text-gray-600",
};

function parseZonas(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export default function BusquedasPage() {
  const [items, setItems] = useState<Busqueda[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterModalidad, setFilterModalidad] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterModalidad) params.set("modalidad", filterModalidad);
    const data = await fetch(`/api/busquedas?${params}`).then((r) => r.json()).catch(() => []);
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, filterStatus, filterModalidad]); // eslint-disable-line

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar búsqueda de "${nombre}"?`)) return;
    await fetch(`/api/busquedas/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Búsquedas"
        subtitle="Clientes buscando propiedades"
      >
        <Link href="/busquedas/nuevo" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <HiPlus className="w-4 h-4" /> Nueva Búsqueda
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar por nombre, zona, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          value={filterModalidad}
          onChange={(e) => setFilterModalidad(e.target.value)}
        >
          <option value="">Todas las modalidades</option>
          <option value="COMPRA">Compra</option>
          <option value="ALQUILER">Alquiler</option>
        </select>
        <select
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="PAUSADO">Pausado</option>
          <option value="CERRADO">Cerrado</option>
        </select>
      </div>

      {/* Stats strip */}
      <div className="flex gap-4 mb-6">
        {[
          { label: "Total", count: items.length, color: "text-gray-700" },
          { label: "Activos", count: items.filter((i) => i.status === "ACTIVO").length, color: "text-green-700" },
          { label: "Compra", count: items.filter((i) => i.modalidad === "COMPRA").length, color: "text-blue-700" },
          { label: "Alquiler", count: items.filter((i) => i.modalidad === "ALQUILER").length, color: "text-purple-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl px-4 py-2.5 border border-gray-100 shadow-sm text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <HiSearch className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay búsquedas registradas</p>
          <Link href="/busquedas/nuevo" className="mt-3 inline-block text-blue-600 text-sm font-semibold hover:underline">
            Agregar primera búsqueda
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => {
            const zonas = parseZonas(b.zonas);
            const presupuesto = b.presupuestoMax
              ? `${formatCurrency(b.presupuestoMin ?? 0, b.currency)} – ${formatCurrency(b.presupuestoMax, b.currency)}`
              : b.presupuestoMin
              ? `Desde ${formatCurrency(b.presupuestoMin, b.currency)}`
              : null;

            return (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4 items-start hover:border-blue-200 transition-colors">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  b.modalidad === "COMPRA" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                }`}>
                  {b.nombre.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/busquedas/${b.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {b.nombre}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.modalidad === "COMPRA" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {MODALIDAD_LABEL[b.modalidad] ?? b.modalidad}
                    </span>
                    {b.tipoPropiedad && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {b.tipoPropiedad}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                    {presupuesto && <span className="font-semibold text-gray-700">{presupuesto}</span>}
                    {b.habitacionesMin && <span>{b.habitacionesMin}+ hab</span>}
                    {b.assignedAgent && <span className="text-slate-400">{getLabel(AGENTS, b.assignedAgent)}</span>}
                  </div>

                  {/* Zonas */}
                  {zonas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {zonas.map((z) => (
                        <span key={z} className="text-[10px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                          📍 {z}
                        </span>
                      ))}
                    </div>
                  )}

                  {b.requisitos && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{b.requisitos}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {b.telefono && (
                    <a
                      href={`https://wa.me/${b.telefono.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                      title="WhatsApp"
                    >
                      <HiPhone className="w-4 h-4" />
                    </a>
                  )}
                  <Link
                    href={`/busquedas/${b.id}/editar`}
                    className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
                    title="Editar"
                  >
                    <HiPencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(b.id, b.nombre)}
                    className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                    title="Eliminar"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
