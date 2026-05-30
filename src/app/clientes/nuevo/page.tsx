"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import ZoneSelector from "@/components/ZoneSelector";
import {
  CLIENT_TYPES,
  CLIENT_SOURCES,
  CLIENT_STATUSES,
  PROPERTY_TYPES,
  SEARCH_TYPES,
  CURRENCIES,
} from "@/lib/constants";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const SEARCH_CLIENT_TYPES = ["COMPRADOR", "ARRENDATARIO", "INVERSOR"];

const AMENITIES = [
  { field: "hasPool", label: "Piscina" },
  { field: "hasGym", label: "Gimnasio" },
  { field: "hasElevator", label: "Ascensor" },
  { field: "hasSecurity", label: "Seguridad" },
  { field: "hasGenerator", label: "Planta Eléctrica" },
  { field: "hasAppliances", label: "Línea Blanca" },
  { field: "hasAC", label: "Aires" },
  { field: "hasBalcony", label: "Balcón" },
  { field: "hasGarden", label: "Jardín" },
] as const;

type AmenityKey = typeof AMENITIES[number]["field"];

export default function NuevoClientePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", phone2: "",
    clientType: "COMPRADOR", source: "", status: "PROSPECTO",
    searchType: "", searchPropertyType: "",
    searchZones: [] as string[],
    budgetMin: "", budgetMax: "", currency: "USD",
    bedrooms: "", bedroomsMax: "",
    bathrooms: "", bathroomsMax: "",
    amoblado: "INDIFERENTE",
    hasPool: false, hasGym: false, hasElevator: false, hasSecurity: false,
    hasGenerator: false, hasAppliances: false,
    hasAC: false, hasBalcony: false, hasGarden: false,
    searchNotes: "",
    address: "", city: "", notes: "",
  });

  const needsSearch = SEARCH_CLIENT_TYPES.includes(form.clientType);

  function update(field: string, value: string | boolean | string[]) {
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
      const searchPayload = needsSearch ? {
        searchType: form.searchType || null,
        searchPropertyType: form.searchPropertyType || null,
        searchZones: form.searchZones.length ? JSON.stringify(form.searchZones) : null,
        searchZone: form.searchZones[0] || null, // legacy fallback
        budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : null,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : null,
        currency: form.currency || "USD",
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bedroomsMax: form.bedroomsMax ? parseInt(form.bedroomsMax) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        bathroomsMax: form.bathroomsMax ? parseInt(form.bathroomsMax) : null,
        amoblado: form.amoblado || "INDIFERENTE",
        hasPool: form.hasPool ? 1 : 0,
        hasGym: form.hasGym ? 1 : 0,
        hasElevator: form.hasElevator ? 1 : 0,
        hasSecurity: form.hasSecurity ? 1 : 0,
        hasGenerator: form.hasGenerator ? 1 : 0,
        hasAppliances: form.hasAppliances ? 1 : 0,
        hasAC: form.hasAC ? 1 : 0,
        hasBalcony: form.hasBalcony ? 1 : 0,
        hasGarden: form.hasGarden ? 1 : 0,
        searchNotes: form.searchNotes || null,
      } : {
        searchType: null, searchPropertyType: null,
        searchZone: null, searchZones: null,
        budgetMin: null, budgetMax: null,
        bedrooms: null, bedroomsMax: null,
        bathrooms: null, bathroomsMax: null,
        amoblado: null,
        hasPool: 0, hasGym: 0, hasElevator: 0, hasSecurity: 0,
        hasGenerator: 0, hasAppliances: 0,
        hasAC: 0, hasBalcony: 0, hasGarden: 0,
        searchNotes: null,
      };

      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        phone2: form.phone2 || null,
        clientType: form.clientType,
        source: form.source || null,
        status: form.status,
        address: form.address || null,
        city: form.city || null,
        notes: form.notes || null,
        ...searchPayload,
      };
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.details || data?.error || "Error al crear cliente");
      }
      toast.success("Cliente creado exitosamente");
      router.push("/clientes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear el cliente", { duration: 6000 });
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
            <FormField label="Etapa del Embudo">
              <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
                {CLIENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        {/* Búsqueda — only for buyers/renters/investors */}
        {needsSearch && (
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-400">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Qué está buscando</h2>
                <p className="text-xs text-gray-400 mt-0.5">Mientras más detalle pongas, mejores serán los matches con grupos de WhatsApp</p>
              </div>
              <span className="text-xs text-gray-400 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">
                Cliente busca propiedad
              </span>
            </div>

            {/* Operación + tipo propiedad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <FormField label="Operación">
                <select className={inputClass} value={form.searchType} onChange={(e) => update("searchType", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {SEARCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FormField>
              <FormField label="Tipo de Propiedad">
                <select className={inputClass} value={form.searchPropertyType} onChange={(e) => update("searchPropertyType", e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </FormField>
            </div>

            {/* Zonas (multi-select) */}
            <div className="mb-5">
              <FormField label="Zonas de interés (hasta 5)">
                <ZoneSelector value={form.searchZones} onChange={(zs) => update("searchZones", zs)} maxSelect={5} />
              </FormField>
            </div>

            {/* Rango de precio */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rango de precio</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Mínimo</label>
                  <input type="number" placeholder="0" className={inputClass} value={form.budgetMin} onChange={(e) => update("budgetMin", e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Máximo</label>
                  <input type="number" placeholder="0" className={inputClass} value={form.budgetMax} onChange={(e) => update("budgetMax", e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Moneda</label>
                  <select className={inputClass} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Rango habitaciones + baños */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Habitaciones</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Mín</label>
                    <input type="number" placeholder="0" className={inputClass} value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Máx</label>
                    <input type="number" placeholder="0" className={inputClass} value={form.bedroomsMax} onChange={(e) => update("bedroomsMax", e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Baños</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Mín</label>
                    <input type="number" placeholder="0" className={inputClass} value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Máx</label>
                    <input type="number" placeholder="0" className={inputClass} value={form.bathroomsMax} onChange={(e) => update("bathroomsMax", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Amoblado */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amoblado</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: "INDIFERENTE", l: "Indiferente" },
                  { v: "SI", l: "Sí, amoblado" },
                  { v: "NO", l: "No amoblado" },
                ].map((o) => (
                  <button
                    type="button" key={o.v}
                    onClick={() => update("amoblado", o.v)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      form.amoblado === o.v
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenidades */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amenidades importantes</label>
              <p className="text-xs text-gray-400 mb-3">Marca las que sean clave para el cliente (mejora la calidad del match)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AMENITIES.map((a) => {
                  const checked = form[a.field as AmenityKey] as boolean;
                  return (
                    <button
                      type="button" key={a.field}
                      onClick={() => update(a.field, !checked)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                        checked
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                        checked ? "bg-emerald-500 border-emerald-500" : "border-gray-300"
                      }`}>
                        {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                      </span>
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField label="Notas de búsqueda">
              <textarea className={inputClass} rows={3} value={form.searchNotes} onChange={(e) => update("searchNotes", e.target.value)} placeholder="Cualquier detalle adicional que ayude a filtrar..." />
            </FormField>
          </div>
        )}

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
