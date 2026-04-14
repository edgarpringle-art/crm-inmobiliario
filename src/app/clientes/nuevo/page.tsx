"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import {
  CLIENT_TYPES,
  CLIENT_SOURCES,
  CLIENT_STATUSES,
  PROPERTY_TYPES,
  SEARCH_TYPES,
} from "@/lib/constants";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function NuevoClientePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", phone2: "", cedula: "",
    clientType: "COMPRADOR", source: "", status: "PROSPECTO",
    searchType: "", searchZone: "", searchPropertyType: "", budgetMin: "", budgetMax: "",
    bedrooms: "", bathrooms: "", searchNotes: "",
    address: "", city: "", notes: "", driveLink: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.clientType) {
      toast.error("Nombre, apellido y tipo son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : null,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        source: form.source || null,
        searchType: form.searchType || null,
        searchPropertyType: form.searchPropertyType || null,
        email: form.email || null,
        phone: form.phone || null,
        phone2: form.phone2 || null,
        cedula: form.cedula || null,
        searchZone: form.searchZone || null,
        searchNotes: form.searchNotes || null,
        address: form.address || null,
        city: form.city || null,
        notes: form.notes || null,
        driveLink: form.driveLink || null,
      };
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error al crear cliente");
      toast.success("Cliente creado exitosamente");
      router.push("/clientes");
    } catch {
      toast.error("Error al crear el cliente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Nuevo Cliente" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Información Personal */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre" required>
              <input className={inputClass} value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
            </FormField>
            <FormField label="Apellido" required>
              <input className={inputClass} value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
            </FormField>
            <FormField label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
            </FormField>
            <FormField label="Teléfono">
              <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </FormField>
            <FormField label="Teléfono 2">
              <input className={inputClass} value={form.phone2} onChange={(e) => update("phone2", e.target.value)} />
            </FormField>
            <FormField label="Cédula / Documento">
              <input className={inputClass} value={form.cedula} onChange={(e) => update("cedula", e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* Clasificación */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clasificación</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tipo de Cliente" required>
              <select className={inputClass} value={form.clientType} onChange={(e) => update("clientType", e.target.value)}>
                {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Fuente">
              <select className={inputClass} value={form.source} onChange={(e) => update("source", e.target.value)}>
                <option value="">Seleccionar...</option>
                {CLIENT_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FormField>
            <FormField label="Estado">
              <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
                {CLIENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Búsqueda del Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tipo de Búsqueda">
              <select className={inputClass} value={form.searchType} onChange={(e) => update("searchType", e.target.value)}>
                <option value="">Seleccionar...</option>
                {SEARCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Zona de Interés">
              <input className={inputClass} value={form.searchZone} onChange={(e) => update("searchZone", e.target.value)} />
            </FormField>
            <FormField label="Tipo de Propiedad">
              <select className={inputClass} value={form.searchPropertyType} onChange={(e) => update("searchPropertyType", e.target.value)}>
                <option value="">Seleccionar...</option>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Presupuesto Mínimo">
              <input type="number" className={inputClass} value={form.budgetMin} onChange={(e) => update("budgetMin", e.target.value)} />
            </FormField>
            <FormField label="Presupuesto Máximo">
              <input type="number" className={inputClass} value={form.budgetMax} onChange={(e) => update("budgetMax", e.target.value)} />
            </FormField>
            <FormField label="Habitaciones">
              <input type="number" className={inputClass} value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
            </FormField>
            <FormField label="Baños">
              <input type="number" className={inputClass} value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Notas de Búsqueda">
              <textarea className={inputClass} rows={3} value={form.searchNotes} onChange={(e) => update("searchNotes", e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* Info Adicional */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Dirección">
              <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} />
            </FormField>
            <FormField label="Ciudad">
              <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} />
            </FormField>
            <FormField label="Link Google Drive">
              <input className={inputClass} value={form.driveLink} onChange={(e) => update("driveLink", e.target.value)} placeholder="https://drive.google.com/..." />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Notas">
              <textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </FormField>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar Cliente"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/clientes")}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
