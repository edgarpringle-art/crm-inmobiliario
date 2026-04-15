"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { CLIENT_TYPES, CLIENT_SOURCES, CLIENT_STATUSES, getLabel, getStatusColor } from "@/lib/constants";
import { HiUsers, HiPhone, HiMail, HiFilter, HiX } from "react-icons/hi";

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

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters = [statusFilter, typeFilter].filter(Boolean).length;

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      setClients(data);
      setLoading(false);
    }
    fetchClients();
  }, [search, statusFilter]);

  const filteredClients = clients.filter((c) => {
    if (typeFilter && c.clientType !== typeFilter) return false;
    return true;
  });

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${filteredClients.length} registros`}>
        <Link
          href="/clientes/nuevo"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200"
        >
          <HiUsers className="w-4 h-4" />
          Nuevo Cliente
        </Link>
      </PageHeader>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, email, telefono, cedula..." />
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

      {/* Advanced filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 animate-slide-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Filtros</h3>
            {activeFilters > 0 && (
              <button onClick={() => { setStatusFilter(""); setTypeFilter(""); }} className="text-xs text-red-500 font-medium hover:text-red-700 flex items-center gap-1">
                <HiX className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Estado</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                <option value="">Todos</option>
                {CLIENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Tipo</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
                <option value="">Todos</option>
                {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
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
        <div className="space-y-2">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/clientes/${client.id}`}
              className="card-hover flex items-center gap-4 bg-white rounded-xl shadow-sm p-4 border border-gray-100/80 hover:border-blue-100"
            >
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getAvatarColor(client.firstName + client.lastName)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-white font-bold text-sm">{getInitials(client.firstName, client.lastName)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {client.firstName} {client.lastName}
                  </h3>
                  <StatusBadge
                    label={getLabel(CLIENT_TYPES, client.clientType)}
                    colorClass="bg-gray-100 text-gray-600"
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <HiPhone className="w-3 h-3" /> {client.phone}
                    </span>
                  )}
                  {client.email && (
                    <span className="flex items-center gap-1 hidden sm:flex">
                      <HiMail className="w-3 h-3" /> {client.email}
                    </span>
                  )}
                  {client.source && (
                    <span className="hidden md:inline">
                      Fuente: {getLabel(CLIENT_SOURCES, client.source)}
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <StatusBadge
                  label={getLabel(CLIENT_STATUSES, client.status)}
                  colorClass={getStatusColor(CLIENT_STATUSES, client.status)}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
