"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  AGENTS, MONTHS, EXPENSE_CATEGORIES, CURRENCIES,
  formatCurrency, formatDate, getLabel,
} from "@/lib/constants";
import {
  HiCurrencyDollar, HiBriefcase, HiCheckCircle, HiClock,
  HiTrendingUp, HiTrash, HiPlus, HiX, HiChartBar, HiPencil,
} from "react-icons/hi";

interface CommissionPayment {
  id: string; label: string; amount: number; date: string | null; paid: boolean;
}

interface Deal {
  id: string; dealType: string; status: string;
  agreedPrice: number | null; currency: string;
  commissionAmount: number | null; commissionPaid: boolean;
  commissionPayments: string | null; assignedAgent: string | null;
  closingDate: string | null; commissionDate: string | null;
  contractStartDate: string | null; createdAt: string;
  client: { firstName: string; lastName: string } | null;
  property: { title: string } | null;
}

interface Gasto {
  id: string; description: string; amount: number; currency: string;
  category: string; assignedAgent: string | null; date: string; notes: string | null;
  createdAt: string;
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

function getCommissionsByMonth(deals: Deal[], month: number, year: number) {
  const results: { agent: string; amount: number; label: string; dealTitle: string }[] = [];
  for (const deal of deals) {
    const payments = parsePayments(deal.commissionPayments);
    for (const p of payments) {
      if (p.paid && p.date) {
        const d = parseLocalDate(p.date);
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          results.push({ agent: deal.assignedAgent || "SIN_ASIGNAR", amount: p.amount, label: p.label, dealTitle: deal.property?.title || "Sin propiedad" });
        }
      }
    }
    if (payments.length === 0 && deal.commissionPaid && deal.commissionAmount) {
      // Payment date priority: commissionDate → closingDate → contractStartDate
      const paymentDateStr = deal.commissionDate || deal.closingDate || deal.contractStartDate;
      if (paymentDateStr) {
        const d = parseLocalDate(paymentDateStr);
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          results.push({ agent: deal.assignedAgent || "SIN_ASIGNAR", amount: deal.commissionAmount, label: "Pago completo", dealTitle: deal.property?.title || "Sin propiedad" });
        }
      }
    }
  }
  return results;
}

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function ContabilidadPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [agentFilter, setAgentFilter] = useState("ALL");
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [savingGasto, setSavingGasto] = useState(false);
  const [editingGastoId, setEditingGastoId] = useState<string | null>(null);
  const [gastoForm, setGastoForm] = useState({
    description: "", amount: "", currency: "USD",
    category: "OTRO", assignedAgent: "", date: new Date().toISOString().split("T")[0], notes: "",
  });

  function resetGastoForm() {
    setGastoForm({ description: "", amount: "", currency: "USD", category: "OTRO", assignedAgent: "", date: new Date().toISOString().split("T")[0], notes: "" });
    setEditingGastoId(null);
  }

  function startEditGasto(g: Gasto) {
    setEditingGastoId(g.id);
    setGastoForm({
      description: g.description || "",
      amount: String(g.amount ?? ""),
      currency: g.currency || "USD",
      category: g.category || "OTRO",
      assignedAgent: g.assignedAgent || "",
      date: (g.date || "").slice(0, 10) || new Date().toISOString().split("T")[0],
      notes: g.notes || "",
    });
    setShowGastoForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/deals").then((r) => r.json()).catch(() => []),
      fetch("/api/gastos").then((r) => r.json()).then((g) => Array.isArray(g) ? g : []).catch(() => []),
    ]).then(([d, g]) => { setDeals(Array.isArray(d) ? d : []); setGastos(g); }).finally(() => setLoading(false));
  }, []);

  // Agent summaries (AMBOS splits 50/50)
  const individualAgents = AGENTS.filter((a) => a.value !== "AMBOS");
  const ambosDeals = deals.filter((d) => d.assignedAgent === "AMBOS");

  const agentSummaries: AgentSummary[] = individualAgents.map((agent) => {
    const ownDeals = deals.filter((d) => d.assignedAgent === agent.value);
    const relevantDeals = [...ownDeals, ...ambosDeals];
    let totalCommissions = 0, collectedCommissions = 0, pendingCommissions = 0;
    for (const deal of relevantDeals) {
      const split = deal.assignedAgent === "AMBOS" ? 0.5 : 1;
      const commission = (deal.commissionAmount || 0) * split;
      totalCommissions += commission;
      const payments = parsePayments(deal.commissionPayments);
      if (payments.length > 0) {
        for (const p of payments) {
          if (p.paid) collectedCommissions += p.amount * split;
          else pendingCommissions += p.amount * split;
        }
      } else {
        if (deal.commissionPaid) collectedCommissions += commission;
        else pendingCommissions += commission;
      }
    }
    return {
      agent: agent.value, label: agent.label, initials: agent.initials, color: agent.color,
      totalDeals: ownDeals.length + ambosDeals.length,
      closedDeals: relevantDeals.filter((d) => d.status === "CERRADO").length,
      totalCommissions, collectedCommissions, pendingCommissions, deals: relevantDeals,
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

  // Monthly commissions (AMBOS split 50/50)
  const rawMonthly = getCommissionsByMonth(deals, selectedMonth, selectedYear);
  const monthlyPayments: typeof rawMonthly = [];
  for (const p of rawMonthly) {
    if (p.agent === "AMBOS") {
      monthlyPayments.push({ ...p, agent: "EDGAR", amount: p.amount * 0.5 });
      monthlyPayments.push({ ...p, agent: "ANA_LORENA", amount: p.amount * 0.5 });
    } else {
      monthlyPayments.push(p);
    }
  }
  const monthlyCommissionsTotal = monthlyPayments.reduce((s, p) => s + p.amount, 0);

  // Monthly expenses (null agent or "AMBOS" → split 50/50)
  const monthlyGastos = gastos.filter((g) => {
    const d = new Date(g.date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });
  const monthlyGastosTotal = monthlyGastos.reduce((s, g) => s + g.amount, 0);
  const monthlyNet = monthlyCommissionsTotal - monthlyGastosTotal;

  function gastosForAgent(agentValue: string) {
    let total = 0;
    const items: { description: string; amount: number; category: string; shared: boolean }[] = [];
    for (const g of monthlyGastos) {
      if (g.assignedAgent === agentValue) {
        total += g.amount;
        items.push({ description: g.description, amount: g.amount, category: g.category, shared: false });
      } else if (!g.assignedAgent || g.assignedAgent === "AMBOS") {
        total += g.amount * 0.5;
        items.push({ description: g.description, amount: g.amount * 0.5, category: g.category, shared: true });
      }
    }
    return { total, items };
  }

  const monthlyByAgent = individualAgents.map((agent) => {
    const payments = monthlyPayments.filter((p) => p.agent === agent.value);
    const commissions = payments.reduce((s, p) => s + p.amount, 0);
    const { total: expenses, items: expenseItems } = gastosForAgent(agent.value);
    return {
      ...agent,
      payments,
      total: commissions,
      commissions,
      expenses,
      net: commissions - expenses,
      expenseItems,
    };
  });

  // Last 6 months chart data
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selectedYear, selectedMonth - 1 - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: getLabel(MONTHS, d.getMonth() + 1) as string };
  });
  const chartData = chartMonths.map(({ month, year, label }) => {
    const raw = getCommissionsByMonth(deals, month, year);
    const expanded: typeof raw = [];
    for (const p of raw) {
      if (p.agent === "AMBOS") {
        expanded.push({ ...p, agent: "EDGAR", amount: p.amount * 0.5 });
        expanded.push({ ...p, agent: "ANA_LORENA", amount: p.amount * 0.5 });
      } else { expanded.push(p); }
    }
    const commissions = expanded.reduce((s, p) => s + p.amount, 0);
    const expenses = gastos.filter((g) => {
      const d = new Date(g.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    }).reduce((s, g) => s + g.amount, 0);
    return { label: label.slice(0, 3), commissions, expenses, net: commissions - expenses };
  });
  const chartMax = Math.max(...chartData.map((d) => Math.max(d.commissions, d.expenses)), 1);

  const displayDeals = agentFilter === "ALL" ? deals : deals.filter((d) => d.assignedAgent === agentFilter);

  async function handleAddGasto(e: React.FormEvent) {
    e.preventDefault();
    setSavingGasto(true);
    try {
      const payload = {
        ...gastoForm,
        amount: parseFloat(gastoForm.amount),
        assignedAgent: gastoForm.assignedAgent || null,
        date: gastoForm.date,
        notes: gastoForm.notes || null,
      };
      if (editingGastoId) {
        const res = await fetch(`/api/gastos/${editingGastoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setGastos((prev) => prev.map((g) => (g.id === editingGastoId ? { ...g, ...updated } : g)));
          setShowGastoForm(false);
          resetGastoForm();
        }
      } else {
        const res = await fetch("/api/gastos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newGasto = await res.json();
          setGastos((prev) => [newGasto, ...prev]);
          setShowGastoForm(false);
          resetGastoForm();
        }
      }
    } finally { setSavingGasto(false); }
  }

  async function handleDeleteGasto(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    const res = await fetch(`/api/gastos/${id}`, { method: "DELETE" });
    if (res.ok) setGastos((prev) => prev.filter((g) => g.id !== id));
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;

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
          <div className="bg-blue-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-blue-600 uppercase">Negocios</p><p className="text-2xl font-bold text-blue-800 mt-1">{companyTotal.totalDeals}</p></div>
          <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-green-600 uppercase">Cerrados</p><p className="text-2xl font-bold text-green-800 mt-1">{companyTotal.closedDeals}</p></div>
          <div className="bg-purple-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-purple-600 uppercase">Total Comisiones</p><p className="text-xl font-bold text-purple-800 mt-1">{formatCurrency(companyTotal.totalCommissions)}</p></div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-emerald-600 uppercase">Cobrado</p><p className="text-xl font-bold text-emerald-800 mt-1">{formatCurrency(companyTotal.collectedCommissions)}</p></div>
          <div className="bg-amber-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-amber-600 uppercase">Pendiente</p><p className="text-xl font-bold text-amber-800 mt-1">{formatCurrency(companyTotal.pendingCommissions)}</p></div>
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
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Progreso de cobro</span>
                <span className="font-bold text-gray-700">{agent.totalCommissions > 0 ? Math.round((agent.collectedCommissions / agent.totalCommissions) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${agent.totalCommissions > 0 ? Math.min((agent.collectedCommissions / agent.totalCommissions) * 100, 100) : 0}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-gray-400 uppercase">Total</p><p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(agent.totalCommissions)}</p></div>
              <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-green-600 uppercase">Cobrado</p><p className="text-sm font-bold text-green-700 mt-0.5">{formatCurrency(agent.collectedCommissions)}</p></div>
              <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-amber-600 uppercase">Pendiente</p><p className="text-sm font-bold text-amber-700 mt-0.5">{formatCurrency(agent.pendingCommissions)}</p></div>
            </div>
          </div>
        ))}
      </div>

      {unassignedDeals.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <HiClock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800"><span className="font-bold">{unassignedDeals.length} negocio(s)</span> sin agente asignado.</p>
        </div>
      )}

      {/* Month Selector (shared) */}
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

      {/* Monthly Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <HiChartBar className="w-5 h-5 text-blue-600" />
          Últimos 6 Meses
        </h2>
        <div className="flex items-end gap-3 h-40">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-1 items-end" style={{ height: "120px" }}>
                <div
                  className="flex-1 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-md transition-all"
                  style={{ height: `${(d.commissions / chartMax) * 120}px`, minHeight: d.commissions > 0 ? "4px" : "0" }}
                  title={`Comisiones: ${formatCurrency(d.commissions)}`}
                />
                <div
                  className="flex-1 bg-gradient-to-t from-red-400 to-rose-300 rounded-t-md transition-all"
                  style={{ height: `${(d.expenses / chartMax) * 120}px`, minHeight: d.expenses > 0 ? "4px" : "0" }}
                  title={`Gastos: ${formatCurrency(d.expenses)}`}
                />
              </div>
              <span className="text-[10px] font-semibold text-gray-500">{d.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span className="text-xs text-gray-500">Comisiones</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-300" /><span className="text-xs text-gray-500">Gastos</span></div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
          <HiCurrencyDollar className="w-5 h-5 text-green-600" />
          Resumen de {getLabel(MONTHS, selectedMonth)} {selectedYear}
        </h2>

        {monthlyCommissionsTotal === 0 && monthlyGastosTotal === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay movimientos en este periodo</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                <p className="text-xs font-semibold text-green-600 uppercase">Comisiones</p>
                <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(monthlyCommissionsTotal)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                <p className="text-xs font-semibold text-red-600 uppercase">Gastos</p>
                <p className="text-xl font-bold text-red-700 mt-1">{formatCurrency(monthlyGastosTotal)}</p>
              </div>
              <div className={`rounded-xl p-4 text-center border ${monthlyNet >= 0 ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}>
                <p className={`text-xs font-semibold uppercase ${monthlyNet >= 0 ? "text-blue-600" : "text-orange-600"}`}>Neto</p>
                <p className={`text-xl font-bold mt-1 ${monthlyNet >= 0 ? "text-blue-700" : "text-orange-700"}`}>{formatCurrency(monthlyNet)}</p>
              </div>
            </div>

            {/* Summary by agent: bruto - gastos = neto */}
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
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-white rounded-lg p-2 text-center border border-green-100">
                      <p className="text-[10px] font-semibold text-green-600 uppercase">Bruto</p>
                      <p className="text-sm font-bold text-green-700 mt-0.5">{formatCurrency(agent.commissions)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-red-100">
                      <p className="text-[10px] font-semibold text-red-600 uppercase">Gastos</p>
                      <p className="text-sm font-bold text-red-700 mt-0.5">{formatCurrency(agent.expenses)}</p>
                    </div>
                    <div className={`bg-white rounded-lg p-2 text-center border ${agent.net >= 0 ? "border-blue-100" : "border-orange-100"}`}>
                      <p className={`text-[10px] font-semibold uppercase ${agent.net >= 0 ? "text-blue-600" : "text-orange-600"}`}>Neto</p>
                      <p className={`text-sm font-bold mt-0.5 ${agent.net >= 0 ? "text-blue-700" : "text-orange-700"}`}>{formatCurrency(agent.net)}</p>
                    </div>
                  </div>

                  {agent.payments.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Comisiones</p>
                      <div className="space-y-1">
                        {agent.payments.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 truncate pr-2">{p.dealTitle} - {p.label}</span>
                            <span className="font-semibold text-green-700 flex-shrink-0">+{formatCurrency(p.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.expenseItems.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Gastos</p>
                      <div className="space-y-1">
                        {agent.expenseItems.map((g, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 truncate pr-2">
                              {g.description}
                              {g.shared && <span className="ml-1 text-[10px] text-gray-400">(50%)</span>}
                            </span>
                            <span className="font-semibold text-red-600 flex-shrink-0">-{formatCurrency(g.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {agent.payments.length === 0 && agent.expenseItems.length === 0 && (
                    <p className="text-xs text-gray-400">Sin movimientos este mes</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Gastos */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Gastos</h2>
          <button onClick={() => { if (showGastoForm) { resetGastoForm(); } setShowGastoForm(!showGastoForm); }} className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            {showGastoForm ? <HiX className="w-4 h-4" /> : <HiPlus className="w-4 h-4" />}
            {showGastoForm ? "Cancelar" : "Agregar Gasto"}
          </button>
        </div>

        {showGastoForm && (
          <form onSubmit={handleAddGasto} className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2 md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Descripción *</label>
                <input required className={inputClass} value={gastoForm.description} onChange={(e) => setGastoForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ej: Publicidad en Facebook" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Monto *</label>
                <input required type="number" step="0.01" className={inputClass} value={gastoForm.amount} onChange={(e) => setGastoForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Moneda</label>
                <select className={inputClass} value={gastoForm.currency} onChange={(e) => setGastoForm((p) => ({ ...p, currency: e.target.value }))}>
                  {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Categoría</label>
                <select className={inputClass} value={gastoForm.category} onChange={(e) => setGastoForm((p) => ({ ...p, category: e.target.value }))}>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Agente</label>
                <select className={inputClass} value={gastoForm.assignedAgent} onChange={(e) => setGastoForm((p) => ({ ...p, assignedAgent: e.target.value }))}>
                  <option value="">Empresa</option>
                  {AGENTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha</label>
                <input type="date" className={inputClass} value={gastoForm.date} onChange={(e) => setGastoForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Notas</label>
                <input className={inputClass} value={gastoForm.notes} onChange={(e) => setGastoForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Opcional..." />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingGasto} className="bg-red-600 text-white hover:bg-red-700 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                {savingGasto ? "Guardando..." : editingGastoId ? "Actualizar Gasto" : "Guardar Gasto"}
              </button>
              {editingGastoId && (
                <button type="button" onClick={() => { resetGastoForm(); setShowGastoForm(false); }} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-5 py-2 rounded-xl text-sm font-medium">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        {gastos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay gastos registrados</p>
        ) : (
          <div className="space-y-2">
            {gastos.map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <HiCurrencyDollar className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{g.description}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(g.date)} · {getLabel(EXPENSE_CATEGORIES, g.category)}
                    {g.assignedAgent ? ` · ${getLabel(AGENTS, g.assignedAgent)}` : " · Empresa"}
                  </p>
                </div>
                <p className="text-sm font-bold text-red-600 flex-shrink-0">{formatCurrency(g.amount, g.currency)}</p>
                <button onClick={() => startEditGasto(g)} className="text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0" title="Editar">
                  <HiPencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteGasto(g.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" title="Eliminar">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
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
            <button onClick={() => setAgentFilter("ALL")} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${agentFilter === "ALL" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Todos</button>
            {AGENTS.map((a) => (
              <button key={a.value} onClick={() => setAgentFilter(a.value)} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${agentFilter === a.value ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{a.initials}</button>
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
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${deal.dealType === "VENTA" ? "bg-blue-100" : "bg-teal-100"}`}>
                    <span className={`text-sm font-bold ${deal.dealType === "VENTA" ? "text-blue-600" : "text-teal-600"}`}>{deal.dealType === "VENTA" ? "V" : "A"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{deal.property?.title || "Sin propiedad"}</p>
                    <p className="text-xs text-gray-400">
                      {deal.client ? `${deal.client.firstName} ${deal.client.lastName}` : "Sin cliente"}
                      {deal.assignedAgent ? ` · ${getLabel(AGENTS, deal.assignedAgent)}` : ""}
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
                    label={deal.assignedAgent ? getLabel(AGENTS, deal.assignedAgent) : "Sin asignar"}
                    colorClass={deal.assignedAgent === "EDGAR" ? "bg-blue-100 text-blue-700" : deal.assignedAgent === "ANA_LORENA" ? "bg-purple-100 text-purple-700" : deal.assignedAgent === "AMBOS" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}
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
