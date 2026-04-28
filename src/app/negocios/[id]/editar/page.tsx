"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import { DEAL_TYPES, DEAL_STATUSES, CURRENCIES } from "@/lib/constants";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

interface Option { id: string; firstName?: string; lastName?: string; title?: string }
interface AgentOption { id: string; code: string; fullName: string; role: string }

function toDateInput(val: string | null): string {
  if (!val) return "";
  return new Date(val).toISOString().split("T")[0];
}

export default function EditarNegocioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [form, setForm] = useState({
    dealType: "VENTA", status: "EN_PROCESO",
    internalAgentId: "",
    clientId: "", propertyId: "",
    agreedPrice: "", currency: "USD",
    commissionPct: "", commissionAmount: "", commissionPaid: false, commissionDate: "",
    companyShare: "",
    internalAgentShare: "",
    externalAgentName: "",
    externalAgentPhone: "",
    externalAgentShare: "",
    contractStartDate: "", contractEndDate: "", monthlyRent: "", securityDeposit: "",
    closingDate: "", driveLink: "", notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/deals/${id}`).then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/properties").then((r) => r.json()),
      fetch("/api/agents?active=1").then((r) => r.json()),
    ]).then(([data, c, p, ag]) => {
      const agList: AgentOption[] = Array.isArray(ag) ? ag : [];
      setClients(Array.isArray(c) ? c : []);
      setProperties(Array.isArray(p) ? p : []);
      setAgents(agList);

      // Backward compat: if no internalAgentId but assignedAgent exists, match by code
      let internalAgentId = data.internalAgentId || "";
      if (!internalAgentId && data.assignedAgent) {
        const match = agList.find((a) => a.code.toLowerCase() === String(data.assignedAgent).toLowerCase());
        if (match) internalAgentId = match.id;
      }

      setForm({
        dealType: data.dealType, status: data.status,
        internalAgentId,
        clientId: data.clientId || "", propertyId: data.propertyId || "",
        agreedPrice: data.agreedPrice?.toString() || "", currency: data.currency || "USD",
        commissionPct: data.commissionPct?.toString() || "",
        commissionAmount: data.commissionAmount?.toString() || "",
        commissionPaid: !!data.commissionPaid,
        commissionDate: toDateInput(data.commissionDate),
        companyShare: data.companyShare?.toString() || "",
        internalAgentShare: data.internalAgentShare?.toString() || "",
        externalAgentName: data.externalAgentName || "",
        externalAgentPhone: data.externalAgentPhone || "",
        externalAgentShare: data.externalAgentShare?.toString() || "",
        contractStartDate: toDateInput(data.contractStartDate),
        contractEndDate: toDateInput(data.contractEndDate),
        monthlyRent: data.monthlyRent?.toString() || "",
        securityDeposit: data.securityDeposit?.toString() || "",
        closingDate: toDateInput(data.closingDate),
        driveLink: data.driveLink || "", notes: data.notes || "",
      });
      setLoading(false);
    });
  }, [id]);

  function update(field: string, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if ((field === "commissionPct" || field === "agreedPrice") && next.agreedPrice && next.commissionPct) {
        next.commissionAmount = (parseFloat(next.agreedPrice) * parseFloat(next.commissionPct) / 100).toFixed(2);
      }
      return next;
    });
  }

  const commissionTotal = parseFloat(form.commissionAmount) || 0;
  const companyShareNum = parseFloat(form.companyShare) || 0;
  const internalAgentShareNum = parseFloat(form.internalAgentShare) || 0;
  const externalAgentShareNum = parseFloat(form.externalAgentShare) || 0;
  const splitTotal = companyShareNum + internalAgentShareNum + externalAgentShareNum;
  const splitDiff = commissionTotal - splitTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.internalAgentId) { toast.error("Selecciona un agente del CRM"); return; }
    setSaving(true);
    try {
      const internalAgent = agents.find((a) => a.id === form.internalAgentId);
      const assignedAgent = internalAgent ? internalAgent.code.toUpperCase() : null;

      const body = {
        dealType: form.dealType, status: form.status,
        assignedAgent,
        internalAgentId: form.internalAgentId || null,
        clientId: form.clientId || null, propertyId: form.propertyId || null,
        agreedPrice: form.agreedPrice ? parseFloat(form.agreedPrice) : null,
        currency: form.currency,
        commissionPct: form.commissionPct ? parseFloat(form.commissionPct) : null,
        commissionAmount: form.commissionAmount ? parseFloat(form.commissionAmount) : null,
        commissionPaid: form.commissionPaid,
        commissionDate: form.commissionDate ? new Date(form.commissionDate).toISOString() : null,
        companyShare: form.companyShare ? parseFloat(form.companyShare) : null,
        internalAgentShare: form.internalAgentShare ? parseFloat(form.internalAgentShare) : null,
        externalAgentName: form.externalAgentName || null,
        externalAgentPhone: form.externalAgentPhone || null,
        externalAgentShare: form.externalAgentShare ? parseFloat(form.externalAgentShare) : null,
        contractStartDate: form.contractStartDate ? new Date(form.contractStartDate).toISOString() : null,
        contractEndDate: form.contractEndDate ? new Date(form.contractEndDate).toISOString() : null,
        monthlyRent: form.monthlyRent ? parseFloat(form.monthlyRent) : null,
        securityDeposit: form.securityDeposit ? parseFloat(form.securityDeposit) : null,
        closingDate: form.closingDate ? new Date(form.closingDate).toISOString() : null,
        driveLink: form.driveLink || null, notes: form.notes || null,
      };
      const res = await fetch(`/api/deals/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error");
      toast.success("Negocio actualizado");
      router.push(`/negocios/${id}`);
    } catch { toast.error("Error al actualizar"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;

  return (
    <div>
      <PageHeader title="Editar Negocio" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Negocio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tipo" required>
              <select className={inputClass} value={form.dealType} onChange={(e) => update("dealType", e.target.value)}>{DEAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
            </FormField>
            <FormField label="Estado">
              <select className={inputClass} value={form.status} onChange={(e) => update("status", e.target.value)}>{DEAL_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cliente y Propiedad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Cliente"><select className={inputClass} value={form.clientId} onChange={(e) => update("clientId", e.target.value)}><option value="">Seleccionar...</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}</select></FormField>
            <FormField label="Propiedad"><select className={inputClass} value={form.propertyId} onChange={(e) => update("propertyId", e.target.value)}><option value="">Seleccionar...</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos Financieros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Precio Acordado"><input type="number" className={inputClass} value={form.agreedPrice} onChange={(e) => update("agreedPrice", e.target.value)} /></FormField>
            <FormField label="Moneda"><select className={inputClass} value={form.currency} onChange={(e) => update("currency", e.target.value)}>{CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></FormField>
            <FormField label="Comisión (%)"><input type="number" step="0.01" className={inputClass} value={form.commissionPct} onChange={(e) => update("commissionPct", e.target.value)} /></FormField>
            <FormField label="Monto Comisión Total"><input type="number" step="0.01" className={inputClass} value={form.commissionAmount} onChange={(e) => update("commissionAmount", e.target.value)} /></FormField>
            <FormField label="Comisión Pagada"><label className="flex items-center gap-2 mt-2"><input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={form.commissionPaid} onChange={(e) => update("commissionPaid", e.target.checked)} /><span className="text-sm">Sí</span></label></FormField>
            <FormField label="Fecha Cobro"><input type="date" className={inputClass} value={form.commissionDate} onChange={(e) => update("commissionDate", e.target.value)} /></FormField>
          </div>
        </div>

        {/* Distribución de Comisión */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-amber-500">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Distribución de Comisión</h2>
          <p className="text-xs text-gray-400 mb-4">Asigna manualmente cuánto va a cada parte. La suma debe igualar el monto total.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Agente del CRM" required>
              <select className={inputClass} value={form.internalAgentId} onChange={(e) => update("internalAgentId", e.target.value)}>
                <option value="">Seleccionar agente...</option>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.fullName}{a.role !== "agent" ? ` (${a.role})` : ""}</option>)}
              </select>
            </FormField>
            <div />
            <FormField label="🏢 Empresa (Edgar)">
              <input type="number" step="0.01" className={inputClass} value={form.companyShare} onChange={(e) => update("companyShare", e.target.value)} placeholder="0.00" />
            </FormField>
            <FormField label="👤 Agente CRM">
              <input type="number" step="0.01" className={inputClass} value={form.internalAgentShare} onChange={(e) => update("internalAgentShare", e.target.value)} placeholder="0.00" />
            </FormField>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Agente Externo (cocomisión, opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Nombre"><input className={inputClass} value={form.externalAgentName} onChange={(e) => update("externalAgentName", e.target.value)} /></FormField>
              <FormField label="Teléfono"><input className={inputClass} value={form.externalAgentPhone} onChange={(e) => update("externalAgentPhone", e.target.value)} /></FormField>
              <FormField label="Monto"><input type="number" step="0.01" className={inputClass} value={form.externalAgentShare} onChange={(e) => update("externalAgentShare", e.target.value)} /></FormField>
            </div>
          </div>

          {commissionTotal > 0 && (
            <div className={`mt-4 p-3 rounded-xl border text-sm flex justify-between items-center ${
              Math.abs(splitDiff) < 0.01 ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              <span className="font-semibold">
                Total distribuido: ${splitTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                <span className="text-gray-500"> / ${commissionTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
              </span>
              {Math.abs(splitDiff) >= 0.01 && (
                <span className="font-bold">{splitDiff > 0 ? `Falta: $${splitDiff.toFixed(2)}` : `Sobra: $${(-splitDiff).toFixed(2)}`}</span>
              )}
            </div>
          )}
        </div>

        {form.dealType === "ALQUILER" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-teal-500">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de Alquiler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Inicio Contrato"><input type="date" className={inputClass} value={form.contractStartDate} onChange={(e) => update("contractStartDate", e.target.value)} /></FormField>
              <FormField label="Fin Contrato"><input type="date" className={inputClass} value={form.contractEndDate} onChange={(e) => update("contractEndDate", e.target.value)} /></FormField>
              <FormField label="Renta Mensual"><input type="number" className={inputClass} value={form.monthlyRent} onChange={(e) => update("monthlyRent", e.target.value)} /></FormField>
              <FormField label="Depósito"><input type="number" className={inputClass} value={form.securityDeposit} onChange={(e) => update("securityDeposit", e.target.value)} /></FormField>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cierre y Documentación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Fecha de Cierre"><input type="date" className={inputClass} value={form.closingDate} onChange={(e) => update("closingDate", e.target.value)} /></FormField>
            <FormField label="Link Google Drive"><input className={inputClass} value={form.driveLink} onChange={(e) => update("driveLink", e.target.value)} /></FormField>
          </div>
          <div className="mt-4"><FormField label="Notas"><textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></FormField></div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">{saving ? "Guardando..." : "Actualizar Negocio"}</button>
          <button type="button" onClick={() => router.push(`/negocios/${id}`)} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
