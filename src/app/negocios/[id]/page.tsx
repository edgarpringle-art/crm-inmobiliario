"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  DEAL_TYPES, DEAL_STATUSES,
  formatCurrency, formatDate, getLabel, getStatusColor,
} from "@/lib/constants";

interface DealDetail {
  id: string; dealType: string; status: string;
  agreedPrice: number | null; currency: string;
  commissionPct: number | null; commissionAmount: number | null;
  commissionPaid: boolean; commissionDate: string | null;
  contractStartDate: string | null; contractEndDate: string | null;
  monthlyRent: number | null; securityDeposit: number | null;
  closingDate: string | null; driveLink: string | null; notes: string | null;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } | null;
  property: { id: string; title: string; address: string | null; propertyType: string; owner: { id: string; firstName: string; lastName: string } | null } | null;
}

function getDaysRemaining(endDate: string): number {
  return Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export default function NegocioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/deals/${id}`).then((r) => r.json()).then(setDeal).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Negocio eliminado"); router.push("/negocios"); }
    else toast.error("Error al eliminar");
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  if (!deal) return <div className="text-center py-12 text-red-600">Negocio no encontrado</div>;

  const daysLeft = deal.contractEndDate ? getDaysRemaining(deal.contractEndDate) : null;

  return (
    <div>
      <PageHeader title={`Negocio: ${deal.property?.title || "Sin propiedad"}`}>
        <div className="flex gap-2">
          {deal.driveLink && (
            <a href={deal.driveLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors">
              Google Drive
            </a>
          )}
          <Link href={`/negocios/${id}/editar`} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">Editar</Link>
          <button onClick={() => setShowDelete(true)} className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors">Eliminar</button>
        </div>
      </PageHeader>

      <div className="space-y-6 max-w-4xl">
        {/* Tipo y Estado */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge label={getLabel(DEAL_TYPES, deal.dealType)} colorClass={deal.dealType === "VENTA" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"} />
            <StatusBadge label={getLabel(DEAL_STATUSES, deal.status)} colorClass={getStatusColor(DEAL_STATUSES, deal.status)} />
            {deal.commissionPaid && <StatusBadge label="Comisión Pagada" colorClass="bg-green-100 text-green-700" />}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-xs text-gray-500 uppercase">Precio Acordado</p><p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(deal.agreedPrice, deal.currency)}</p></div>
            <div><p className="text-xs text-gray-500 uppercase">Comisión (%)</p><p className="text-sm font-medium mt-1">{deal.commissionPct != null ? `${deal.commissionPct}%` : "—"}</p></div>
            <div><p className="text-xs text-gray-500 uppercase">Monto Comisión</p><p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(deal.commissionAmount, deal.currency)}</p></div>
            {deal.commissionDate && <div><p className="text-xs text-gray-500 uppercase">Fecha Cobro Comisión</p><p className="text-sm font-medium mt-1">{formatDate(deal.commissionDate)}</p></div>}
            {deal.closingDate && <div><p className="text-xs text-gray-500 uppercase">Fecha de Cierre</p><p className="text-sm font-medium mt-1">{formatDate(deal.closingDate)}</p></div>}
            <div><p className="text-xs text-gray-500 uppercase">Registrado</p><p className="text-sm font-medium mt-1">{formatDate(deal.createdAt)}</p></div>
          </div>
        </div>

        {/* Cliente y Propiedad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Cliente</h2>
            {deal.client ? (
              <div>
                <Link href={`/clientes/${deal.client.id}`} className="text-blue-600 hover:underline font-medium text-lg">
                  {deal.client.firstName} {deal.client.lastName}
                </Link>
                {deal.client.phone && <p className="text-sm text-gray-600 mt-1">{deal.client.phone}</p>}
                {deal.client.email && <p className="text-sm text-gray-600">{deal.client.email}</p>}
              </div>
            ) : <p className="text-gray-400">Sin cliente asignado</p>}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Propiedad</h2>
            {deal.property ? (
              <div>
                <Link href={`/propiedades/${deal.property.id}`} className="text-blue-600 hover:underline font-medium text-lg">
                  {deal.property.title}
                </Link>
                {deal.property.address && <p className="text-sm text-gray-600 mt-1">{deal.property.address}</p>}
                <p className="text-sm text-gray-500">{deal.property.propertyType}</p>
              </div>
            ) : <p className="text-gray-400">Sin propiedad asignada</p>}
          </div>
        </div>

        {/* Datos de Alquiler */}
        {deal.dealType === "ALQUILER" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contrato de Alquiler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-gray-500 uppercase">Inicio</p><p className="text-sm font-medium mt-1">{formatDate(deal.contractStartDate)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase">Fin</p><p className="text-sm font-medium mt-1">{formatDate(deal.contractEndDate)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase">Renta Mensual</p><p className="text-sm font-medium mt-1">{formatCurrency(deal.monthlyRent, deal.currency)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase">Depósito</p><p className="text-sm font-medium mt-1">{formatCurrency(deal.securityDeposit, deal.currency)}</p></div>
            </div>
            {daysLeft != null && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  daysLeft <= 0 ? "bg-red-50 text-red-700" : daysLeft < 30 ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
                }`}>
                  {daysLeft <= 0 ? "Contrato vencido" : `${daysLeft} días restantes`}
                </div>
              </div>
            )}
          </div>
        )}

        {deal.notes && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Notas</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Eliminar Negocio" message="¿Estás seguro de que deseas eliminar este negocio? Esta acción no se puede deshacer." />
    </div>
  );
}
