"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  MONTHS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, CURRENCIES,
  formatCurrency, formatDate, getLabel,
} from "@/lib/constants";
import {
  HiCurrencyDollar, HiBriefcase, HiCheckCircle, HiClock,
  HiTrendingUp, HiTrash, HiPlus, HiX, HiChartBar, HiPencil,
} from "react-icons/hi";

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

interface Gasto {
  id: string; description: string; amount: number; currency: string;
  category: string; assignedAgent: string | null; date: string; notes: string | null;
  createdAt: string;
}

interface Ingreso {
  id: string; description: string; amount: number; currency: string;
  category: string; clientName: string | null; assignedAgent: string | null;
  date: string; notes: string | null; createdAt: string;
}

interface AgentSummary {
  agent: string; label: string; initials: string; color: string;
  totalDeals: number; closedDeals: number;
  totalCommissions: number; collectedCommissions: number; pendingCommissions: number;
  totalExpenses: number; totalExtraIncome: number; netIncome: number;
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

    for (const p of payments) {
      if (p.paid && p.date) {
        const d = parseLocalDate(p.date);
        if (d.getMonth() + 1 === month && d.getFullYear() === year) {
          if (hasSplits && deal.commissionAmount && deal.commissionAmount > 0) {
            const commTotal = deal.commissionAmount;
            if (deal.companyShare != null) {
              pushSplit(brokerCode, p.amount * (deal.companyShare / commTotal), p.label);
            }
            if (deal.internalAgentShare != null && deal.assignedAgent) {
              pushSplit(deal.assignedAgent, p.amount * (deal.internalAgentShare / commTotal), p.label);
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
function getAgentShareFromDeal(deal: Deal, agent: AgentRow): number {
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

    // Broker receives the company share
    if (agent.role === "broker" && deal.companyShare != null) {
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

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function ContabilidadPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [agents, setAgents] = useState<AgentRow[]>([]);
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
  const [showIngresoForm, setShowIngresoForm] = useState(false);
  const [savingIngreso, setSavingIngreso] = useState(false);
  const [editingIngresoId, setEditingIngresoId] = useState<string | null>(null);
  const [ingresoForm, setIngresoForm] = useState({
    description: "", amount: "", currency: "USD",
    category: "REDACCION_CONTRATO", clientName: "", assignedAgent: "",
    date: new Date().toISOString().split("T")[0], notes: "",
  });

  function resetIngresoForm() {
    setIngresoForm({
      description: "", amount: "", currency: "USD",
      category: "REDACCION_CONTRATO", clientName: "", assignedAgent: "",
      date: new Date().toISOString().split("T")[0], notes: "",
    });
    setEditingIngresoId(null);
  }

  function startEditIngreso(i: Ingreso) {
    setEditingIngresoId(i.id);
    setIngresoForm({
      description: i.description || "",
      amount: String(i.amount ?? ""),
      currency: i.currency || "USD",
      category: i.category || "OTRO",
      clientName: i.clientName || "",
      assignedAgent: i.assignedAgent || "",
      date: (i.date || "").slice(0, 10) || new Date().toISOString().split("T")[0],
      notes: i.notes || "",
    });
    setShowIngresoForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      fetch("/api/agents?active=1").then((r) => r.json()).catch(() => []),
      fetch("/api/ingresos").then((r) => r.json()).then((g) => Array.isArray(g) ? g : []).catch(() => []),
    ]).then(([d, g, a, i]) => {
      setDeals(Array.isArray(d) ? d : []);
      setGastos(g);
      setAgents(Array.isArray(a) ? a : []);
      setIngresos(i);
    }).finally(() => setLoading(false));
  }, []);

  // Show broker + admin agents in the breakdown (skip pure agents like Valentina who manage themselves)
  // ...actually show ALL active agents for completeness
  const individualAgents = agents;

  // Total gastos per agent (direct match by code, AMBOS/null = 50/50 between broker + admin)
  const splitAgents = agents.filter((a) => a.role === "broker" || a.role === "admin");
  function totalGastosForAgent(agent: AgentRow) {
    let total = 0;
    for (const g of gastos) {
      const ag = (g.assignedAgent || "").toLowerCase();
      if (ag === agent.code.toLowerCase()) total += g.amount;
      else if ((!g.assignedAgent || ag === "ambos") && splitAgents.some((s) => s.id === agent.id)) {
        total += g.amount / Math.max(splitAgents.length, 1);
      }
    }
    return total;
  }
  const totalGastosCompany = gastos.reduce((s, g) => s + g.amount, 0);

  function totalIngresosForAgent(agent: AgentRow) {
    let total = 0;
    for (const i of ingresos) {
      const ag = (i.assignedAgent || "").toLowerCase();
      if (ag === agent.code.toLowerCase()) total += i.amount;
      else if ((!i.assignedAgent || ag === "ambos") && splitAgents.some((s) => s.id === agent.id)) {
        total += i.amount / Math.max(splitAgents.length, 1);
      }
    }
    return total;
  }
  const totalIngresosCompany = ingresos.reduce((s, i) => s + i.amount, 0);

  const agentSummaries: AgentSummary[] = individualAgents.map((agent) => {
    let totalCommissions = 0, collectedCommissions = 0, pendingCommissions = 0;
    let totalDeals = 0, closedDeals = 0;
    const myDeals: Deal[] = [];

    for (const deal of deals) {
      const share = getAgentShareFromDeal(deal, agent);
      if (share === 0) continue;
      myDeals.push(deal);
      totalDeals++;
      if (deal.status === "CERRADO") closedDeals++;
      totalCommissions += share;

      // Apply collected/pending proportionally
      const commTotal = deal.commissionAmount || 0;
      const ratio = commTotal > 0 ? share / commTotal : 1;
      const payments = parsePayments(deal.commissionPayments);
      if (payments.length > 0) {
        for (const p of payments) {
          if (p.paid) collectedCommissions += p.amount * ratio;
          else pendingCommissions += p.amount * ratio;
        }
      } else {
        if (deal.commissionPaid) collectedCommissions += share;
        else pendingCommissions += share;
      }
    }
    const totalExpenses = totalGastosForAgent(agent);
    const totalExtraIncome = totalIngresosForAgent(agent);
    return {
      agent: agent.code.toUpperCase(),
      label: agent.fullName,
      initials: agent.initials || agent.fullName.charAt(0),
      color: agent.color || "from-slate-500 to-slate-600",
      totalDeals, closedDeals,
      totalCommissions, collectedCommissions, pendingCommissions,
      totalExpenses, totalExtraIncome,
      netIncome: collectedCommissions + totalExtraIncome - totalExpenses,
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
  const companyNet = companyTotal.collectedCommissions + totalIngresosCompany - totalGastosCompany;

  const unassignedDeals = deals.filter((d) => !d.assignedAgent);

  // Broker's code for split attribution
  const brokerAgent = agents.find((a) => a.role === "broker");
  const brokerCode = (brokerAgent?.code || "EDGAR").toUpperCase();

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

  // Monthly expenses (null agent or "AMBOS" → split 50/50)
  const monthlyGastos = gastos.filter((g) => {
    const d = new Date(g.date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });
  const monthlyGastosTotal = monthlyGastos.reduce((s, g) => s + g.amount, 0);

  const monthlyIngresos = ingresos.filter((i) => {
    const d = new Date(i.date);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });
  const monthlyIngresosTotal = monthlyIngresos.reduce((s, i) => s + i.amount, 0);

  const monthlyNet = monthlyCommissionsTotal + monthlyIngresosTotal - monthlyGastosTotal;

  function gastosForAgent(agent: AgentRow) {
    let total = 0;
    const items: { description: string; amount: number; category: string; shared: boolean }[] = [];
    const isSplit = splitAgents.some((s) => s.id === agent.id);
    for (const g of monthlyGastos) {
      const ag = (g.assignedAgent || "").toLowerCase();
      if (ag === agent.code.toLowerCase()) {
        total += g.amount;
        items.push({ description: g.description, amount: g.amount, category: g.category, shared: false });
      } else if ((!g.assignedAgent || ag === "ambos") && isSplit) {
        const portion = g.amount / Math.max(splitAgents.length, 1);
        total += portion;
        items.push({ description: g.description, amount: portion, category: g.category, shared: true });
      }
    }
    return { total, items };
  }

  function ingresosForAgent(agent: AgentRow) {
    let total = 0;
    const items: { description: string; amount: number; category: string; clientName: string | null; shared: boolean }[] = [];
    const isSplit = splitAgents.some((s) => s.id === agent.id);
    for (const i of monthlyIngresos) {
      const ag = (i.assignedAgent || "").toLowerCase();
      if (ag === agent.code.toLowerCase()) {
        total += i.amount;
        items.push({ description: i.description, amount: i.amount, category: i.category, clientName: i.clientName, shared: false });
      } else if ((!i.assignedAgent || ag === "ambos") && isSplit) {
        const portion = i.amount / Math.max(splitAgents.length, 1);
        total += portion;
        items.push({ description: i.description, amount: portion, category: i.category, clientName: i.clientName, shared: true });
      }
    }
    return { total, items };
  }

  const monthlyByAgent = individualAgents.map((agent) => {
    const codeUpper = agent.code.toUpperCase();
    const payments = monthlyPayments.filter((p) => (p.agent || "").toUpperCase() === codeUpper);
    const commissions = payments.reduce((s, p) => s + p.amount, 0);
    const { total: expenses, items: expenseItems } = gastosForAgent(agent);
    const { total: extraIncome, items: incomeItems } = ingresosForAgent(agent);
    return {
      value: codeUpper,
      label: agent.fullName,
      initials: agent.initials || agent.fullName.charAt(0),
      color: agent.color || "from-slate-500 to-slate-600",
      payments,
      total: commissions + extraIncome,
      commissions,
      extraIncome,
      expenses,
      net: commissions + extraIncome - expenses,
      expenseItems,
      incomeItems,
    };
  });

  // Last 6 months chart data
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(selectedYear, selectedMonth - 1 - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: getLabel(MONTHS, d.getMonth() + 1) as string };
  });
  const chartData = chartMonths.map(({ month, year, label }) => {
    const raw = getCommissionsByMonth(deals, month, year, brokerCode);
    // Sum total commissions for the month (no need to split by agent for chart total)
    const commissions = raw.reduce((s, p) => s + p.amount, 0);
    const expenses = gastos.filter((g) => {
      const d = new Date(g.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    }).reduce((s, g) => s + g.amount, 0);
    return { label: label.slice(0, 3), commissions, expenses, net: commissions - expenses };
  });
  const chartMax = Math.max(...chartData.map((d) => Math.max(d.commissions, d.expenses)), 1);

  const displayDeals = agentFilter === "ALL" ? deals : deals.filter((d) => (d.assignedAgent || "").toUpperCase() === agentFilter);

  function agentLabel(agentCode: string | null | undefined): string {
    if (!agentCode) return "Empresa";
    if (agentCode.toUpperCase() === "AMBOS") return "Ambos";
    const a = agents.find((x) => x.code.toLowerCase() === agentCode.toLowerCase());
    return a ? a.fullName : agentCode;
  }

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

  async function handleAddIngreso(e: React.FormEvent) {
    e.preventDefault();
    setSavingIngreso(true);
    try {
      const payload = {
        ...ingresoForm,
        amount: parseFloat(ingresoForm.amount),
        clientName: ingresoForm.clientName || null,
        assignedAgent: ingresoForm.assignedAgent || null,
        date: ingresoForm.date,
        notes: ingresoForm.notes || null,
      };
      if (editingIngresoId) {
        const res = await fetch(`/api/ingresos/${editingIngresoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setIngresos((prev) => prev.map((i) => (i.id === editingIngresoId ? { ...i, ...updated } : i)));
          setShowIngresoForm(false);
          resetIngresoForm();
        }
      } else {
        const res = await fetch("/api/ingresos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const newIngreso = await res.json();
          setIngresos((prev) => [newIngreso, ...prev]);
          setShowIngresoForm(false);
          resetIngresoForm();
        }
      }
    } finally { setSavingIngreso(false); }
  }

  async function handleDeleteIngreso(id: string) {
    if (!confirm("¿Eliminar este ingreso?")) return;
    const res = await fetch(`/api/ingresos/${id}`, { method: "DELETE" });
    if (res.ok) setIngresos((prev) => prev.filter((i) => i.id !== id));
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-blue-600 uppercase">Negocios</p><p className="text-2xl font-bold text-blue-800 mt-1">{companyTotal.totalDeals}</p></div>
          <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-green-600 uppercase">Cerrados</p><p className="text-2xl font-bold text-green-800 mt-1">{companyTotal.closedDeals}</p></div>
          <div className="bg-purple-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-purple-600 uppercase">Total Comisiones</p><p className="text-xl font-bold text-purple-800 mt-1">{formatCurrency(companyTotal.totalCommissions)}</p></div>
          <div className="bg-amber-50 rounded-xl p-4 text-center"><p className="text-xs font-semibold text-amber-600 uppercase">Pendiente Cobro</p><p className="text-xl font-bold text-amber-800 mt-1">{formatCurrency(companyTotal.pendingCommissions)}</p></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100"><p className="text-xs font-semibold text-emerald-600 uppercase">Comisiones</p><p className="text-xl font-bold text-emerald-800 mt-1">{formatCurrency(companyTotal.collectedCommissions)}</p><p className="text-[10px] text-emerald-500 mt-0.5">Cobradas</p></div>
          <div className="bg-teal-50 rounded-xl p-4 text-center border border-teal-100"><p className="text-xs font-semibold text-teal-600 uppercase">Ingresos Extra</p><p className="text-xl font-bold text-teal-800 mt-1">{formatCurrency(totalIngresosCompany)}</p><p className="text-[10px] text-teal-500 mt-0.5">Contratos, asesorías</p></div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100"><p className="text-xs font-semibold text-red-600 uppercase">Gastos Totales</p><p className="text-xl font-bold text-red-800 mt-1">{formatCurrency(totalGastosCompany)}</p><p className="text-[10px] text-red-500 mt-0.5">Todos los gastos</p></div>
          <div className={`rounded-xl p-4 text-center border ${companyNet >= 0 ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}><p className={`text-xs font-semibold uppercase ${companyNet >= 0 ? "text-blue-600" : "text-orange-600"}`}>Ingreso Neto</p><p className={`text-xl font-bold mt-1 ${companyNet >= 0 ? "text-blue-800" : "text-orange-800"}`}>{formatCurrency(companyNet)}</p><p className={`text-[10px] mt-0.5 ${companyNet >= 0 ? "text-blue-500" : "text-orange-500"}`}>Total − Gastos</p></div>
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
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-gray-400 uppercase">Total</p><p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(agent.totalCommissions)}</p></div>
              <div className="bg-green-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-green-600 uppercase">Cobrado</p><p className="text-sm font-bold text-green-700 mt-0.5">{formatCurrency(agent.collectedCommissions)}</p></div>
              <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-[10px] font-semibold text-amber-600 uppercase">Pendiente</p><p className="text-sm font-bold text-amber-700 mt-0.5">{formatCurrency(agent.pendingCommissions)}</p></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100"><p className="text-[10px] font-semibold text-emerald-600 uppercase">Comis.</p><p className="text-sm font-bold text-emerald-700 mt-0.5">{formatCurrency(agent.collectedCommissions)}</p></div>
              <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-100"><p className="text-[10px] font-semibold text-teal-600 uppercase">Extra</p><p className="text-sm font-bold text-teal-700 mt-0.5">{formatCurrency(agent.totalExtraIncome)}</p></div>
              <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100"><p className="text-[10px] font-semibold text-red-600 uppercase">Gastos</p><p className="text-sm font-bold text-red-700 mt-0.5">{formatCurrency(agent.totalExpenses)}</p></div>
              <div className={`rounded-xl p-3 text-center border ${agent.netIncome >= 0 ? "bg-blue-50 border-blue-100" : "bg-orange-50 border-orange-100"}`}><p className={`text-[10px] font-semibold uppercase ${agent.netIncome >= 0 ? "text-blue-600" : "text-orange-600"}`}>Neto</p><p className={`text-sm font-bold mt-0.5 ${agent.netIncome >= 0 ? "text-blue-700" : "text-orange-700"}`}>{formatCurrency(agent.netIncome)}</p></div>
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

        {monthlyCommissionsTotal === 0 && monthlyGastosTotal === 0 && monthlyIngresosTotal === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No hay movimientos en este periodo</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                <p className="text-xs font-semibold text-green-600 uppercase">Comisiones</p>
                <p className="text-xl font-bold text-green-700 mt-1">{formatCurrency(monthlyCommissionsTotal)}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center border border-teal-100">
                <p className="text-xs font-semibold text-teal-600 uppercase">Ingresos Extra</p>
                <p className="text-xl font-bold text-teal-700 mt-1">{formatCurrency(monthlyIngresosTotal)}</p>
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

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-white rounded-lg p-2 text-center border border-green-100">
                      <p className="text-[10px] font-semibold text-green-600 uppercase">Comis.</p>
                      <p className="text-sm font-bold text-green-700 mt-0.5">{formatCurrency(agent.commissions)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-teal-100">
                      <p className="text-[10px] font-semibold text-teal-600 uppercase">Extra</p>
                      <p className="text-sm font-bold text-teal-700 mt-0.5">{formatCurrency(agent.extraIncome)}</p>
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

                  {agent.incomeItems.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Ingresos extra</p>
                      <div className="space-y-1">
                        {agent.incomeItems.map((it, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 truncate pr-2">
                              {it.description}{it.clientName ? ` · ${it.clientName}` : ""}
                              {it.shared && <span className="ml-1 text-[10px] text-gray-400">(50%)</span>}
                            </span>
                            <span className="font-semibold text-teal-700 flex-shrink-0">+{formatCurrency(it.amount)}</span>
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

                  {agent.payments.length === 0 && agent.expenseItems.length === 0 && agent.incomeItems.length === 0 && (
                    <p className="text-xs text-gray-400">Sin movimientos este mes</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ingresos Extra */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ingresos Extra</h2>
            <p className="text-xs text-gray-400">Redacción de contratos, asesorías, comisiones por referidos, etc.</p>
          </div>
          <button onClick={() => { if (showIngresoForm) { resetIngresoForm(); } setShowIngresoForm(!showIngresoForm); }} className="flex items-center gap-2 bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
            {showIngresoForm ? <HiX className="w-4 h-4" /> : <HiPlus className="w-4 h-4" />}
            {showIngresoForm ? "Cancelar" : "Agregar Ingreso"}
          </button>
        </div>

        {showIngresoForm && (
          <form onSubmit={handleAddIngreso} className="bg-teal-50 rounded-xl p-4 mb-5 border border-teal-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2 md:col-span-1">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Descripción *</label>
                <input required className={inputClass} value={ingresoForm.description} onChange={(e) => setIngresoForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ej: Redacción de contrato" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Monto *</label>
                <input required type="number" step="0.01" className={inputClass} value={ingresoForm.amount} onChange={(e) => setIngresoForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Moneda</label>
                <select className={inputClass} value={ingresoForm.currency} onChange={(e) => setIngresoForm((p) => ({ ...p, currency: e.target.value }))}>
                  {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Categoría</label>
                <select className={inputClass} value={ingresoForm.category} onChange={(e) => setIngresoForm((p) => ({ ...p, category: e.target.value }))}>
                  {INCOME_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Cliente</label>
                <input className={inputClass} value={ingresoForm.clientName} onChange={(e) => setIngresoForm((p) => ({ ...p, clientName: e.target.value }))} placeholder="Ej: Mario Rangel" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Agente</label>
                <select className={inputClass} value={ingresoForm.assignedAgent} onChange={(e) => setIngresoForm((p) => ({ ...p, assignedAgent: e.target.value }))}>
                  <option value="">Empresa</option>
                  {agents.map((a) => <option key={a.id} value={a.code.toUpperCase()}>{a.fullName}</option>)}
                  <option value="AMBOS">Compartido</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Fecha</label>
                <input type="date" className={inputClass} value={ingresoForm.date} onChange={(e) => setIngresoForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 md:col-span-3">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Notas</label>
                <input className={inputClass} value={ingresoForm.notes} onChange={(e) => setIngresoForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Opcional..." />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={savingIngreso} className="bg-teal-600 text-white hover:bg-teal-700 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
                {savingIngreso ? "Guardando..." : editingIngresoId ? "Actualizar Ingreso" : "Guardar Ingreso"}
              </button>
              {editingIngresoId && (
                <button type="button" onClick={() => { resetIngresoForm(); setShowIngresoForm(false); }} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-5 py-2 rounded-xl text-sm font-medium">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        {ingresos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No hay ingresos extra registrados</p>
        ) : (
          <div className="space-y-2">
            {ingresos.map((i) => (
              <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <HiCurrencyDollar className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{i.description}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(i.date)} · {getLabel(INCOME_CATEGORIES, i.category)}
                    {i.clientName ? ` · ${i.clientName}` : ""}
                    {i.assignedAgent ? ` · ${agentLabel(i.assignedAgent)}` : " · Empresa"}
                  </p>
                </div>
                <p className="text-sm font-bold text-teal-700 flex-shrink-0">+{formatCurrency(i.amount, i.currency)}</p>
                <button onClick={() => startEditIngreso(i)} className="text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0" title="Editar">
                  <HiPencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteIngreso(i.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" title="Eliminar">
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
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
                  {agents.map((a) => <option key={a.id} value={a.code.toUpperCase()}>{a.fullName}</option>)}
                  <option value="AMBOS">Compartido</option>
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
                    {g.assignedAgent ? ` · ${agentLabel(g.assignedAgent)}` : " · Empresa"}
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
    </div>
  );
}
