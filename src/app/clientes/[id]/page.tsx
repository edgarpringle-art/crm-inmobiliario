"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  CLIENT_TYPES, CLIENT_SOURCES, CLIENT_STATUSES, PROPERTY_TYPES, SEARCH_TYPES,
  getLabel, getStatusColor, formatCurrency, formatDate,
} from "@/lib/constants";

interface ClientDetail {
  id: string;
  firstName: string; lastName: string; email: string | null; phone: string | null;
  phone2: string | null; cedula: string | null; clientType: string; source: string | null;
  status: string; searchType: string | null; searchZone: string | null;
  searchPropertyType: string | null; budgetMin: number | null; budgetMax: number | null;
  bedrooms: number | null; bathrooms: number | null; searchNotes: string | null;
  address: string | null; city: string | null; notes: string | null; driveLink: string | null;
  createdAt: string; updatedAt: string;
  ownedProperties: Array<{ id: string; title: string; propertyType: string; operationType: string; status: string; salePrice: number | null; rentPrice: number | null; currency: string }>;
  deals: Array<{ id: string; dealType: string; status: string; agreedPrice: number | null; currency: string; property: { id: string; title: string } | null }>;
}

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then(setClient)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Cliente eliminado");
      router.push("/clientes");
    } else {
      toast.error("Error al eliminar");
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  if (!client) return <div className="text-center py-12 text-red-600">Cliente no encontrado</div>;

  const info = [
    { label: "Email", value: client.email },
    { label: "Teléfono", value: client.phone },
    { label: "Teléfono 2", value: client.phone2 },
    { label: "Cédula", value: client.cedula },
    { label: "Dirección", value: client.address },
    { label: "Ciudad", value: client.city },
    { label: "Registrado", value: formatDate(client.createdAt) },
  ];

  const searchInfo = [
    { label: "Tipo de Búsqueda", value: client.searchType ? getLabel(SEARCH_TYPES, client.searchType) : null },
    { label: "Zona", value: client.searchZone },
    { label: "Tipo de Propiedad", value: client.searchPropertyType ? getLabel(PROPERTY_TYPES, client.searchPropertyType) : null },
    { label: "Presupuesto", value: client.budgetMin || client.budgetMax ? `${formatCurrency(client.budgetMin)} - ${formatCurrency(client.budgetMax)}` : null },
    { label: "Habitaciones", value: client.bedrooms?.toString() },
    { label: "Baños", value: client.bathrooms?.toString() },
  ];

  return (
    <div>
      <PageHeader title={`${client.firstName} ${client.lastName}`}>
        <div className="flex gap-2">
          {client.driveLink && (
            <a href={client.driveLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors">
              Google Drive
            </a>
          )}
          <Link href={`/clientes/${id}/editar`} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">
            Editar
          </Link>
          <button onClick={() => setShowDelete(true)} className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors">
            Eliminar
          </button>
        </div>
      </PageHeader>

      <div className="space-y-6 max-w-4xl">
        {/* Info básica */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge label={getLabel(CLIENT_TYPES, client.clientType)} colorClass="bg-blue-100 text-blue-800" />
            <StatusBadge label={getLabel(CLIENT_STATUSES, client.status)} colorClass={getStatusColor(CLIENT_STATUSES, client.status)} />
            {client.source && <StatusBadge label={getLabel(CLIENT_SOURCES, client.source)} colorClass="bg-gray-100 text-gray-800" />}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {info.map((item) => item.value && (
              <div key={item.label}>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
          {client.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Notas</p>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Búsqueda */}
        {searchInfo.some((i) => i.value) && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Búsqueda</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {searchInfo.map((item) => item.value && (
                <div key={item.label}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
            {client.searchNotes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Notas de Búsqueda</p>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{client.searchNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Propiedades del cliente */}
        {client.ownedProperties.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Propiedades ({client.ownedProperties.length})</h2>
            <div className="space-y-2">
              {client.ownedProperties.map((prop) => (
                <Link key={prop.id} href={`/propiedades/${prop.id}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{prop.title}</p>
                    <p className="text-sm text-gray-500">{getLabel(PROPERTY_TYPES, prop.propertyType)} · {prop.operationType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(prop.salePrice || prop.rentPrice, prop.currency)}</p>
                    <StatusBadge label={prop.status} colorClass="bg-gray-100 text-gray-600" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Negocios */}
        {client.deals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Negocios ({client.deals.length})</h2>
            <div className="space-y-2">
              {client.deals.map((deal) => (
                <Link key={deal.id} href={`/negocios/${deal.id}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{deal.property?.title || "Sin propiedad"}</p>
                    <p className="text-sm text-gray-500">{deal.dealType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(deal.agreedPrice, deal.currency)}</p>
                    <StatusBadge label={deal.status} colorClass={getStatusColor([{ value: deal.status, color: deal.status === "CERRADO" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800" }], deal.status)} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que deseas eliminar a ${client.firstName} ${client.lastName}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
