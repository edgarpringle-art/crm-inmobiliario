"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import {
  DEAL_TYPES, DEAL_STATUSES,
  formatCurrency, formatDate, getLabel, getStatusColor,
} from "@/lib/constants";

interface Deal {
  id: string; dealType: string; status: string; agreedPrice: number | null; currency: string;
  commissionAmount: number | null; closingDate: string | null;
  contractStartDate: string | null; contractEndDate: string | null; monthlyRent: number | null;
  client: { id: string; firstName: string; lastName: string } | null;
  property: { id: string; title: string; address: string | null } | null;
}

export default function NegociosPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function fetchDeals() {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/deals?${params}`);
      const data = await res.json();
      setDeals(data);
      setLoading(false);
    }
    fetchDeals();
  }, [search, statusFilter]);

  return (
    <div>
      <PageHeader title="Negocios" subtitle={`${deals.length} registros`}>
        <Link href="/negocios/nuevo" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">
          + Nuevo Negocio
        </Link>
      </PageHeader>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente, propiedad..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
          <option value="">Todos los estados</option>
          {DEAL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>
      ) : deals.length === 0 ? (
        <EmptyState title="No hay negocios" message="Registra tu primer negocio." actionLabel="Nuevo Negocio" actionHref="/negocios/nuevo" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Propiedad</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Precio</th>
                <th className="px-6 py-3">Comisión</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Fecha Cierre</th>
                <th className="px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {deal.property ? (
                      <Link href={`/propiedades/${deal.property.id}`} className="text-blue-600 hover:underline font-medium">
                        {deal.property.title}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {deal.client ? (
                      <Link href={`/clientes/${deal.client.id}`} className="text-blue-600 hover:underline">
                        {deal.client.firstName} {deal.client.lastName}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge label={getLabel(DEAL_TYPES, deal.dealType)} colorClass={deal.dealType === "VENTA" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"} />
                  </td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(deal.agreedPrice, deal.currency)}</td>
                  <td className="px-6 py-4 text-green-600 font-medium">{formatCurrency(deal.commissionAmount, deal.currency)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge label={getLabel(DEAL_STATUSES, deal.status)} colorClass={getStatusColor(DEAL_STATUSES, deal.status)} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(deal.closingDate)}</td>
                  <td className="px-6 py-4">
                    <Link href={`/negocios/${deal.id}`} className="text-blue-600 hover:text-blue-800 font-medium">Ver</Link>
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
