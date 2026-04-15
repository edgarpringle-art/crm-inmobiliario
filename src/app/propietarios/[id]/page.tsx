"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import { formatCurrency } from "@/lib/constants";

interface Owner {
  id: string; firstName: string; lastName: string; email: string | null;
  phone: string | null; phone2: string | null; cedula: string | null;
  address: string | null; city: string | null; notes: string | null; createdAt: string;
  properties: Array<{ id: string; title: string; propertyType: string; operationType: string; status: string; salePrice: number | null; rentPrice: number | null; currency: string }>;
}

export default function PropietarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/owners/${id}`).then((r) => r.json()).then(setOwner).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    const res = await fetch(`/api/owners/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Propietario eliminado"); router.push("/propietarios"); }
    else toast.error("Error al eliminar");
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  if (!owner) return <div className="text-center py-12 text-red-600">Propietario no encontrado</div>;

  const initials = `${owner.firstName[0]}${owner.lastName[0]}`.toUpperCase();

  return (
    <div>
      <PageHeader title={`${owner.firstName} ${owner.lastName}`}>
        <div className="flex gap-2">
          {owner.phone && (
            <a href={`https://wa.me/${owner.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
              className="bg-[#25D366] text-white hover:bg-[#1ebe57] px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          )}
          <Link href={`/propietarios/${id}/editar`} className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">Editar</Link>
          <button onClick={() => setShowDelete(true)} className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors">Eliminar</button>
        </div>
      </PageHeader>

      <div className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-2xl">{initials}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{owner.firstName} {owner.lastName}</h2>
              {owner.cedula && <p className="text-sm text-gray-500">Cédula: {owner.cedula}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {owner.phone && <div><p className="text-xs text-gray-500 uppercase">Teléfono</p><p className="text-sm font-medium mt-1">{owner.phone}</p></div>}
            {owner.phone2 && <div><p className="text-xs text-gray-500 uppercase">Teléfono 2</p><p className="text-sm font-medium mt-1">{owner.phone2}</p></div>}
            {owner.email && <div><p className="text-xs text-gray-500 uppercase">Email</p><p className="text-sm font-medium mt-1">{owner.email}</p></div>}
            {owner.address && <div><p className="text-xs text-gray-500 uppercase">Dirección</p><p className="text-sm font-medium mt-1">{owner.address}</p></div>}
            {owner.city && <div><p className="text-xs text-gray-500 uppercase">Ciudad</p><p className="text-sm font-medium mt-1">{owner.city}</p></div>}
          </div>
          {owner.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 uppercase">Notas</p>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{owner.notes}</p>
            </div>
          )}
        </div>

        {owner.properties.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Propiedades ({owner.properties.length})</h2>
            <div className="space-y-2">
              {owner.properties.map((prop) => (
                <Link key={prop.id} href={`/propiedades/${prop.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{prop.title}</p>
                    <p className="text-sm text-gray-500">{prop.propertyType} · {prop.operationType}</p>
                  </div>
                  <p className="text-sm font-semibold text-blue-600">{formatCurrency(prop.salePrice || prop.rentPrice, prop.currency)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Eliminar Propietario" message={`¿Estás seguro de que deseas eliminar a ${owner.firstName} ${owner.lastName}?`} />
    </div>
  );
}
