"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import { DEAL_TYPES, DEAL_STATUSES, CURRENCIES } from "@/lib/constants";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

interface Option { id: string; firstName?: string; lastName?: string; title?: string }

export default function NuevoNegocioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [form, setForm] = useState({
    dealType: "VENTA", status: "EN_PROCESO",
    clientId: "", propertyId: "",
    agreedPrice: "", currency: "USD",
    commissionPct: "", commissionAmount: "", commissionPaid: false, commissionDate: "",
    contractStartDate: "", contractEndDate: "", monthlyRent: "", securityDeposit: "",
    closingDate: "", driveLink: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/properties").then((r) => r.json()),
    ]).then(([c, p]) => { setClients(c); setProperties(p); });
  }, []);

  function update(field: string, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if ((field === "commissionPct" || field === "agreedPrice") && next.agreedPrice && next.commissionPct) {
        next.commissionAmount = (parseFloat(next.agreedPrice) * parseFloat(next.commissionPct) / 100).toFixed(2);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dealType) { toast.error("Tipo de negocio es obligatorio"); return; }
    setSaving(true);
    try {
      const body = {
        dealType: form.dealType, status: form.status,
        clientId: form.clientId || null, propertyId: form.propertyId || null,
        agreedPrice: form.agreedPrice ? parseFloat(form.agreedPrice) : null,
        currency: form.currency,
        commissionPct: form.commissionPct ? parseFloat(form.commissionPct) : null,
        commissionAmount: form.commissionAmount ? parseFloat(form.commissionAmount) : null,
        commissionPaid: form.commissionPaid,
        commissionDate: form.commissionDate ? new Date(form.commissionDate).toISOString() : null,
        contractStartDate: form.contractStartDate ? new Date(form.contractStartDate).toISOString() : null,
        contractEndDate: form.contractEndDate ? new Date(form.contractEndDate).toISOString() : null,
        monthlyRent: form.monthlyRent ? parseFloat(form.monthlyRent) : null,
        securityDeposit: form.securityDeposit ? parseFloat(form.securityDeposit) : null,
        closingDate: form.closingDate ? new Date(form.closingDate).toISOString() : null,
        driveLink: form.driveLink || null, notes: form.notes || null,
      };
      const res = await fetch("/api/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error");
      toast.success("Negocio creado exitosamente");
      router.push("/negocios");
    } catch { toast.error("Error al crear el negocio"); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader title="Nuevo Negocio" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tipo de Negocio" required>
              <select className={inputClass} value={form.dealType} onChange={(e) => update("dealType", e.target.value)}>
                {DEAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </FormField>
            <FormField label="Estado">
              <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>
                {DEAL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente y Propiedad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Cliente">
              <select className={inputClass} value={form.clientId} onChange={(e) => update("clientId", e.target.value)}>
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </FormField>
            <FormField label="Propiedad">
              <select className={inputClass} value={form.propertyId} onChange={(e) => update("propertyId", e.target.value)}>
                <option value="">Seleccionar propiedad...</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos Financieros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Precio Acordado"><input type="number" className={inputClass} value={form.agreedPrice} onChange={(e) => update("agreedPrice", e.target.value)} /></FormField>
            <FormField label="Moneda">
              <select className={inputClass} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
            <FormField label="Comisión (%)"><input type="number" step="0.01" className={inputClass} value={form.commissionPct} onChange={(e) => update("commissionPct", e.target.value)} /></FormField>
            <FormField label="Monto Comisión"><input type="number" step="0.01" className={inputClass} value={form.commissionAmount} onChange={(e) => update("commissionAmount", e.target.value)} /></FormField>
            <FormField label="Comisión Pagada">
              <label className="flex items-center gap-2 mt-2">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={form.commissionPaid} onChange={(e) => update("commissionPaid", e.target.checked)} />
                <span className="text-sm text-gray-700">Sí, ya fue pagada</span>
              </label>
            </FormField>
            <FormField label="Fecha de Cobro Comisión"><input type="date" className={inputClass} value={form.commissionDate} onChange={(e) => update("commissionDate", e.target.value)} /></FormField>
          </div>
        </div>

        {form.dealType === "ALQUILER" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de Alquiler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Fecha Inicio Contrato"><input type="date" className={inputClass} value={form.contractStartDate} onChange={(e) => update("contractStartDate", e.target.value)} /></FormField>
              <FormField label="Fecha Fin Contrato"><input type="date" className={inputClass} value={form.contractEndDate} onChange={(e) => update("contractEndDate", e.target.value)} /></FormField>
              <FormField label="Renta Mensual"><input type="number" className={inputClass} value={form.monthlyRent} onChange={(e) => update("monthlyRent", e.target.value)} /></FormField>
              <FormField label="Depósito de Seguridad"><input type="number" className={inputClass} value={form.securityDeposit} onChange={(e) => update("securityDeposit", e.target.value)} /></FormField>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cierre y Documentación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Fecha de Cierre"><input type="date" className={inputClass} value={form.closingDate} onChange={(e) => update("closingDate", e.target.value)} /></FormField>
            <FormField label="Link Google Drive"><input className={inputClass} value={form.driveLink} onChange={(e) => update("driveLink", e.target.value)} placeholder="https://drive.google.com/..." /></FormField>
          </div>
          <div className="mt-4">
            <FormField label="Notas"><textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></FormField>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar Negocio"}
          </button>
          <button type="button" onClick={() => router.push("/negocios")} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
