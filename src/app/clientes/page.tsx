"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import EmptyState from "@/components/EmptyState";
import { CLIENT_TYPES, CLIENT_STATUSES, getLabel } from "@/lib/constants";
import { HiUsers, HiPhone, HiMail, HiFilter, HiX, HiDotsVertical, HiRefresh } from "react-icons/hi";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  clientType: string;
  source: string | null;
  status: string;
  city: string | null;
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-emerald-500 to-emerald-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-cyan-500 to-cyan-600",
    "from-indigo-500 to-indigo-600",
    "from-rose-500 to-rose-600",
  ];
  const index = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

// Column header accent colors matching status
const COLUMN_STYLES: Record<string, { accent: string; bgSoft: string; ring: string; text: string }> = {
  PROSPECTO:   { accent: "bg-blue-500",    bgSoft: "bg-blue-50",    ring: "ring-blue-300",    text: "text-blue-700" },
  ACTIVO:      { accent: "bg-emerald-500", bgSoft: "bg-emerald-50", ring: "ring-emerald-300", text: "text-emerald-700" },
  EN_PROCESO:  { accent: "bg-amber-500",   bgSoft: "bg-amber-50",   ring: "ring-amber-300",   text: "text-amber-700" },
  CERRADO:     { accent: "bg-purple-500",  bgSoft: "bg-purple-50",  ring: "ring-purple-300",  text: "text-purple-700" },
  INACTIVO:    { accent: "bg-red-500",     bgSoft: "bg-red-50",     ring: "ring-red-300",     text: "text-red-700" },
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const activeFilters = typeFilter ? 1 : 0;

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    fetchClients();
  }, [search]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [openMenuId]);

  const filteredClients = useMemo(() => clients.filter((c) => {
    if (typeFilter && c.clientType !== typeFilter) return false;
    return true;
  }), [clients, typeFilter]);

  const grouped = useMemo(() => {
    const map: Record<string, Client[]> = {};
    for (const s of CLIENT_STATUSES) map[s.value] = [];
    for (const c of filteredClients) {
      const k = c.status || "PROSPECTO";
      if (!map[k]) map[k] = [];
      map[k].push(c);
    }
    return map;
  }, [filteredClients]);

  async function changeStatus(client: Client, newStatus: string) {
    if (client.status === newStatus) return;
    const original = client.status;
    // Optimistic update
    setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, status: newStatus } : c));
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const newLabel = getLabel(CLIENT_STATUSES, newStatus);
      toast.success(`Movido a ${newLabel}`);
    } catch {
      // Revert
      setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, status: original } : c));
      toast.error("No se pudo actualizar");
    }
  }

  function onDragStart(e: React.DragEvent, clientId: string) {
    e.dataTransfer.setData("text/plain", clientId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, status: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) setDragOverColumn(status);
  }

  function onDrop(e: React.DragEvent, newStatus: string) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const client = clients.find((c) => c.id === id);
    if (client) changeStatus(client, newStatus);
    setDragOverColumn(null);
  }

  const [syncing, setSyncing] = useState(false);
  async function syncWithBot() {
    if (syncing) return;
    setSyncing(true);
    const t = toast.loading("Sincronizando búsquedas con el bot...");
    try {
      const res = await fetch("/api/clients/sync-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error");
      toast.success(
        `Sincronizado: ${data.processed} clientes · ${data.activeBusquedas} búsquedas activas, ${data.inactiveBusquedas} inactivas`,
        { id: t, duration: 6000 }
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al sincronizar", { id: t });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${filteredClients.length} en el embudo`}>
        <div className="flex gap-2">
          <button
            onClick={syncWithBot}
            disabled={syncing}
            title="Genera/actualiza una búsqueda para cada cliente, basándose en los criterios y la etapa del embudo. El bot recoge esto en su próximo sync."
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 px-4 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
          >
            <HiRefresh className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{syncing ? "Sincronizando..." : "Sincronizar con bot"}</span>
          </button>
          <Link
            href="/clientes/nuevo"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200"
          >
            <HiUsers className="w-4 h-4" />
            Nuevo Cliente
          </Link>
        </div>
      </PageHeader>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, email, telefono..." />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all ${
            showFilters || activeFilters > 0
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <HiFilter className="w-4 h-4" />
          Filtros
          {activeFilters > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Filtrar por tipo</h3>
            {activeFilters > 0 && (
              <button onClick={() => setTypeFilter("")} className="text-xs text-red-500 font-medium hover:text-red-700 flex items-center gap-1">
                <HiX className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                !typeFilter ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              Todos
            </button>
            {CLIENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                  typeFilter === t.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : filteredClients.length === 0 ? (
        <EmptyState
          title="No hay clientes"
          message="Agrega tu primer cliente para comenzar a gestionar tu cartera."
          actionLabel="Nuevo Cliente"
          actionHref="/clientes/nuevo"
        />
      ) : (
        // ── Kanban board ───────────────────────────────────────────────────
        <div className="overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex gap-4 min-w-max">
            {CLIENT_STATUSES.map((s) => {
              const items = grouped[s.value] || [];
              const styles = COLUMN_STYLES[s.value] || COLUMN_STYLES.PROSPECTO;
              const isDropTarget = dragOverColumn === s.value;
              return (
                <div
                  key={s.value}
                  className={`w-72 flex-shrink-0 rounded-2xl border transition-all ${
                    isDropTarget ? `${styles.bgSoft} ring-2 ${styles.ring}` : "bg-gray-50/70 border-gray-200"
                  }`}
                  onDragOver={(e) => onDragOver(e, s.value)}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => onDrop(e, s.value)}
                >
                  {/* Column header */}
                  <div className="p-3 border-b border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${styles.accent}`} />
                      <h3 className={`text-sm font-bold ${styles.text} uppercase tracking-wider`}>{s.label}</h3>
                      <span className="ml-auto text-xs font-semibold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="p-2 space-y-2 min-h-[120px]">
                    {items.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6 italic">Sin clientes</p>
                    )}
                    {items.map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        styles={styles}
                        onDragStart={(e) => onDragStart(e, client.id)}
                        onChangeStatus={(newStatus) => changeStatus(client, newStatus)}
                        menuOpen={openMenuId === client.id}
                        toggleMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId((id) => id === client.id ? null : client.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client Card ───────────────────────────────────────────────────────────────
function ClientCard({
  client,
  styles,
  onDragStart,
  onChangeStatus,
  menuOpen,
  toggleMenu,
}: {
  client: Client;
  styles: { accent: string; bgSoft: string; ring: string; text: string };
  onDragStart: (e: React.DragEvent) => void;
  onChangeStatus: (newStatus: string) => void;
  menuOpen: boolean;
  toggleMenu: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative"
    >
      <Link href={`/clientes/${client.id}`} className="block p-3">
        <div className="flex items-start gap-2.5 mb-2">
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getAvatarColor(client.firstName + client.lastName)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <span className="text-white font-bold text-xs">{getInitials(client.firstName, client.lastName)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate leading-tight">
              {client.firstName} {client.lastName}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">
              {getLabel(CLIENT_TYPES, client.clientType)}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {client.phone && (
            <p className="text-xs text-gray-600 flex items-center gap-1.5">
              <HiPhone className="w-3 h-3 text-gray-400" /> {client.phone}
            </p>
          )}
          {client.email && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
              <HiMail className="w-3 h-3 text-gray-400" /> <span className="truncate">{client.email}</span>
            </p>
          )}
        </div>
      </Link>

      {/* Move button (top-right) */}
      <button
        onClick={toggleMenu}
        className="absolute top-2 right-2 w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        title="Mover a otra etapa"
      >
        <HiDotsVertical className="w-4 h-4" />
      </button>

      {/* Status change menu */}
      {menuOpen && (
        <div
          className="absolute top-9 right-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1.5 min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">Mover a:</p>
          {CLIENT_STATUSES.filter((s) => s.value !== client.status).map((s) => {
            const cs = COLUMN_STYLES[s.value] || COLUMN_STYLES.PROSPECTO;
            return (
              <button
                key={s.value}
                onClick={() => { onChangeStatus(s.value); toggleMenu({ preventDefault() {}, stopPropagation() {} } as React.MouseEvent); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                <div className={`w-2 h-2 rounded-full ${cs.accent}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Color stripe at bottom */}
      <div className={`h-1 ${styles.accent} rounded-b-xl`} />
    </div>
  );
}
