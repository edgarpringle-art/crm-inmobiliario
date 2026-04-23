"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import ZoneSelector from "@/components/ZoneSelector";
import { PROPERTY_TYPES, CURRENCIES, AGENTS } from "@/lib/constants";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

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
  const [form, setForm] = useState({
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
    requisitos: "",
    assignedAgent: "EDGAR",
    status: "ACTIVO",
  });

  useEffect(() => {
    fetch(`/api/busquedas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Contacto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre completo" required>
              <input className={inputClass} value={form.nombre} onChange={(e) => update("nombre", e.target.value)} />
            </FormField>
            <FormField label="Teléfono / WhatsApp">
              <input className={inputClass} value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
            </FormField>
            <FormField label="Teléfono 2">
              <input className={inputClass} value={form.telefono2} onChange={(e) => update("telefono2", e.target.value)} />
            </FormField>
            <FormField label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
            </FormField>
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
          <p className="text-xs text-gray-400 mb-4">Hasta 5 zonas — usadas para matches del bot de WhatsApp.</p>
          <ZoneSelector
            value={form.zonas}
            onChange={(z) => update("zonas", z)}
            maxSelect={5}
          />
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
