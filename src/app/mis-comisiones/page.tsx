"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { formatCurrency, formatDate, MONTHS, getLabel } from "@/lib/constants";
import { HiBriefcase, HiCheckCircle, HiClock, HiTrendingUp, HiCurrencyDollar } from "react-icons/hi";

interface CommissionPayment {
  id: string; label: string; amount: number; date: string | null; paid: boolean;
}

interface Deal {
  id: string; dealType: string; status: string;
  agreedPrice: number | null; currency: string;
  commissionAmount: number | null; commissionPaid: boolean;
  commissionPayments: string | null; assignedAgent: string | null;
  internalAgentId: string | null;
  companyShare: number | null;
  internalAgentShare: number | null;
  externalAgentShare: number | null;
  closingDate: string | null; commissionDate: string | null;
  contractStartDate: string | null; createdAt: string;
  client: { firstName: string; lastName: string } | null;
  property: { title: string } | null;
}

interface CrmUser {
  username: string;
  role: string;
  displayName: string;
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

function getCrmUser(): CrmUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith("crm_user="));
  if (!match) return null;
  const parts = decodeURIComponent(match.split("=")[1]).split(":");
  if (parts.length < 3) return null;
  return { username: parts[0], role: parts[1], displayName: parts.slice(2).join(":") };
}

/**
 * Computes the agent's commission share for a deal.
 * For agents, prefers internalAgentShare; falls back to commissionAmount if no splits set.
 */
function myShareFromDeal(deal: Deal): number {
  if (deal.internalAgentShare != null) return deal.internalAgentShare;
  if (deal.commissionAmount != null) return deal.commissionAmount;
  return 0;
}

export default function MisComisionesPage() {
  const [user, setUser] = useState<CrmUser | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setUser(getCrmUser());
    fetch("/api/deals").then((r) => r.json()).then((d) => setDeals(Array.isArray(d) ? d : [])).catch(() => setDeals([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;

  // All deals are already filtered by API for agent role
  let totalCommissions = 0, collected = 0, pending = 0;
  let closedCount = 0;
  for (const d of deals) {
    const share = myShareFromDeal(d);
    totalCommissions += share;
    if (d.status === "CERRADO") closedCount++;

    const ratio = (d.commissionAmount && d.commissionAmount > 0) ? share / d.commissionAmount : 1;
    const payments = parsePayments(d.commissionPayments);
    if (payments.length > 0) {
      for (const p of payments) {
        if (p.paid) collected += p.amount * ratio;
        else pending += p.amount * ratio;
      }
    } else {
      if (d.commissionPaid) collected += share;
      else pending += share;
    }
  }

  // Monthly breakdown
  const monthlyPayments: { amount: number; label: string; date: string; dealTitle: string }[] = [];
  for (const d of deals) {
    const share = myShareFromDeal(d);
    const ratio = (d.commissionAmount && d.commissionAmount > 0) ? share / d.commissionAmount : 1;
    const payments = parsePayments(d.commissionPayments);
    for (const p of payments) {
      if (p.paid && p.date) {
        const dt = parseLocalDate(p.date);
        if (dt.getMonth() + 1 === selectedMonth && dt.getFullYear() === selectedYear) {
          monthlyPayments.push({
            amount: p.amount * ratio,
            label: p.label,
            date: p.date,
            dealTitle: d.property?.title || "Sin propiedad",
          });
        }
      }
    }
    if (payments.length === 0 && d.commissionPaid && share > 0) {
      const paymentDateStr = d.commissionDate || d.closingDate || d.contractStartDate;
      if (paymentDateStr) {
        const dt = parseLocalDate(paymentDateStr);
        if (dt.getMonth() + 1 === selectedMonth && dt.getFullYear() === selectedYear) {
          monthlyPayments.push({
            amount: share,
            label: "Pago completo",
            date: paymentDateStr,
            dealTitle: d.property?.title || "Sin propiedad",
          });
        }
      }
    }
  }
  const monthlyTotal = monthlyPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="Mis Comisiones" subtitle={user ? `${user.displayName} — tus números personales` : ""} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Mis Negocios</p>
            <HiBriefcase className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{deals.length}</p>
          <p className="text-[10px] text-gray-400 mt-1">{closedCount} cerrados</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-purple-600 uppercase">Total Generado</p>
            <HiTrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalCommissions)}</p>
          <p className="text-[10px] text-gray-400 mt-1">Mi parte</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-emerald-600 uppercase">Cobrado</p>
            <HiCheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(collected)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-amber-600 uppercase">Pendiente</p>
            <HiClock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(pending)}</p>
        </div>
      </div>

      {/* Monthly */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <HiCurrencyDollar className="w-5 h-5 text-emerald-600" />
            Cobros del Mes
          </h2>
          <div className="flex gap-2">
            <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select className="px-3 py-1.5 text-sm border border-gray-200 rounded-xl" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-600 uppercase">Total del mes</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{formatCurrency(monthlyTotal)}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">{getLabel(MONTHS, selectedMonth)} {selectedYear}</p>
        </div>
        {monthlyPayments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin cobros este mes</p>
        ) : (
          <div className="space-y-2">
            {monthlyPayments.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{p.dealTitle}</p>
                  <p className="text-xs text-gray-400">{p.label} · {formatDate(p.date)}</p>
                </div>
                <p className="text-sm font-bold text-emerald-600">+{formatCurrency(p.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My deals */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <HiBriefcase className="w-5 h-5 text-blue-600" />
          Mis Negocios
        </h2>
        {deals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No tienes negocios aún</p>
        ) : (
          <div className="space-y-2">
            {deals.map((deal) => {
              const myShare = myShareFromDeal(deal);
              const payments = parsePayments(deal.commissionPayments);
              const ratio = (deal.commissionAmount && deal.commissionAmount > 0) ? myShare / deal.commissionAmount : 1;
              const myCollected = payments.length > 0
                ? payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0) * ratio
                : (deal.commissionPaid ? myShare : 0);
              return (
                <Link key={deal.id} href={`/negocios/${deal.id}`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${deal.dealType === "VENTA" ? "bg-blue-100" : "bg-teal-100"}`}>
                    <span className={`text-sm font-bold ${deal.dealType === "VENTA" ? "text-blue-600" : "text-teal-600"}`}>{deal.dealType === "VENTA" ? "V" : "A"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{deal.property?.title || "Sin propiedad"}</p>
                    <p className="text-xs text-gray-400">{deal.client ? `${deal.client.firstName} ${deal.client.lastName}` : "Sin cliente"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(myCollected)}</p>
                    <p className="text-[10px] text-gray-400">de {formatCurrency(myShare)}</p>
                  </div>
                  <StatusBadge label={deal.status} colorClass={deal.status === "CERRADO" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
