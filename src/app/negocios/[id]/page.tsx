"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  DEAL_TYPES, DEAL_STATUSES, AGENTS,
  formatCurrency, formatDate, getLabel, getStatusColor,
} from "@/lib/constants";
import { HiCheckCircle, HiClock, HiExclamation } from "react-icons/hi";

interface CommissionPayment {
  id: string;
  label: string;
  amount: number;
  date: string | null;
  paid: boolean;
}

interface DealDetail {
  id: string; dealType: string; status: string;
  agreedPrice: number | null; currency: string;
  commissionPct: number | null; commissionAmount: number | null;
  commissionPaid: boolean; commissionDate: string | null;
  commissionPayments: string | null; assignedAgent: string | null;
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

  // Toggle individual payment status
  async function togglePayment(paymentId: string) {
    if (!deal?.commissionPayments) return;
    const payments: CommissionPayment[] = JSON.parse(deal.commissionPayments);
    const updated = payments.map((p) =>
      p.id === paymentId ? { ...p, paid: !p.paid, date: !p.paid ? new Date().toISOString() : p.date } : p
    );
    const allPaid = updated.every((p) => p.paid);

    const res = await fetch(`/api/deals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commissionPayments: JSON.stringify(updated),
        commissionPaid: allPaid,
      }),
    });
    if (res.ok) {
      setDeal((prev) => prev ? {
        ...prev,
        commissionPayments: JSON.stringify(updated),
        commissionPaid: allPaid,
      } : prev);
      toast.success("Pago actualizado");
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  if (!deal) return <div className="text-center py-12 text-red-600">Negocio no encontrado</div>;

  const daysLeft = deal.contractEndDate ? getDaysRemaining(deal.contractEndDate) : null;
  const payments: CommissionPayment[] = deal.commissionPayments ? JSON.parse(deal.commissionPayments) : [];
  const totalPaid = payments.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter((p) => !p.paid).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <PageHeader title={`Negocio: ${deal.property?.title || "Sin propiedad"}`}>
        <div className="flex gap-2">
          {deal.driveLink && (
            <a href={deal.driveLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white hover:bg-green-700 px-4 py-2.5 rounded-xl font-medium transition-colors">
              Google Drive
            </a>
          )}
          <Link href={`/negocios/${id}/editar`} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-xl font-medium transition-colors">Editar</Link>
          <button onClick={() => setShowDelete(true)} className="bg-red-600 text-white hover:bg-red-700 px-4 py-2.5 rounded-xl font-medium transition-colors">Eliminar</button>
        </div>
      </PageHeader>

      <div className="space-y-6 max-w-4xl">
        {/* Tipo y Estado */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge label={getLabel(DEAL_TYPES, deal.dealType)} colorClass={deal.dealType === "VENTA" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"} />
            <StatusBadge label={getLabel(DEAL_STATUSES, deal.status)} colorClass={getStatusColor(DEAL_STATUSES, deal.status)} />
            {deal.assignedAgent && <StatusBadge label={getLabel(AGENTS, deal.assignedAgent)} colorClass="bg-indigo-100 text-indigo-700" />}
            {deal.commissionPaid && <StatusBadge label="Comision Pagada" colorClass="bg-green-100 text-green-700" />}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><p className="text-xs text-gray-500 uppercase font-semibold">Precio Acordado</p><p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(deal.agreedPrice, deal.currency)}</p></div>
            <div><p className="text-xs text-gray-500 uppercase font-semibold">Comision (%)</p><p className="text-sm font-medium mt-1">{deal.commissionPct != null ? `${deal.commissionPct}%` : "—"}</p></div>
            <div><p className="text-xs text-gray-500 uppercase font-semibold">Monto Comision Total</p><p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(deal.commissionAmount, deal.currency)}</p></div>
            {deal.closingDate && <div><p className="text-xs text-gray-500 uppercase font-semibold">Fecha de Cierre</p><p className="text-sm font-medium mt-1">{formatDate(deal.closingDate)}</p></div>}
            <div><p className="text-xs text-gray-500 uppercase font-semibold">Registrado</p><p className="text-sm font-medium mt-1">{formatDate(deal.createdAt)}</p></div>
          </div>
        </div>

        {/* Commission Payments */}
        {payments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Pagos de Comision</h2>
                <p className="text-xs text-gray-400 mt-0.5">Haz clic en un pago para marcarlo como pagado/pendiente</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Progreso de cobro</p>
                <p className="text-lg font-bold text-green-600">
                  {deal.commissionAmount ? Math.round((totalPaid / deal.commissionAmount) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-5">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${deal.commissionAmount ? Math.min((totalPaid / deal.commissionAmount) * 100, 100) : 0}%` }}
              />
            </div>

            <div className="space-y-3">
              {payments.map((payment, index) => (
                <button
                  key={payment.id}
                  onClick={() => togglePayment(payment.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                    payment.paid
                      ? "bg-green-50 border-green-200 hover:bg-green-100"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                    payment.paid ? "bg-green-500" : "bg-gray-300"
                  }`}>
                    {payment.paid
                      ? <HiCheckCircle className="w-6 h-6 text-white" />
                      : <HiClock className="w-5 h-5 text-white" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Pago {index + 1}: {payment.label || "Sin concepto"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {payment.paid
                        ? `Pagado ${payment.date ? formatDate(payment.date) : ""}`
                        : "Pendiente de pago"
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${payment.paid ? "text-green-600" : "text-gray-700"}`}>
                      {formatCurrency(payment.amount, deal.currency)}
                    </p>
                    <p className={`text-xs font-semibold ${payment.paid ? "text-green-500" : "text-amber-500"}`}>
                      {payment.paid ? "COBRADO" : "PENDIENTE"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-semibold">Total Comision</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(deal.commissionAmount, deal.currency)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xs text-green-600 font-semibold">Cobrado</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(totalPaid, deal.currency)}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-semibold">Pendiente</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(totalPending, deal.currency)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cliente y Propiedad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Cliente</h2>
            {deal.client ? (
              <div>
                <Link href={`/clientes/${deal.client.id}`} className="text-blue-600 hover:underline font-semibold text-lg">
                  {deal.client.firstName} {deal.client.lastName}
                </Link>
                {deal.client.phone && <p className="text-sm text-gray-600 mt-1">{deal.client.phone}</p>}
                {deal.client.email && <p className="text-sm text-gray-600">{deal.client.email}</p>}
              </div>
            ) : <p className="text-gray-400">Sin cliente asignado</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Propiedad</h2>
            {deal.property ? (
              <div>
                <Link href={`/propiedades/${deal.property.id}`} className="text-blue-600 hover:underline font-semibold text-lg">
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
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-teal-500">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contrato de Alquiler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-gray-500 uppercase font-semibold">Inicio</p><p className="text-sm font-medium mt-1">{formatDate(deal.contractStartDate)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase font-semibold">Fin</p><p className="text-sm font-medium mt-1">{formatDate(deal.contractEndDate)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase font-semibold">Renta Mensual</p><p className="text-sm font-medium mt-1">{formatCurrency(deal.monthlyRent, deal.currency)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase font-semibold">Deposito</p><p className="text-sm font-medium mt-1">{formatCurrency(deal.securityDeposit, deal.currency)}</p></div>
            </div>
            {daysLeft != null && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                  daysLeft <= 0 ? "bg-red-50 text-red-700" : daysLeft < 30 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"
                }`}>
                  {daysLeft <= 0 ? <HiExclamation className="w-4 h-4" /> : null}
                  {daysLeft <= 0 ? "Contrato vencido" : `${daysLeft} dias restantes`}
                </div>
              </div>
            )}
          </div>
        )}

        {deal.notes && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Notas</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
          </div>
        )}
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Eliminar Negocio" message="Estas seguro de que deseas eliminar este negocio? Esta accion no se puede deshacer." />
    </div>
  );
}
