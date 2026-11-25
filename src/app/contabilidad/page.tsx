"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { MONTHS, formatCurrency, getLabel } from "@/lib/constants";
import {
  HiCurrencyDollar, HiBriefcase, HiCheckCircle, HiClock,
  HiChartBar, HiExternalLink,
} from "react-icons/hi";

const CONTABILIDAD_APP_URL = "https://ep-contabilidad-production.up.railway.app";

interface CommissionPayment {
  id: string; label: string; amount: number; date: string | null; paid: boolean;
}

interface AgentRow {
  id: string; code: string; fullName: string; role: string;
  initials: string | null; color: string | null;
}

interface Deal {
  id: string; dealType: string; status: string;
  agreedPrice: number | null; currency: string;
  commissionAmount: number | null; commissionPaid: boolean;
  commissionPayments: string | null; assignedAgent: string | null;
  internalAgentId: string | null;
  companyShare: number | null;
  internalAgentShare: number | null;
  externalAgentName: string | null;
  externalAgentShare: number | null;
  closingDate: string | null; commissionDate: string | null;
  contractStartDate: string | null; createdAt: string;
  client: { firstName: string; lastName: string } | null;
  property: { title: string } | null;
}

interface AgentSummary {
  agent: string; label: string; initials: string; color: string;
  totalDeals: number; closedDeals: number;
  totalCommissions: number; collectedCommissions: number; pendingCommissions: number;
  deals: Deal[];
}

function parsePayments(raw: string | null): CommissionPayment[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function parseLocalDate(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

function getCommissionsByMonth(deals: Deal[], month: number, year: number, brokerCode: string) {
  const results: { agent: string; amount: number; label: string; dealTitle: string }[] = [];
  for (const deal of deals) {
    const hasSplits = deal.companyShare != null || deal.internalAgentShare != null;
    const payments = parsePayments(deal.commissionPayments);
    const dealTitle = deal.property?.title || "Sin propiedad";

    const pushSplit = (agentCode: string, amount: number, label: string) => {
      results.push({ agent: agentCode, amount, label, dealTitle });
    };

    // Each payment is divided among the internal parties in proportion to their
    // shares. The base is the payment schedule's own total — on co-brokered deals
    // the schedule only covers the house's half, so using the gross commission
    // here would under-report every payment.
    const scheduledTotal = payments.reduce((s, p) => s + p.amount, 0);
    const splitBase = scheduledTotal > 0 ? scheduledTotal : (deal.commissionAmount || 0);

    for (const p of payments) {
      if (p.paid && p.date) {
        const d = parseLocalDate(p.date);
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          if (hasSplits && splitBase > 0) {
            if (deal.companyShare != null) {
              pushSplit(brokerCode, p.amount * (deal.companyShare / splitBase), p.label);
            }
            if (deal.internalAgentShare != null && deal.assignedAgent) {
              pushSplit(deal.assignedAgent, p.amount * (deal.internalAgentShare / splitBase), p.label);
            }
          } else {
            pushSplit(deal.assignedAgent || "SIN_ASIGNAR", p.amount, p.label);
          }
        }
      }
    }
    if (payments.length === 0 && deal.commissionPaid) {
      const paymentDateStr = deal.commissionDate || deal.closingDate || deal.contractStartDate;
      if (paymentDateStr) {
        const d = parseLocalDate(paymentDateStr);
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          if (hasSplits) {
            if (deal.companyShare != null) pushSplit(brokerCode, deal.companyShare, "Empresa");
            if (deal.internalAgentShare != null && deal.assignedAgent) pushSplit(deal.assignedAgent, deal.internalAgentShare, "Agente CRM");
          } else if (deal.commissionAmount) {
            pushSplit(deal.assignedAgent || "SIN_ASIGNAR", deal.commissionAmount, "Pago completo");
          }
        }
      }
    }
  }
  return results;
}

/**
 * Computes how much of a deal's commission belongs to a given agent.
 * Uses new split fields if present; falls back to legacy logic otherwise.
 */
function getAgentShareFromDeal(deal: Deal, agent: AgentRow, brokerCode: string): number {
  const hasSplits =
    deal.companyShare != null ||
    deal.internalAgentShare != null ||
    deal.externalAgentShare != null;

  if (hasSplits) {
    let share = 0;

    // Match internal agent by ID (preferred) OR by assignedAgent code (fallback for old records)
    const isInternalAgent =
      (deal.internalAgentId != null && deal.internalAgentId === agent.id) ||
      (deal.internalAgentId == null && deal.assignedAgent != null &&
        deal.assignedAgent.toLowerCase() === agent.code.toLowerCase());

    if (isInternalAgent && deal.internalAgentShare != null) {
      share += deal.internalAgentShare;
    }

    // Only the house broker receives the company share — several agents can
    // hold the broker role, and each one would otherwise get it.
    if (agent.code.toUpperCase() === brokerCode && deal.companyShare != null) {
      share += deal.companyShare;
    }

    return share;
  }

  // Legacy (no split fields set)
  const code = (deal.assignedAgent || "").toLowerCase();
  if (code === agent.code.toLowerCase()) return deal.commissionAmount || 0;
  if (code === "ambos" && (agent.role === "broker" || agent.role === "admin")) {
    return (deal.commissionAmount || 0) * 0.5;
  }
  return 0;
}

export default function ContabilidadPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [tab, setTab] = useState<"resumen" | "negocios">("resumen");

  useEffect(() => {
    Promise.all([
      fetch("/api/deals").then((r) => r.json()).catch(() => []),
      fetch("/api/agents?active=1").then((r) => r.json()).catch(() => []),
    ]).then(([d, a]) => {
      setDeals(Array.isArray(d) ? d : []);
      setAgents(Array.isArray(a) ? a : []);
    }).finally(() => setLoading(false));
  }, []);

  const individualAgents = agents;
  const splitAgents = agents.filter((a) => a.role === "broker" || a.role === "admin");

  // Broker's code for split attribution (the house). Edgar first, since more
  // than one agent can hold the broker role.
  const brokerAgent = agents.find((a) => a.code.toLowerCase() === "edgar") || agents.find((a) => a.role === "broker");
  const brokerCode = (brokerAgent?.code || "EDGAR").toUpperCase();

  const agentSummaries: AgentSummary[] = individualAgents.map((agent) => {
    let totalCommissions = 0, collectedCommissions = 0, pendingCommissions = 0;
    let totalDeals = 0, closedDeals = 0;
    const myDeals: Deal[] = [];

    for (const deal of deals) {
      const share = getAgentShareFromDeal(deal, agent, brokerCode);
      if (share === 0) continue;
      myDeals.push(deal);
      totalDeals++;
      if (deal.status === "CERRADO") closedDeals++;
      totalCommissions += share;

      // Split the agent's share by how much of the payment schedule has been
      // collected. Scaling by the schedule (rather than the gross commission)
      // keeps co-brokered deals correct, where the schedule only covers the
      // house's half and would otherwise leave phantom money as pending.
      const payments = parsePayments(deal.commissionPayments);
      if (payments.length > 0) {
        const scheduled = payments.reduce((s, p) => s + p.amount, 0);
        const paid = payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
        const paidRatio = scheduled > 0 ? paid / scheduled : 0;
        collectedCommissions += share * paidRatio;
        pendingCommissions += share * (1 - paidRatio);
      } else {
        if (deal.commissionPaid) collectedCommissions += share;
        else pendingCommissions += share;
      }
    }
    return {
      agent: agent.code.toUpperCase(),
      label: agent.fullName,
      initials: agent.initials || agent.fullName.charAt(0),
      color: agent.color || "from-slate-500 to-slate-600",
      totalDeals, closedDeals,
      totalCommissions, collectedCommissions, pendingCommissions,
      deals: myDeals,
    };
  });

  const companyTotal = agentSummaries.reduce((acc, a) => ({
    totalDeals: acc.totalDeals + a.totalDeals,
    closedDeals: acc.closedDeals + a.closedDeals,
    totalCommissions: acc.totalCommissions + a.totalCommissions,
    collectedCommissions: acc.collectedCommissions + a.collectedCommissions,
    pendingCommissions: acc.pendingCommissions + a.pendingCommissions,
  }), { totalDeals: 0, closedDeals: 0, totalCommissions: 0, collectedCommissions: 0, pendingCommissions: 0 });

  const unassignedDeals = deals.filter((d) => !d.assignedAgent);

  // Monthly commissions — legacy "AMBOS" splits across broker+admin agents
  const rawMonthly = getCommissionsByMonth(deals, selectedMonth, selectedYear, brokerCode);
  const monthlyPayments: typeof rawMonthly = [];
  for (const p of rawMonthly) {
    if ((p.agent || "").toUpperCase() === "AMBOS" && splitAgents.length > 0) {
      const portion = p.amount / splitAgents.length;
      for (const a of splitAgents) {
        monthlyPayments.push({ ...p, agent: a.code.toUpperCase(), amount: portion });
      }
    } else {
      monthlyPayments.push(p);
    }
  }
  const monthlyCommissionsTotal = monthlyPayments.reduce((s, p) => s + p.amount, 0);

  const monthlyByAgent = individualAgents.map((agent) => {
    const codeUpper = agent.code.toUpperCase();
    const payments = monthlyPayments.filter((p) => (p.agent || "").toUpperCase() === codeUpper);
    const commissions = payments.reduce((s, p) => s + p.amount, 0);
    return {
      value: codeUpper,
      label: agent.fullName,
      initials: agent.initials || agent.fullName.charAt(0),
      color: agent.color || "from-slate-500 to-slate-600",
      payments,
      commissions,
    };
  });

  // Last 6 months chart data — commissions only
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selectedYear, selectedMonth - 1 - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: getLabel(MONTHS, d.getMonth() + 1) as string };
  });
  const chartData = chartMonths.map(({ month, year, label }) => {
    const raw = getCommissionsByMonth(deals, month, year, brokerCode);
    const commissions = raw.reduce((s, p) => s + p.amount, 0);
    return { label: label.slice(0, 3), commissions };
  });
  const chartMax = Math.max(...chartData.map((d) => d.commissions), 1);

  const displayDeals = agentFilter === "ALL" ? deals : deals.filter((d) => (d.assignedAgent || "").toUpperCase() === agentFilter);

  function agentLabel(agentCode: string | null | undefined): string {
    if (!agentCode) return "Empresa";
    if (agentCode.toUpperCase() === "AMBOS") return "Ambos";
    const a = agents.find((x) => x.code.toLowerCase() === agentCode.toLowerCase());
    return a ? a.fullName : agentCode;
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;

  return (
    <div>
      <PageHeader title="Contabilidad" subtitle="Negocios cerrados y comisiones cobradas" />

      {/* Hero — comisiones de la empresa */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 mb-6">
        <div className="pointer-events-none absolute -right-20 -top-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">Comisiones Cobradas</p>
            <p className="text-4xl sm:text-5xl font-bold mt-2 tracking-tight text-white">
              {formatCurrency(companyTotal.collectedCommissions)}
            </p>
            <p className="text-xs text-slate-400 mt-2">Total histórico cobrado por la empresa</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:min-w-[400px]">
            <HeroStat label="Cobrado" value={formatCurrency(companyTotal.collectedCommissions)} dot="bg-emerald-400" />
            <HeroStat label="Pendiente" value={formatCurrency(companyTotal.pendingCommissions)} dot="bg-amber-400" />
            <HeroStat label="Comis. totales" value={formatCurrency(companyTotal.totalCommissions)} dot="bg-sky-400" />
          </div>
        </div>

        <div className="relative mt-7 pt-5 border-t border-white/10 flex flex-wrap items-end justify-between gap-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <HeroMini label="Negocios" value={String(companyTotal.totalDeals)} />
            <HeroMini label="Cerrados" value={String(companyTotal.closedDeals)} />
            <HeroMini label="% Cobrado" value={`${companyTotal.totalCommissions > 0 ? Math.round((companyTotal.collectedCommissions / companyTotal.totalCommissions) * 100) : 0}%`} accent="text-emerald-300" />
          </div>
          <a
            href={CONTABILIDAD_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <HiExternalLink className="w-4 h-4" />
            Contabilidad detallada
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-full sm:w-fit">
        {([
          { id: "resumen", label: "Resumen", icon: HiChartBar },
          { id: "negocios", label: "Negocios", icon: HiBriefcase },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <>
      {unassignedDeals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <HiClock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800"><span className="font-bold">{unassignedDeals.length} negocio(s)</span> sin agente asignado.</p>
        </div>
      )}

      {/* Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <HiChartBar className="w-5 h-5 text-gray-500" />
          <span className="font-semibold text-gray-700 text-sm">Periodo:</span>
        </div>
        <div className="flex gap-2">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Monthly Chart — commissions only */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-gray-900">Comisiones · últimos 6 meses</h2>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">Comisiones</span></div>
        </div>

        <div className="flex items-end gap-2 sm:gap-4">
          {chartData.map((d, i) => {
            const isCurrent = i === chartData.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center" style={{ height: "150px" }}>
                  <div
                    className="w-full max-w-[46px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                    style={{ height: `${(d.commissions / chartMax) * 100}%`, minHeight: d.commissions > 0 ? "4px" : "0" }}
                    title={`Comisiones: ${formatCurrency(d.commissions)}`}
                  />
                </div>
                <span className={`text-[11px] font-semibold ${isCurrent ? "text-slate-900" : "text-gray-400"}`}>{d.label}</span>
                <span className="text-[10px] font-bold text-emerald-600" title={`Comisiones: ${formatCurrency(d.commissions)}`}>
                  {compactMoney(d.commissions)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary — commissions only */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <HiCurrencyDollar className="w-5 h-5 text-green-600" />
          Comisiones de {getLabel(MONTHS, selectedMonth)} {selectedYear}
        </h2>

        {monthlyCommissionsTotal === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay comisiones cobradas en este periodo</p>
        ) : (
          <>
            <div className="bg-emerald-50 rounded-2xl p-4 mb-5 flex items-center justify-between">
              <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wide">Total comisiones cobradas</p>
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(monthlyCommissionsTotal)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monthlyByAgent.map((agent) => (
                <div key={agent.value} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                        <span className="text-white font-bold text-xs">{agent.initials}</span>
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">{agent.label}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-700">{formatCurrency(agent.commissions)}</span>
                  </div>

                  {agent.payments.length > 0 ? (
                    <div className="space-y-1">
                      {agent.payments.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 truncate pr-2">{p.dealTitle} - {p.label}</span>
                          <span className="font-semibold text-green-700 flex-shrink-0">+{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Sin comisiones este mes</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Agentes — totales históricos (comisiones) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        {agentSummaries.map((agent) => {
          const pct = agent.totalCommissions > 0 ? Math.min((agent.collectedCommissions / agent.totalCommissions) * 100, 100) : 0;
          return (
            <div key={agent.agent} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold">{agent.initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{agent.label}</h3>
                  <p className="text-xs text-gray-400">{agent.totalDeals} negocios · {agent.closedDeals} cerrados</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Cobrado</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(agent.collectedCommissions)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-gray-400">Cobrado {Math.round(pct)}%</span>
                <span className="text-gray-500 font-medium">{formatCurrency(agent.collectedCommissions)} / {formatCurrency(agent.totalCommissions)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <MiniTile label="Totales" value={formatCurrency(agent.totalCommissions)} tone="sky" />
                <MiniTile label="Cobrado" value={formatCurrency(agent.collectedCommissions)} tone="emerald" />
                <MiniTile label="Pend." value={formatCurrency(agent.pendingCommissions)} tone="amber" />
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {tab === "negocios" && (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HiBriefcase className="w-5 h-5 text-blue-600" />
            Detalle de Negocios
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setAgentFilter("ALL")} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${agentFilter === "ALL" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Todos</button>
            {agents.map((a) => {
              const v = a.code.toUpperCase();
              const initials = a.initials || a.fullName.charAt(0);
              return (
                <button key={a.id} onClick={() => setAgentFilter(v)} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${agentFilter === v ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{initials}</button>
              );
            })}
          </div>
        </div>
        {displayDeals.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No hay negocios para mostrar</p>
        ) : (
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {displayDeals.map((deal) => {
              const payments = parsePayments(deal.commissionPayments);
              const collected = payments.length > 0
                ? payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0)
                : deal.commissionPaid ? (deal.commissionAmount || 0) : 0;
              const total = deal.commissionAmount || 0;
              return (
                <div key={deal.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${deal.dealType === "VENTA" ? "bg-blue-100" : "bg-teal-100"}`}>
                    <span className={`text-sm font-bold ${deal.dealType === "VENTA" ? "text-blue-600" : "text-teal-600"}`}>{deal.dealType === "VENTA" ? "V" : "A"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{deal.property?.title || "Sin propiedad"}</p>
                    <p className="text-xs text-gray-400">
                      {deal.client ? `${deal.client.firstName} ${deal.client.lastName}` : "Sin cliente"}
                      {deal.assignedAgent ? ` · ${agentLabel(deal.assignedAgent)}` : ""}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    {collected >= total && total > 0 ? <HiCheckCircle className="w-5 h-5 text-green-500" /> : <HiClock className="w-5 h-5 text-amber-500" />}
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(collected)}</p>
                      <p className="text-[10px] text-gray-400">de {formatCurrency(total)}</p>
                    </div>
                  </div>
                  <StatusBadge
                    label={deal.assignedAgent ? agentLabel(deal.assignedAgent) : "Sin asignar"}
                    colorClass={(deal.assignedAgent || "").toUpperCase() === "EDGAR" ? "bg-blue-100 text-blue-700" : (deal.assignedAgent || "").toUpperCase() === "ANA" || (deal.assignedAgent || "").toUpperCase() === "ANA_LORENA" ? "bg-purple-100 text-purple-700" : (deal.assignedAgent || "").toUpperCase() === "AMBOS" ? "bg-indigo-100 text-indigo-700" : deal.assignedAgent ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-500"}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}

/** Compact money for tight spaces: 12500 → 12.5k */
function compactMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(n)}`;
}

function HeroStat({ label, value, dot }: { label: string; value: string; dot: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <p className="text-base font-bold text-white truncate" title={value}>{value}</p>
    </div>
  );
}

function HeroMini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${accent || "text-slate-100"}`}>{value}</p>
    </div>
  );
}

const TILE_TONES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  sky: "bg-sky-50 text-sky-700",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
};

function MiniTile({ label, value, tone }: { label: string; value: string; tone: keyof typeof TILE_TONES }) {
  return (
    <div className={`rounded-xl px-2 py-2.5 text-center ${TILE_TONES[tone]}`}>
      <p className="text-[9px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-[13px] font-bold mt-0.5 truncate" title={value}>{value}</p>
    </div>
  );
}
