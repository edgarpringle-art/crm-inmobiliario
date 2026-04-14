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
  if (days < 15) return "text-red-600 bg-red-50";
  if (days < 30) return "text-yellow-700 bg-yellow-50";
  return "text-gray-600 bg-gray-50";
}

const statCards = [
  {
    key: "clients" as const,
    title: "Total Clientes",
    icon: HiUsers,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    getValue: (d: DashboardData) => d.totalClients,
    getSub: (d: DashboardData) => `${d.activeClients} activos`,
  },
  {
    key: "properties" as const,
    title: "Total Propiedades",
    icon: HiOfficeBuilding,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    getValue: (d: DashboardData) => d.totalProperties,
    getSub: (d: DashboardData) => `${d.availableProperties} disponibles`,
  },
  {
    key: "deals" as const,
    title: "Negocios Cerrados",
    icon: HiBriefcase,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    getValue: (d: DashboardData) => d.closedDeals,
    getSub: (d: DashboardData) => `de ${d.totalDeals} total`,
  },
  {
    key: "commissions" as const,
    title: "Comisiones Totales",
    icon: HiCurrencyDollar,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    getValue: (d: DashboardData) => formatCurrency(d.totalCommissions),
    getSub: () => "acumulado",
    valueColor: "text-green-600",
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
        <div className="text-center">
          <p className="text-red-600 font-medium">
            {error || "No se pudieron cargar los datos"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={getTodayFormatted()}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="bg-white rounded-xl shadow-sm p-6 flex items-start gap-4"
            >
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full ${card.iconBg}`}
              >
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    "valueColor" in card && card.valueColor
                      ? card.valueColor
                      : "text-gray-900"
                  }`}
                >
                  {card.getValue(data)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {card.getSub(data)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Negocios Recientes */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Negocios Recientes
          </h2>
          {data.recentDeals.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              No hay negocios recientes
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-3 pr-3">Propiedad</th>
                    <th className="pb-3 pr-3">Cliente</th>
                    <th className="pb-3 pr-3">Tipo</th>
                    <th className="pb-3 pr-3">Precio</th>
                    <th className="pb-3 pr-3">Estado</th>
                    <th className="pb-3">Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.recentDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <Link
                          href={`/negocios/${deal.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          {deal.property?.title || "Sin propiedad"}
                        </Link>
                      </td>
                      <td className="py-3 pr-3 text-gray-700">
                        {deal.client
                          ? `${deal.client.firstName} ${deal.client.lastName}`
                          : "Sin cliente"}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge
                          label={getLabel(DEAL_TYPES, deal.dealType)}
                          colorClass={
                            deal.dealType === "VENTA"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-teal-100 text-teal-800"
                          }
                        />
                      </td>
                      <td className="py-3 pr-3 text-gray-700 font-medium whitespace-nowrap">
                        {formatCurrency(deal.agreedPrice, deal.currency)}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge
                          label={getLabel(DEAL_STATUSES, deal.status)}
                          colorClass={getStatusColor(DEAL_STATUSES, deal.status)}
                        />
                      </td>
                      <td className="py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(deal.closingDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Contratos por Vencer */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Contratos por Vencer
            </h2>
            {data.expiringContracts.length > 0 && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                {data.expiringContracts.length}
              </span>
            )}
          </div>
          {data.expiringContracts.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              No hay contratos por vencer
            </p>
          ) : (
            <div className="space-y-3">
              {data.expiringContracts.map((contract) => {
                const daysLeft = getDaysRemaining(contract.contractEndDate);
                const daysColor = getDaysRemainingColor(daysLeft);

                return (
                  <Link
                    key={contract.id}
                    href={`/negocios/${contract.id}`}
                    className="block rounded-lg border border-gray-100 p-4 hover:bg-gray-50 hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {contract.property?.title || "Sin propiedad"}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {contract.client
                            ? `${contract.client.firstName} ${contract.client.lastName}`
                            : "Sin cliente"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>
                            Vence: {formatDate(contract.contractEndDate)}
                          </span>
                          <span className="font-medium text-gray-600">
                            {formatCurrency(
                              contract.monthlyRent,
                              contract.currency
                            )}
                            /mes
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${daysColor}`}
                        >
                          {daysLeft < 15 && (
                            <HiExclamation className="w-3.5 h-3.5" />
                          )}
                          {daysLeft <= 0
                            ? "Vencido"
                            : `${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`}
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
