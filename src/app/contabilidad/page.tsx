"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { AGENTS, MONTHS, formatCurrency, formatDate, getLabel } from "@/lib/constants";
import { HiCurrencyDollar, HiBriefcase, HiCheckCircle, HiClock, HiTrendingUp } from "react-icons/hi";

interface CommissionPayment {
  id: string;
  label: string;
  amount: number;
  date: string | null;
  paid: boolean;
}

interface Deal {
  id: string;
  dealType: string;
  status: string;
  agreedPrice: number | null;
  currency: string;
  commissionAmount: number | null;
  commissionPaid: boolean;
  commissionPayments: string | null;
  assignedAgent: string | null;
  closingDate: string | null;
  createdAt: string;
  client: { firstName: string; lastName: string } | null;
  property: { title: string } | null;
}

interface AgentSummary {
  agent: string;
  label: string;
  initials: string;
  color: string;
  totalDeals: number;
  closedDeals: number;
  totalCommissions: number;
  collectedCommissions: number;
  pendingCommissions: number;
  deals: Deal[];
}

function parsePayments(raw: string | null): CommissionPayment[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function getPaymentsByMonth(deals: Deal[], month: number, year: number): { agent: string; amount: number; label: string; dealTitle: string }[] {
  const results: { agent: string; amount: number; label: string; dealTitle: string }[] = [];
  for (const deal of deals) {
    const payments = parsePayments(deal.commissionPayments);
    for (const p of payments) {
      if (p.paid && p.date) {
        const d = new Date(p.date);
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          results.push({
            agent: deal.assignedAgent || "SIN_ASIGNAR",
            amount: p.amount,
            label: p.label,
            dealTitle: deal.property?.title || "Sin propiedad",
          });
        }
      }
    }
    // Also check deals without payment splits
    if (payments.length === 0 && deal.commissionPaid && deal.closingDate) {
      const d = new Date(deal.closingDate);
      if (d.getMonth() + 1 === month && d.getFullYear() === year && deal.commissionAmount) {
        results.push({
          agent: deal.assignedAgent || "SIN_ASIGNAR",
          amount: deal.commissionAmount,
          label: "Pago completo",
          dealTitle: deal.property?.title || "Sin propiedad",
        });
      }
    }
  }
  return results;
}

export default function ContabilidadPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [agentFilter, setAgentFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then(setDeals)
      .finally(() => setLoading(false));
  }, []);

  // Build agent summaries
  const agentSummaries: AgentSummary[] = AGENTS.map((agent) => {
    const agentDeals = deals.filter((d) => d.assignedAgent === agent.value);
    let totalCommissions = 0;
    let collectedCommissions = 0;
    let pendingCommissions = 0;

    for (const deal of agentDeals) {
      const commission = deal.commissionAmount || 0;
      totalCommissions += commission;

      const payments = parsePayments(deal.commissionPayments);
      if (payments.length > 0) {
        for (const p of payments) {
          if (p.paid) collectedCommissions += p.amount;
          else pendingCommissions += p.amount;
        }
      } else {
        if (deal.commissionPaid) collectedCommissions += commission;
        else pendingCommissions += commission;
      }
    }

    return {
      agent: agent.value,
      label: agent.label,
      initials: agent.initials,
      color: agent.color,
      totalDeals: agentDeals.length,
      closedDeals: agentDeals.filter((d) => d.status === "CERRADO").length,
      totalCommissions,
      collectedCommissions,
      pendingCommissions,
      deals: agentDeals,
    };
  });

  // Company totals
  const companyTotal = agentSummaries.reduce((acc, a) => ({
    totalDeals: acc.totalDeals + a.totalDeals,
    closedDeals: acc.closedDeals + a.closedDeals,
    totalCommissions: acc.totalCommissions + a.totalCommissions,
    collectedCommissions: acc.collectedCommissions + a.collectedCommissions,
    pendingCommissions: acc.pendingCommissions + a.pendingCommissions,
  }), { totalDeals: 0, closedDeals: 0, totalCommissions: 0, collectedCommissions: 0, pendingCommissions: 0 });

  // Unassigned deals
  const unassignedDeals = deals.filter((d) => !d.assignedAgent);

  // Monthly payments
  const monthlyPayments = getPaymentsByMonth(deals, selectedMonth, selectedYear);
  const monthlyByAgent = AGENTS.map((agent) => ({
    ...agent,
    payments: monthlyPayments.filter((p) => p.agent === agent.value),
    total: monthlyPayments.filter((p) => p.agent === agent.value).reduce((s, p) => s + p.amount, 0),
  }));
  const monthlyTotal = monthlyPayments.reduce((s, p) => s + p.amount, 0);

  // Filter deals for display
  const displayDeals = agentFilter === "ALL" ? deals : deals.filter((d) => d.assignedAgent === agentFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Contabilidad" subtitle="Comisiones y gastos por agente" />

      {/* Company Overview */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiTrendingUp className="w-5 h-5 text-blue-600" />
          Resumen General - E. Pringle Real Estate
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-blue-600 uppercase">Negocios</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{companyTotal.totalDeals}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-green-600 uppercase">Cerrados</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{companyTotal.closedDeals}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-purple-600 uppercase">Total Comisiones</p>
            <p className="text-xl font-bold text-purple-800 mt-1">{formatCurrency(companyTotal.totalCommissions)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase">Cobrado</p>
            <p className="text-xl font-bold text-emerald-800 mt-1">{formatCurrency(companyTotal.collectedCommissions)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-xs font-semibold text-amber-600 uppercase">Pendiente</p>
            <p className="text-xl font-bold text-amber-800 mt-1">{formatCurrency(companyTotal.pendingCommissions)}</p>
          </div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {agentSummaries.map((agent) => (
          <div key={agent.agent} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-sm`}>
                <span className="text-white font-bold text-lg">{agent.initials}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{agent.label}</h3>
                <p className="text-xs text-gray-400">{agent.totalDeals} negocios | {agent.closedDeals} cerrados</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Progreso de cobro</span>
                <span className="font-bold text-gray-700">
                  {agent.totalCommissions > 0 ? Math.round((agent.collectedCommissions / agent.totalCommissions) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all"
                  style={{ width: `${agent.totalCommissions > 0 ? Math.min((agent.collectedCommissions / agent.totalCommissions) * 100, 100) : 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">Total</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(agent.totalCommissions)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-green-600 uppercase">Cobrado</p>
                <p className="text-sm font-bold text-green-700 mt-0.5">{formatCurrency(agent.collectedCommissions)}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-[10px] font-semibold text-amber-600 uppercase">Pendiente</p>
                <p className="text-sm font-bold text-amber-700 mt-0.5">{formatCurrency(agent.pendingCommissions)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unassigned deals warning */}
      {unassignedDeals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <HiClock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">{unassignedDeals.length} negocio(s)</span> sin agente asignado. Editalos para asignar un agente.
          </p>
        </div>
      )}

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HiCurrencyDollar className="w-5 h-5 text-green-600" />
            Comisiones Cobradas por Mes
          </h2>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white"
            >
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {monthlyTotal === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <HiCurrencyDollar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No hay comisiones cobradas en {getLabel(MONTHS, selectedMonth)} {selectedYear}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {monthlyByAgent.map((agent) => (
                <div key={agent.value} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                        <span className="text-white font-bold text-xs">{agent.initials}</span>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">{agent.label}</span>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(agent.total)}</span>
                  </div>
                  {agent.payments.length > 0 ? (
                    <div className="space-y-1.5">
                      {agent.payments.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{p.dealTitle} - {p.label}</span>
                          <span className="font-semibold text-gray-700">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Sin cobros este mes</p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 flex items-center justify-between border border-green-200">
              <span className="font-bold text-green-800">Total {getLabel(MONTHS, selectedMonth)} {selectedYear}</span>
              <span className="text-xl font-bold text-green-700">{formatCurrency(monthlyTotal)}</span>
            </div>
          </>
        )}
      </div>

      {/* Deals by Agent */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HiBriefcase className="w-5 h-5 text-blue-600" />
            Detalle de Negocios
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setAgentFilter("ALL")}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                agentFilter === "ALL" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {AGENTS.map((a) => (
              <button
                key={a.value}
                onClick={() => setAgentFilter(a.value)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  agentFilter === a.value ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {a.initials}
              </button>
            ))}
          </div>
        </div>

        {displayDeals.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No hay negocios para mostrar</p>
        ) : (
          <div className="space-y-2">
            {displayDeals.map((deal) => {
              const payments = parsePayments(deal.commissionPayments);
              const collected = payments.length > 0
                ? payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0)
                : deal.commissionPaid ? (deal.commissionAmount || 0) : 0;
              const total = deal.commissionAmount || 0;

              return (
                <div key={deal.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    deal.dealType === "VENTA" ? "bg-blue-100" : "bg-teal-100"
                  }`}>
                    <span className={`text-sm font-bold ${deal.dealType === "VENTA" ? "text-blue-600" : "text-teal-600"}`}>
                      {deal.dealType === "VENTA" ? "V" : "A"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {deal.property?.title || "Sin propiedad"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {deal.client ? `${deal.client.firstName} ${deal.client.lastName}` : "Sin cliente"}
                      {deal.assignedAgent ? ` · ${getLabel(AGENTS, deal.assignedAgent)}` : ""}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    {collected >= total && total > 0 ? (
                      <HiCheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <HiClock className="w-5 h-5 text-amber-500" />
                    )}
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(collected)}</p>
                      <p className="text-[10px] text-gray-400">de {formatCurrency(total)}</p>
                    </div>
                  </div>
                  <StatusBadge
                    label={deal.assignedAgent ? getLabel(AGENTS, deal.assignedAgent) : "Sin asignar"}
                    colorClass={deal.assignedAgent === "EDGAR" ? "bg-blue-100 text-blue-700" : deal.assignedAgent === "ANA_LORENA" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
