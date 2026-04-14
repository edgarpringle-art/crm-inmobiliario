"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import { CLIENT_TYPES, CLIENT_SOURCES, CLIENT_STATUSES, getLabel, getStatusColor } from "@/lib/constants";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  clientType: string;
  source: string | null;
  status: string;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${clients.length} registros`}>
        <Link
          href="/clientes/nuevo"
          className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nuevo Cliente
        </Link>
      </PageHeader>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, email, teléfono..." />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">Todos los estados</option>
          {CLIENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No hay clientes"
          message="Agrega tu primer cliente para comenzar a gestionar tu cartera."
          actionLabel="Nuevo Cliente"
          actionHref="/clientes/nuevo"
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Fuente</th>
                <th className="px-6 py-3">Teléfono</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {getLabel(CLIENT_TYPES, client.clientType)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {client.source ? getLabel(CLIENT_SOURCES, client.source) : "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{client.phone || "—"}</td>
                  <td className="px-6 py-4 text-gray-600">{client.email || "—"}</td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      label={getLabel(CLIENT_STATUSES, client.status)}
                      colorClass={getStatusColor(CLIENT_STATUSES, client.status)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/clientes/${client.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
