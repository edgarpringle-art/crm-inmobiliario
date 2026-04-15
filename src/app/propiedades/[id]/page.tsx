"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  PROPERTY_TYPES, OPERATION_TYPES, PROPERTY_STATUSES, DEAL_STATUSES,
  formatCurrency, formatDate, getLabel, getStatusColor,
} from "@/lib/constants";

interface PortalLink { name: string; url: string; }

interface PropertyDetail {
  id: string; title: string; propertyType: string; operationType: string; status: string;
  address: string | null; sector: string | null; city: string | null; state: string | null;
  country: string; referencePoint: string | null;
  salePrice: number | null; rentPrice: number | null; currency: string; maintenanceFee: number | null;
  area: number | null; landArea: number | null; bedrooms: number | null; bathrooms: number | null;
  parkingSpots: number | null; floors: number | null; yearBuilt: number | null;
  hasPool: boolean; hasGym: boolean; hasElevator: boolean; hasSecurity: boolean;
  hasGenerator: boolean; hasFurniture: boolean; hasAC: boolean; hasBalcony: boolean; hasGarden: boolean;
  driveLink: string | null; portalLinks: string | null; description: string | null; notes: string | null;
  owner: { id: string; firstName: string; lastName: string; phone: string | null; email: string | null } | null;
  ownerName: string | null; ownerPhone: string | null;
  createdAt: string;
  deals: Array<{ id: string; dealType: string; status: string; agreedPrice: number | null; currency: string; client: { id: string; firstName: string; lastName: string } | null }>;
}

const amenityLabels: Record<string, string> = {
  hasPool: "Piscina", hasGym: "Gimnasio", hasElevator: "Ascensor", hasSecurity: "Seguridad",
  hasGenerator: "Planta Eléctrica", hasFurniture: "Amueblado", hasAC: "Aire Acondicionado",
  hasBalcony: "Balcón", hasGarden: "Jardín",
};

export default function PropiedadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/properties/${id}`).then((r) => r.json()).then(setProperty).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Propiedad eliminada"); router.push("/propiedades"); }
    else toast.error("Error al eliminar");
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  if (!property) return <div className="text-center py-12 text-red-600">Propiedad no encontrada</div>;

  const activeAmenities = Object.entries(amenityLabels).filter(([key]) => property[key as keyof PropertyDetail] === true);
  const location = [property.address, property.sector, property.city, property.state, property.country].filter(Boolean).join(", ");

  return (
    <div>
      <PageHeader title={property.title}>
        <div className="flex gap-2">
          {property.driveLink && (
            <a href={property.driveLink} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors">
              Google Drive
            </a>
          )}
          <Link href={`/propiedades/${id}/editar`} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">Editar</Link>
          <button onClick={() => setShowDelete(true)} className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors">Eliminar</button>
        </div>
      </PageHeader>

      <div className="space-y-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge label={getLabel(PROPERTY_TYPES, property.propertyType)} colorClass="bg-gray-100 text-gray-700" />
            <StatusBadge label={getLabel(OPERATION_TYPES, property.operationType)} colorClass={property.operationType === "VENTA" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"} />
            <StatusBadge label={getLabel(PROPERTY_STATUSES, property.status)} colorClass={getStatusColor(PROPERTY_STATUSES, property.status)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {location && <div><p className="text-xs text-gray-500 uppercase tracking-wide">Ubicación</p><p className="text-sm font-medium text-gray-900 mt-1">{location}</p></div>}
            {property.referencePoint && <div><p className="text-xs text-gray-500 uppercase tracking-wide">Referencia</p><p className="text-sm font-medium text-gray-900 mt-1">{property.referencePoint}</p></div>}
            {property.salePrice != null && <div><p className="text-xs text-gray-500 uppercase tracking-wide">Precio Venta</p><p className="text-lg font-bold text-blue-600 mt-1">{formatCurrency(property.salePrice, property.currency)}</p></div>}
            {property.rentPrice != null && <div><p className="text-xs text-gray-500 uppercase tracking-wide">Precio Alquiler</p><p className="text-lg font-bold text-teal-600 mt-1">{formatCurrency(property.rentPrice, property.currency)}/mes</p></div>}
            {property.maintenanceFee != null && <div><p className="text-xs text-gray-500 uppercase tracking-wide">Mantenimiento</p><p className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(property.maintenanceFee, property.currency)}/mes</p></div>}
            <div><p className="text-xs text-gray-500 uppercase tracking-wide">Registrada</p><p className="text-sm font-medium text-gray-900 mt-1">{formatDate(property.createdAt)}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Características</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.area != null && <div><p className="text-xs text-gray-500 uppercase">Área</p><p className="text-sm font-medium mt-1">{property.area} m²</p></div>}
            {property.landArea != null && <div><p className="text-xs text-gray-500 uppercase">Terreno</p><p className="text-sm font-medium mt-1">{property.landArea} m²</p></div>}
            {property.bedrooms != null && <div><p className="text-xs text-gray-500 uppercase">Habitaciones</p><p className="text-sm font-medium mt-1">{property.bedrooms}</p></div>}
            {property.bathrooms != null && <div><p className="text-xs text-gray-500 uppercase">Baños</p><p className="text-sm font-medium mt-1">{property.bathrooms}</p></div>}
            {property.parkingSpots != null && <div><p className="text-xs text-gray-500 uppercase">Parqueos</p><p className="text-sm font-medium mt-1">{property.parkingSpots}</p></div>}
            {property.floors != null && <div><p className="text-xs text-gray-500 uppercase">Niveles</p><p className="text-sm font-medium mt-1">{property.floors}</p></div>}
            {property.yearBuilt != null && <div><p className="text-xs text-gray-500 uppercase">Año</p><p className="text-sm font-medium mt-1">{property.yearBuilt}</p></div>}
          </div>
        </div>

        {activeAmenities.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenidades</h2>
            <div className="flex flex-wrap gap-2">
              {activeAmenities.map(([, label]) => (
                <span key={label} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{label}</span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Propietario</h2>
          {property.owner ? (
            <Link href={`/clientes/${property.owner.id}`} className="text-blue-600 hover:underline font-medium">
              {property.owner.firstName} {property.owner.lastName}
              {property.owner.phone && <span className="text-gray-500 ml-2">· {property.owner.phone}</span>}
            </Link>
          ) : (
            <div>
              <p className="text-sm font-medium">{property.ownerName || "—"}</p>
              {property.ownerPhone && <p className="text-sm text-gray-500">{property.ownerPhone}</p>}
            </div>
          )}
        </div>

        {(() => {
          const portals: PortalLink[] = property.portalLinks ? (() => { try { return JSON.parse(property.portalLinks!); } catch { return []; } })() : [];
          return portals.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Portales Inmobiliarios</h2>
              <div className="flex flex-wrap gap-3">
                {portals.map((p, i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors border border-indigo-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    {p.name}
                  </a>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {property.description && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{property.description}</p>
          </div>
        )}

        {property.deals.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Negocios ({property.deals.length})</h2>
            <div className="space-y-2">
              {property.deals.map((deal) => (
                <Link key={deal.id} href={`/negocios/${deal.id}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{deal.client ? `${deal.client.firstName} ${deal.client.lastName}` : "Sin cliente"}</p>
                    <p className="text-sm text-gray-500">{deal.dealType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(deal.agreedPrice, deal.currency)}</p>
                    <StatusBadge label={getLabel(DEAL_STATUSES, deal.status)} colorClass={getStatusColor(DEAL_STATUSES, deal.status)} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Eliminar Propiedad" message={`¿Estás seguro de que deseas eliminar "${property.title}"? Esta acción no se puede deshacer.`} />
    </div>
  );
}
