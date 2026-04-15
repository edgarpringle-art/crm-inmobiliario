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
import { HiBriefcase, HiCheckCircle, HiClock, HiViewList, HiViewBoards } from "react-icons/hi";

interface CommissionPayment { id: string; label: string; amount: number; date: string | null; paid: boolean; }

interface Deal {
  id: string; dealType: string; status: string; agreedPrice: number | null; currency: string;
  commissionAmount: number | null; commissionPaid: boolean; commissionPayments: string | null;
  closingDate: string | null; contractStartDate: string | null; contractEndDate: string | null;
  monthlyRent: number | null;
  client: { id: string; firstName: string; lastName: string } | null;
  property: { id: string; title: string; address: string | null } | null;
}

function getPaymentProgress(deal: Deal): { paid: number; total: number; pct: number } | null {
  if (!deal.commissionPayments) return null;
  try {
    const payments: CommissionPayment[] = JSON.parse(deal.commissionPayments);
    if (payments.length === 0) return null;
    const total = payments.reduce((s, p) => s + p.amount, 0);
    const paid = payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
    return { paid, total, pct: total > 0 ? Math.round((paid / total) * 100) : 0 };
  } catch { return null; }
}

export default function NegociosPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");

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
        <Link href="/negocios/nuevo" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200">
          <HiBriefcase className="w-4 h-4" />
          Nuevo Negocio
        </Link>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por cliente, propiedad..." />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm">
          <option value="">Todos los estados</option>
          {DEAL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {/* View toggle */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
          <button onClick={() => setView("list")} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            <HiViewList className="w-4 h-4" /> Lista
          </button>
          <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === "kanban" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            <HiViewBoards className="w-4 h-4" /> Kanban
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>
      ) : deals.length === 0 ? (
        <EmptyState title="No hay negocios" message="Registra tu primer negocio." actionLabel="Nuevo Negocio" actionHref="/negocios/nuevo" />
      ) : view === "list" ? (
        <div className="space-y-3">
          {deals.map((deal) => {
            const progress = getPaymentProgress(deal);
            return (
              <Link key={deal.id} href={`/negocios/${deal.id}`}
                className="card-hover flex items-center gap-4 bg-white rounded-2xl shadow-sm p-5 border border-gray-100/80 hover:border-blue-100">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${deal.dealType === "VENTA" ? "bg-blue-100" : "bg-teal-100"}`}>
                  <span className={`text-lg font-bold ${deal.dealType === "VENTA" ? "text-blue-600" : "text-teal-600"}`}>{deal.dealType === "VENTA" ? "V" : "A"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 truncate">{deal.property?.title || "Sin propiedad"}</h3>
                    <StatusBadge label={getLabel(DEAL_STATUSES, deal.status)} colorClass={getStatusColor(DEAL_STATUSES, deal.status)} />
                  </div>
                  <p className="text-sm text-gray-400">
                    {deal.client ? `${deal.client.firstName} ${deal.client.lastName}` : "Sin cliente"}
                    {deal.closingDate ? ` · Cierre: ${formatDate(deal.closingDate)}` : ""}
                  </p>
                </div>
                <div className="hidden sm:block text-right min-w-[140px]">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.agreedPrice, deal.currency)}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    {progress ? (
                      <>
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${progress.pct === 100 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${progress.pct}%` }} />
                        </div>
                        <span className={`text-xs font-semibold ${progress.pct === 100 ? "text-green-600" : "text-amber-600"}`}>{progress.pct}%</span>
                        {progress.pct === 100 ? <HiCheckCircle className="w-4 h-4 text-green-500" /> : <HiClock className="w-4 h-4 text-amber-500" />}
                      </>
                    ) : (
                      <span className="text-xs text-green-600 font-semibold">{formatCurrency(deal.commissionAmount, deal.currency)}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Kanban View */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {DEAL_STATUSES.map((status) => {
              const colDeals = deals.filter((d) => d.status === status.value);
              return (
                <div key={status.value} className="w-72 flex-shrink-0">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl mb-3 ${status.color}`}>
                    <span className="text-sm font-bold">{status.label}</span>
                    <span className="text-sm font-bold bg-white/60 rounded-lg px-2 py-0.5">{colDeals.length}</span>
                  </div>
                  <div className="space-y-3">
                    {colDeals.length === 0 ? (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-400">Sin negocios</p>
                      </div>
                    ) : colDeals.map((deal) => {
                      const progress = getPaymentProgress(deal);
                      return (
                        <Link key={deal.id} href={`/negocios/${deal.id}`}
                          className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-blue-100 transition-all">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${deal.dealType === "VENTA" ? "bg-blue-100 text-blue-600" : "bg-teal-100 text-teal-600"}`}>
                              {deal.dealType === "VENTA" ? "V" : "A"}
                            </div>
                            <p className="font-semibold text-gray-900 text-sm truncate">{deal.property?.title || "Sin propiedad"}</p>
                          </div>
                          <p className="text-xs text-gray-400 mb-3 truncate">
                            {deal.client ? `${deal.client.firstName} ${deal.client.lastName}` : "Sin cliente"}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-800">{formatCurrency(deal.agreedPrice, deal.currency)}</span>
                            {progress ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-12 bg-gray-100 rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${progress.pct === 100 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${progress.pct}%` }} />
                                </div>
                                <span className={`text-[10px] font-bold ${progress.pct === 100 ? "text-green-600" : "text-amber-600"}`}>{progress.pct}%</span>
                              </div>
                            ) : deal.commissionAmount ? (
                              <span className="text-xs text-green-600 font-semibold">{formatCurrency(deal.commissionAmount, deal.currency)}</span>
                            ) : null}
                          </div>
                          {deal.closingDate && (
                            <p className="text-[10px] text-gray-400 mt-2">Cierre: {formatDate(deal.closingDate)}</p>
                          )}
                        </Link>
                      );
                    })}
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
