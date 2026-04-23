"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import ZoneSelector from "@/components/ZoneSelector";
import { PROPERTY_TYPES, CURRENCIES, AGENTS } from "@/lib/constants";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const checkboxClass = "w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  phone2?: string | null;
}

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

function parseZonas(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  return [];
}

export default function EditarBusquedaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({
    clientId: "",
    nombre: "",
    telefono: "",
    telefono2: "",
    email: "",
    modalidad: "COMPRA",
    tipoPropiedad: "APARTAMENTO",
    presupuestoMin: "",
    presupuestoMax: "",
    currency: "USD",
    habitacionesMin: "",
    zonas: [] as string[],
    amoblado: "INDIFERENTE",
    hasPool: false, hasGym: false, hasElevator: false, hasSecurity: false,
    hasGenerator: false, hasFurniture: false, hasAppliances: false,
    hasAC: false, hasBalcony: false, hasGarden: false,
    requisitos: "",
    assignedAgent: "EDGAR",
    status: "ACTIVO",
  });

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => setClients([]));

    fetch(`/api/busquedas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          clientId: data.clientId ?? "",
          nombre: data.nombre ?? "",
          telefono: data.telefono ?? "",
          telefono2: data.telefono2 ?? "",
          email: data.email ?? "",
          modalidad: data.modalidad ?? "COMPRA",
          tipoPropiedad: data.tipoPropiedad ?? "APARTAMENTO",
          presupuestoMin: data.presupuestoMin != null ? String(data.presupuestoMin) : "",
          presupuestoMax: data.presupuestoMax != null ? String(data.presupuestoMax) : "",
          currency: data.currency ?? "USD",
          habitacionesMin: data.habitacionesMin != null ? String(data.habitacionesMin) : "",
          zonas: parseZonas(data.zonas),
          amoblado: data.amoblado ?? "INDIFERENTE",
          hasPool: !!data.hasPool, hasGym: !!data.hasGym, hasElevator: !!data.hasElevator,
          hasSecurity: !!data.hasSecurity, hasGenerator: !!data.hasGenerator,
          hasFurniture: !!data.hasFurniture, hasAppliances: !!data.hasAppliances,
          hasAC: !!data.hasAC, hasBalcony: !!data.hasBalcony, hasGarden: !!data.hasGarden,
          requisitos: data.requisitos ?? "",
          assignedAgent: data.assignedAgent ?? "EDGAR",
          status: data.status ?? "ACTIVO",
        });
        setLoading(false);
      })
      .catch(() => { toast.error("Error al cargar"); router.push("/busquedas"); });
  }, [id]); // eslint-disable-line

  function update(field: string, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleClientSelect(clientId: string) {
    const c = clients.find((x) => x.id === clientId);
    setForm((p) => ({
      ...p,
      clientId,
      nombre: c ? `${c.firstName} ${c.lastName}` : p.nombre,
      telefono: c?.phone ?? p.telefono,
      telefono2: c?.phone2 ?? p.telefono2,
      email: c?.email ?? p.email,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) { toast.error("Selecciona un cliente"); return; }
    if (form.zonas.length === 0) { toast.error("Selecciona al menos una zona"); return; }

    setSaving(true);
    try {
      const body = {
        ...form,
        presupuestoMin: form.presupuestoMin ? parseFloat(form.presupuestoMin) : null,
        presupuestoMax: form.presupuestoMax ? parseFloat(form.presupuestoMax) : null,
        habitacionesMin: form.habitacionesMin ? parseInt(form.habitacionesMin) : null,
        telefono: form.telefono || null,
        telefono2: form.telefono2 || null,
        email: form.email || null,
        requisitos: form.requisitos || null,
      };
      const res = await fetch(`/api/busquedas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      toast.success("Búsqueda actualizada");
      router.push("/busquedas");
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Cargando...</div>;

  return (
    <div>
      <PageHeader title="Editar Búsqueda" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente</h2>
          <div className="grid grid-cols-1 gap-4">
            <FormField label="Seleccionar Cliente" required>
              <div className="flex gap-2">
                <select className={inputClass} value={form.clientId} onChange={(e) => handleClientSelect(e.target.value)}>
                  <option value="">— Selecciona un cliente —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}{c.phone ? ` · ${c.phone}` : ""}
                    </option>
                  ))}
                </select>
                <Link href="/clientes/nuevo" className="whitespace-nowrap px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors" target="_blank">
                  + Crear
                </Link>
              </div>
            </FormField>
            {form.clientId && (
              <div className="flex gap-4 flex-wrap text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <span>📞 {form.telefono || "sin teléfono"}</span>
                {form.email && <span>✉️ {form.email}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Qué Busca</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Modalidad" required>
              <select className={inputClass} value={form.modalidad} onChange={(e) => update("modalidad", e.target.value)}>
                <option value="COMPRA">Compra</option>
                <option value="ALQUILER">Alquiler</option>
              </select>
            </FormField>
            <FormField label="Tipo de Propiedad">
              <select className={inputClass} value={form.tipoPropiedad} onChange={(e) => update("tipoPropiedad", e.target.value)}>
                {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Presupuesto Mínimo">
              <input type="number" className={inputClass} value={form.presupuestoMin} onChange={(e) => update("presupuestoMin", e.target.value)} />
            </FormField>
            <FormField label="Presupuesto Máximo">
              <input type="number" className={inputClass} value={form.presupuestoMax} onChange={(e) => update("presupuestoMax", e.target.value)} />
            </FormField>
            <FormField label="Moneda">
              <select className={inputClass} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
            <FormField label="Habitaciones mínimas">
              <input type="number" className={inputClass} value={form.habitacionesMin} onChange={(e) => update("habitacionesMin", e.target.value)} />
            </FormField>
            <FormField label="Amoblado">
              <select className={inputClass} value={form.amoblado} onChange={(e) => update("amoblado", e.target.value)}>
                <option value="INDIFERENTE">Indiferente</option>
                <option value="SI">Sí, amoblado</option>
                <option value="NO">No amoblado</option>
              </select>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Zonas Preferidas</h2>
          <p className="text-xs text-gray-400 mb-4">Hasta 5 zonas — usadas para matches del bot.</p>
          <ZoneSelector
            value={form.zonas}
            onChange={(z) => update("zonas", z)}
            maxSelect={5}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Amenidades Deseadas</h2>
          <p className="text-xs text-gray-400 mb-4">Características que la propiedad debe tener.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {amenities.map((a) => (
              <label key={a.field} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={form[a.field as keyof typeof form] as boolean}
                  onChange={(e) => update(a.field, e.target.checked)}
                />
                <span className="text-sm text-gray-700">{a.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notas y Asignación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Agente Asignado">
              <select className={inputClass} value={form.assignedAgent} onChange={(e) => update("assignedAgent", e.target.value)}>
                {AGENTS.filter((a) => a.value !== "AMBOS").map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </FormField>
            <FormField label="Estado">
              <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="ACTIVO">Activo</option>
                <option value="PAUSADO">Pausado</option>
                <option value="CERRADO">Cerrado</option>
              </select>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Requisitos / Notas">
                <textarea className={inputClass} rows={3} value={form.requisitos} onChange={(e) => update("requisitos", e.target.value)} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button type="button" onClick={() => router.push("/busquedas")} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
