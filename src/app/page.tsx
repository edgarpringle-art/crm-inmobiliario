"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  formatCurrency,
  formatDate,
  DEAL_STATUSES,
  getStatusColor,
  getLabel,
  DEAL_TYPES,
} from "@/lib/constants";
import {
  HiUsers,
  HiOfficeBuilding,
  HiBriefcase,
  HiCurrencyDollar,
  HiExclamation,
  HiTrendingUp,
  HiPlus,
} from "react-icons/hi";

interface DashboardData {
  totalClients: number;
  activeClients: number;
  totalProperties: number;
  availableProperties: number;
  totalDeals: number;
  closedDeals: number;
  totalCommissions: number;
  recentDeals: Array<{
    id: string;
    dealType: string;
    status: string;
    agreedPrice: number;
    currency: string;
    closingDate: string | null;
    client: { firstName: string; lastName: string } | null;
    property: { title: string } | null;
  }>;
  expiringContracts: Array<{
    id: string;
    contractEndDate: string;
    monthlyRent: number;
    currency: string;
    client: { firstName: string; lastName: string } | null;
    property: { title: string } | null;
  }>;
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString("es-DO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getDaysRemainingColor(days: number): string {
  if (days < 0) return "text-red-600 bg-red-50 border-red-200";
  if (days < 15) return "text-red-600 bg-red-50 border-red-200";
  if (days < 30) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-blue-600 bg-blue-50 border-blue-200";
}

const statCards = [
  {
    key: "clients" as const,
    title: "Total Clientes",
    icon: HiUsers,
    gradient: "stat-blue",
    iconColor: "text-blue-600",
    getValue: (d: DashboardData) => d.totalClients,
    getSub: (d: DashboardData) => `${d.activeClients} activos`,
    href: "/clientes",
  },
  {
    key: "properties" as const,
    title: "Total Propiedades",
    icon: HiOfficeBuilding,
    gradient: "stat-purple",
    iconColor: "text-purple-600",
    getValue: (d: DashboardData) => d.totalProperties,
    getSub: (d: DashboardData) => `${d.availableProperties} disponibles`,
    href: "/propiedades",
  },
  {
    key: "deals" as const,
    title: "Negocios Cerrados",
    icon: HiBriefcase,
    gradient: "stat-orange",
    iconColor: "text-orange-600",
    getValue: (d: DashboardData) => d.closedDeals,
    getSub: (d: DashboardData) => `de ${d.totalDeals} total`,
    href: "/negocios",
  },
  {
    key: "commissions" as const,
    title: "Comisiones Totales",
    icon: HiCurrencyDollar,
    gradient: "stat-green",
    iconColor: "text-emerald-600",
    getValue: (d: DashboardData) => formatCurrency(d.totalCommissions),
    getSub: () => "acumulado",
    href: "/negocios",
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Error al cargar el dashboard");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-2xl shadow-sm p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <HiExclamation className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-600 font-semibold text-lg mb-1">Error de conexion</p>
          <p className="text-gray-500 text-sm mb-4">{error || "No se pudieron cargar los datos"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Bienvenido <span className="gradient-text">Edgar</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{getTodayFormatted()}</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Link href="/clientes/nuevo" className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <HiPlus className="w-4 h-4" /> Cliente
          </Link>
          <Link href="/propiedades/nuevo" className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <HiPlus className="w-4 h-4" /> Propiedad
          </Link>
          <Link href="/negocios/nuevo" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm shadow-blue-200">
            <HiPlus className="w-4 h-4" /> Negocio
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.key}
              href={card.href}
              className="card-hover bg-white rounded-2xl shadow-sm p-6 flex items-start gap-4 border border-gray-100/80"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${card.gradient}`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {card.title}
                </p>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {card.getValue(data)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <HiTrendingUp className="w-3 h-3" />
                  {card.getSub(data)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pipeline Visual */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100/80">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Pipeline de Negocios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {DEAL_STATUSES.map((status) => {
            const count = data.recentDeals.filter((d) => d.status === status.value).length;
            return (
              <div key={status.value} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${status.color}`}>
                  <span className="text-lg font-bold">{count}</span>
                </div>
                <p className="text-xs font-medium text-gray-600">{status.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Negocios Recientes */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100/80">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Negocios Recientes</h2>
            <Link href="/negocios" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Ver todos
            </Link>
          </div>
          {data.recentDeals.length === 0 ? (
            <div className="text-center py-8">
              <HiBriefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No hay negocios recientes</p>
              <Link href="/negocios/nuevo" className="text-sm text-blue-600 font-medium hover:underline mt-2 inline-block">
                Crear primer negocio
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/negocios/${deal.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    deal.dealType === "VENTA" ? "bg-blue-100" : "bg-teal-100"
                  }`}>
                    <span className={`text-sm font-bold ${
                      deal.dealType === "VENTA" ? "text-blue-600" : "text-teal-600"
                    }`}>
                      {deal.dealType === "VENTA" ? "V" : "A"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {deal.property?.title || "Sin propiedad"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {deal.client ? `${deal.client.firstName} ${deal.client.lastName}` : "Sin cliente"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(deal.agreedPrice, deal.currency)}
                    </p>
                    <StatusBadge
                      label={getLabel(DEAL_STATUSES, deal.status)}
                      colorClass={getStatusColor(DEAL_STATUSES, deal.status)}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contratos por Vencer */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100/80">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Contratos por Vencer</h2>
              {data.expiringContracts.length > 0 && (
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold animate-pulse-dot">
                  {data.expiringContracts.length}
                </span>
              )}
            </div>
          </div>
          {data.expiringContracts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Todo en orden</p>
              <p className="text-xs text-gray-400 mt-1">No hay contratos por vencer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.expiringContracts.map((contract) => {
                const daysLeft = getDaysRemaining(contract.contractEndDate);
                const daysColor = getDaysRemainingColor(daysLeft);

                return (
                  <Link
                    key={contract.id}
                    href={`/negocios/${contract.id}`}
                    className={`block rounded-xl border p-4 hover:shadow-md transition-all ${daysColor}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {contract.property?.title || "Sin propiedad"}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {contract.client
                            ? `${contract.client.firstName} ${contract.client.lastName}`
                            : "Sin cliente"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>Vence: {formatDate(contract.contractEndDate)}</span>
                          <span className="font-semibold text-gray-600">
                            {formatCurrency(contract.monthlyRent, contract.currency)}/mes
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold">
                          {daysLeft < 15 && <HiExclamation className="w-4 h-4" />}
                          {daysLeft <= 0 ? "Vencido" : `${daysLeft}d`}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
