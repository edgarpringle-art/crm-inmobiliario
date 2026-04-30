"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import LocationSelect from "@/components/LocationSelect";
import { PROPERTY_TYPES, OPERATION_TYPES, PROPERTY_STATUSES, CURRENCIES } from "@/lib/constants";
import { getProvinces, getDistricts, getSectors } from "@/lib/locations";
import PhotoUploader from "@/components/PhotoUploader";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const checkboxClass = "w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500";

interface ClientOption { id: string; firstName: string; lastName: string }

const amenities = [
  { field: "hasPool", label: "Piscina" },
  { field: "hasGym", label: "Gimnasio" },
  { field: "hasElevator", label: "Ascensor" },
  { field: "hasSecurity", label: "Seguridad" },
  { field: "hasGenerator", label: "Planta Eléctrica" },
  { field: "hasFurniture", label: "Amueblado" },
  { field: "hasAppliances", label: "Línea Blanca" },
  { field: "hasAC", label: "Aires" },
  { field: "hasBalcony", label: "Balcón" },
  { field: "hasGarden", label: "Jardín" },
];

export default function NuevaPropiedadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", propertyType: "APARTAMENTO", operationType: "VENTA", status: "DISPONIBLE",
    address: "", sector: "", city: "", state: "", country: "Panamá", referencePoint: "",
    salePrice: "", rentPrice: "", currency: "USD", maintenanceFee: "",
    area: "", landArea: "", bedrooms: "", bathrooms: "", parkingSpots: "", floors: "", yearBuilt: "",
    hasPool: false, hasGym: false, hasElevator: false, hasSecurity: false, hasGenerator: false,
    hasFurniture: false, hasAppliances: false, hasAC: false, hasBalcony: false, hasGarden: false,
    ownerId: "", ownerName: "", ownerPhone: "",
    driveLink: "", description: "", notes: "",
  });

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
    setProvinces(getProvinces());
  }, []);

  useEffect(() => {
    if (form.state) {
      setDistricts(getDistricts(form.state));
      setForm((p) => ({ ...p, city: "" }));
    }
  }, [form.state]);

  useEffect(() => {
    if (form.city) {
      setSectors(getSectors(form.city));
      setForm((p) => ({ ...p, sector: "" }));
    }
  }, [form.city]);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.propertyType || !form.operationType) {
      toast.error("Título, tipo y operación son obligatorios"); return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        photos: photos.length > 0 ? JSON.stringify(photos) : null,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        rentPrice: form.rentPrice ? parseFloat(form.rentPrice) : null,
        maintenanceFee: form.maintenanceFee ? parseFloat(form.maintenanceFee) : null,
        area: form.area ? parseFloat(form.area) : null,
        landArea: form.landArea ? parseFloat(form.landArea) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        parkingSpots: form.parkingSpots ? parseInt(form.parkingSpots) : null,
        floors: form.floors ? parseInt(form.floors) : null,
        yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt) : null,
        ownerId: form.ownerId || null,
        ownerName: form.ownerName || null,
        ownerPhone: form.ownerPhone || null,
        address: form.address || null, sector: form.sector || null, city: form.city || null,
        state: form.state || null, referencePoint: form.referencePoint || null,
        driveLink: form.driveLink || null, description: form.description || null, notes: form.notes || null,
      };
      const res = await fetch("/api/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error");
      toast.success("Propiedad creada exitosamente");
      router.push("/propiedades");
    } catch { toast.error("Error al crear la propiedad"); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader title="Nueva Propiedad" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Título" required><input className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ej: Apartamento en Piantini" /></FormField>
            <FormField label="Tipo de Propiedad" required>
              <select className={inputClass} value={form.propertyType} onChange={(e) => update("propertyType", e.target.value)}>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Tipo de Operación" required>
              <select className={inputClass} value={form.operationType} onChange={(e) => update("operationType", e.target.value)}>
                {OPERATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Estado">
              <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
                {PROPERTY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Dirección"><input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} /></FormField>
            <FormField label="Provincia">
              <select className={inputClass} value={form.state} onChange={(e) => update("state", e.target.value)}>
                <option value="">Seleccionar...</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Distrito">
              <select className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} disabled={!form.state}>
                <option value="">Seleccionar...</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </FormField>
            <FormField label="Corregimiento / Sector">
              <select className={inputClass} value={form.sector} onChange={(e) => update("sector", e.target.value)} disabled={!form.city}>
                <option value="">Seleccionar...</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="País"><input className={inputClass} value={form.country} onChange={(e) => update("country", e.target.value)} disabled /></FormField>
            <FormField label="Punto de Referencia"><input className={inputClass} value={form.referencePoint} onChange={(e) => update("referencePoint", e.target.value)} /></FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Precio de Venta"><input type="number" className={inputClass} value={form.salePrice} onChange={(e) => update("salePrice", e.target.value)} /></FormField>
            <FormField label="Precio de Alquiler (mensual)"><input type="number" className={inputClass} value={form.rentPrice} onChange={(e) => update("rentPrice", e.target.value)} /></FormField>
            <FormField label="Moneda">
              <select className={inputClass} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
            <FormField label="Cuota de Mantenimiento"><input type="number" className={inputClass} value={form.maintenanceFee} onChange={(e) => update("maintenanceFee", e.target.value)} /></FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Características</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField label="Área (m²)"><input type="number" className={inputClass} value={form.area} onChange={(e) => update("area", e.target.value)} /></FormField>
            <FormField label="Terreno (m²)"><input type="number" className={inputClass} value={form.landArea} onChange={(e) => update("landArea", e.target.value)} /></FormField>
            <FormField label="Habitaciones"><input type="number" className={inputClass} value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} /></FormField>
            <FormField label="Baños"><input type="number" className={inputClass} value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} /></FormField>
            <FormField label="Parqueos"><input type="number" className={inputClass} value={form.parkingSpots} onChange={(e) => update("parkingSpots", e.target.value)} /></FormField>
            <FormField label="Niveles"><input type="number" className={inputClass} value={form.floors} onChange={(e) => update("floors", e.target.value)} /></FormField>
            <FormField label="Año de Construcción"><input type="number" className={inputClass} value={form.yearBuilt} onChange={(e) => update("yearBuilt", e.target.value)} /></FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {amenities.map((a) => (
              <label key={a.field} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className={checkboxClass} checked={form[a.field as keyof typeof form] as boolean} onChange={(e) => update(a.field, e.target.checked)} />
                <span className="text-sm text-gray-700">{a.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Propietario</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Seleccionar Cliente">
              <select className={inputClass} value={form.ownerId} onChange={(e) => update("ownerId", e.target.value)}>
                <option value="">Sin vincular</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </FormField>
            <div />
            <FormField label="Nombre del Propietario (si no es cliente)"><input className={inputClass} value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} /></FormField>
            <FormField label="Teléfono del Propietario"><input className={inputClass} value={form.ownerPhone} onChange={(e) => update("ownerPhone", e.target.value)} /></FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fotos</h2>
          <PhotoUploader photos={photos} onChange={setPhotos} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentación</h2>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Link Google Drive"><input className={inputClass} value={form.driveLink} onChange={(e) => update("driveLink", e.target.value)} placeholder="https://drive.google.com/..." /></FormField>
            <FormField label="Descripción"><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} /></FormField>
            <FormField label="Notas adicionales WhatsApp (opcional)">
              <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Ej: Remodelado, vista al mar, acepta mascotas. (El resumen se genera automáticamente al ver la propiedad)" />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar Propiedad"}
          </button>
          <button type="button" onClick={() => router.push("/propiedades")} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
