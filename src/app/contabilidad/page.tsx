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
  HiTrash, HiPlus, HiX, HiChartBar, HiPencil,
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
  const [tab, setTab] = useState<"resumen" | "movimientos" | "negocios">("resumen");
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [savingGasto, setSavingGasto] = useState(false);
  const [editingGastoId, setEditingGastoId] = useState<string | null>(null);
  const [gastoMonth, setGastoMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [gastoYear, setGastoYear] = useState<number>(new Date().getFullYear());
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

  const filteredGastos = gastos.filter((g) => {
    if (gastoMonth === "ALL") return true;
    const d = parseLocalDate(g.date);
    return d.getMonth() + 1 === Number(gastoMonth) && d.getFullYear() === gastoYear;
  });
  const filteredGastosTotal = filteredGastos.reduce((s, g) => s + g.amount, 0);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;

  return (
    <div>
      <PageHeader title="Contabilidad" subtitle="Comisiones, ingresos y gastos" />

      {/* Hero — resultado de la empresa */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 mb-6">
        <div className="pointer-events-none absolute -right-20 -top-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-400 uppercase">Ingreso Neto</p>
            <p className={`text-4xl sm:text-5xl font-bold mt-2 tracking-tight ${companyNet >= 0 ? "text-white" : "text-orange-300"}`}>
              {formatCurrency(companyNet)}
            </p>
            <p className="text-xs text-slate-400 mt-2">Comisiones cobradas + ingresos extra − gastos</p>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:min-w-[400px]">
            <HeroStat label="Cobrado" value={formatCurrency(companyTotal.collectedCommissions)} dot="bg-emerald-400" />
            <HeroStat label="Extra" value={formatCurrency(totalIngresosCompany)} dot="bg-sky-400" />
            <HeroStat label="Gastos" value={formatCurrency(totalGastosCompany)} dot="bg-rose-400" />
          </div>
        </div>

        <div className="relative mt-7 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-5">
          <HeroMini label="Negocios" value={String(companyTotal.totalDeals)} />
          <HeroMini label="Cerrados" value={String(companyTotal.closedDeals)} />
          <HeroMini label="Comisiones totales" value={formatCurrency(companyTotal.totalCommissions)} />
          <HeroMini label="Pendiente por cobrar" value={formatCurrency(companyTotal.pendingCommissions)} accent="text-amber-300" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-full sm:w-fit">
        {([
          { id: "resumen", label: "Resumen", icon: HiChartBar },
          { id: "movimientos", label: "Movimientos", icon: HiCurrencyDollar },
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-gray-900">Últimos 6 meses</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">Comisiones</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /><span className="text-xs text-gray-500">Gastos</span></div>
          </div>
        </div>

        <div className="flex items-end gap-2 sm:gap-4">
          {chartData.map((d, i) => {
            const isCurrent = i === chartData.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex gap-1 sm:gap-1.5 items-end justify-center" style={{ height: "150px" }}>
                  <div
                    className="flex-1 max-w-[26px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                    style={{ height: `${(d.commissions / chartMax) * 100}%`, minHeight: d.commissions > 0 ? "4px" : "0" }}
                    title={`Comisiones: ${formatCurrency(d.commissions)}`}
                  />
                  <div
                    className="flex-1 max-w-[26px] bg-gradient-to-t from-rose-500 to-rose-300 rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                    style={{ height: `${(d.expenses / chartMax) * 100}%`, minHeight: d.expenses > 0 ? "4px" : "0" }}
                    title={`Gastos: ${formatCurrency(d.expenses)}`}
                  />
                </div>
                <span className={`text-[11px] font-semibold ${isCurrent ? "text-slate-900" : "text-gray-400"}`}>{d.label}</span>
                <span className={`text-[10px] font-bold ${d.net >= 0 ? "text-emerald-600" : "text-rose-500"}`} title={`Neto: ${formatCurrency(d.net)}`}>
                  {d.net >= 0 ? "+" : "−"}{compactMoney(Math.abs(d.net))}
                </span>
              </div>
            );
          })}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-emerald-50 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wide">Comisiones</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">{formatCurrency(monthlyCommissionsTotal)}</p>
              </div>
              <div className="bg-sky-50 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-sky-600/70 uppercase tracking-wide">Ingresos Extra</p>
                <p className="text-xl font-bold text-sky-700 mt-1">{formatCurrency(monthlyIngresosTotal)}</p>
              </div>
              <div className="bg-rose-50 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-rose-600/70 uppercase tracking-wide">Gastos</p>
                <p className="text-xl font-bold text-rose-700 mt-1">{formatCurrency(monthlyGastosTotal)}</p>
              </div>
              <div className="bg-slate-900 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Neto</p>
                <p className={`text-xl font-bold mt-1 ${monthlyNet >= 0 ? "text-white" : "text-orange-300"}`}>{formatCurrency(monthlyNet)}</p>
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
                    <MiniTile label="Comis." value={formatCurrency(agent.commissions)} tone="emerald" />
                    <MiniTile label="Extra" value={formatCurrency(agent.extraIncome)} tone="sky" />
                    <MiniTile label="Gastos" value={formatCurrency(agent.expenses)} tone="rose" />
                    <div className="rounded-xl px-2 py-2.5 text-center bg-slate-900">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Neto</p>
                      <p className={`text-[13px] font-bold mt-0.5 truncate ${agent.net >= 0 ? "text-white" : "text-orange-300"}`}>{formatCurrency(agent.net)}</p>
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

      {/* Agentes — totales históricos */}
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
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Neto</p>
                  <p className={`text-lg font-bold ${agent.netIncome >= 0 ? "text-slate-900" : "text-orange-600"}`}>{formatCurrency(agent.netIncome)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-gray-400">Cobrado {Math.round(pct)}%</span>
                <span className="text-gray-500 font-medium">{formatCurrency(agent.collectedCommissions)} / {formatCurrency(agent.totalCommissions)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <MiniTile label="Comis." value={formatCurrency(agent.collectedCommissions)} tone="emerald" />
                <MiniTile label="Extra" value={formatCurrency(agent.totalExtraIncome)} tone="sky" />
                <MiniTile label="Gastos" value={formatCurrency(agent.totalExpenses)} tone="rose" />
                <MiniTile label="Pend." value={formatCurrency(agent.pendingCommissions)} tone="amber" />
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {tab === "movimientos" && (
        <>
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
          <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">Gastos</h2>
            <span className="text-sm font-bold text-red-600">{formatCurrency(filteredGastosTotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <select value={gastoMonth} onChange={(e) => setGastoMonth(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white">
              <option value="ALL">Todos</option>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={gastoYear} onChange={(e) => setGastoYear(parseInt(e.target.value))} className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white" disabled={gastoMonth === "ALL"}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => { if (showGastoForm) { resetGastoForm(); } setShowGastoForm(!showGastoForm); }} className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              {showGastoForm ? <HiX className="w-4 h-4" /> : <HiPlus className="w-4 h-4" />}
              {showGastoForm ? "Cancelar" : "Agregar"}
            </button>
          </div>
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

        {filteredGastos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">{gastoMonth === "ALL" ? "No hay gastos registrados" : "No hay gastos en este periodo"}</p>
        ) : (
          <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
            {filteredGastos.map((g) => (
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
