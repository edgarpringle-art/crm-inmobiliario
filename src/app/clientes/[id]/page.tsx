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
import { HiPlus, HiTrash } from "react-icons/hi";

interface Activity {
  id: string; type: string; description: string; clientId: string | null;
  dealId: string | null; createdAt: string;
}

const ACTIVITY_TYPES = [
  { value: "LLAMADA", label: "📞 Llamada", color: "bg-blue-100 text-blue-700" },
  { value: "VISITA", label: "🏠 Visita", color: "bg-green-100 text-green-700" },
  { value: "EMAIL", label: "📧 Email", color: "bg-purple-100 text-purple-700" },
  { value: "WHATSAPP", label: "💬 WhatsApp", color: "bg-emerald-100 text-emerald-700" },
  { value: "REUNION", label: "👥 Reunión", color: "bg-orange-100 text-orange-700" },
  { value: "NOTA", label: "📝 Nota", color: "bg-gray-100 text-gray-700" },
];

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({ type: "LLAMADA", description: "" });
  const [savingActivity, setSavingActivity] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${id}`).then((r) => r.json()),
      fetch(`/api/activities?clientId=${id}`).then((r) => r.json()).catch(() => []),
    ]).then(([c, a]) => {
      setClient(c);
      setActivities(Array.isArray(a) ? a : []);
    }).finally(() => setLoading(false));
  }, [id]);

  async function addActivity() {
    if (!newActivity.description.trim()) return;
    setSavingActivity(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newActivity, clientId: id }),
      });
      if (res.ok) {
        const a = await res.json();
        setActivities((prev) => [a, ...prev]);
        setNewActivity((p) => ({ ...p, description: "" }));
      }
    } finally { setSavingActivity(false); }
  }

  async function deleteActivity(actId: string) {
    const res = await fetch(`/api/activities?id=${actId}`, { method: "DELETE" });
    if (res.ok) setActivities((prev) => prev.filter((a) => a.id !== actId));
  }

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
        <div className="flex gap-2 flex-wrap">
          {client.phone && (
            <a
              href={`https://wa.me/${client.phone.replace(/\D/g, "")}`}
              target="_blank" rel="noopener noreferrer"
              className="bg-[#25D366] text-white hover:bg-[#1ebe57] px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          )}
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
        {/* Activity Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de Actividad</h2>
          {/* Add activity */}
          <div className="flex gap-2 mb-5">
            <select
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white"
              value={newActivity.type}
              onChange={(e) => setNewActivity((p) => ({ ...p, type: e.target.value }))}
            >
              {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción de la actividad..."
              value={newActivity.description}
              onChange={(e) => setNewActivity((p) => ({ ...p, description: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addActivity()}
            />
            <button onClick={addActivity} disabled={savingActivity} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50">
              <HiPlus className="w-5 h-5" />
            </button>
          </div>
          {/* Timeline */}
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin actividad registrada</p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => {
                const typeInfo = ACTIVITY_TYPES.find((t) => t.value === act.type);
                return (
                  <div key={act.id} className="flex items-start gap-3 group">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${typeInfo?.color || "bg-gray-100 text-gray-600"}`}>
                      {typeInfo?.label || act.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">{act.description}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(act.createdAt)}</p>
                    </div>
                    <button onClick={() => deleteActivity(act.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
