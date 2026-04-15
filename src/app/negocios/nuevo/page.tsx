"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";
import { DEAL_TYPES, DEAL_STATUSES, CURRENCIES } from "@/lib/constants";
import { HiPlus, HiTrash } from "react-icons/hi";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

interface Option { id: string; firstName?: string; lastName?: string; title?: string }

interface CommissionPayment {
  id: string;
  label: string;
  amount: string;
  date: string;
  paid: boolean;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function NuevoNegocioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [form, setForm] = useState({
    dealType: "VENTA", status: "EN_PROCESO",
    clientId: "", propertyId: "",
    agreedPrice: "", currency: "USD",
    commissionPct: "", commissionAmount: "",
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

  // Auto-split commission into payments
  function splitCommission(parts: number) {
    const total = parseFloat(form.commissionAmount) || 0;
    if (total <= 0) {
      toast.error("Primero ingresa el monto de comision");
      return;
    }
    const perPart = (total / parts).toFixed(2);
    const labels = parts === 2
      ? ["A la firma", "Al cierre"]
      : ["A la firma", "Durante proceso", "Al cierre"];

    const newPayments: CommissionPayment[] = labels.slice(0, parts).map((label, i) => ({
      id: generateId(),
      label,
      amount: i === parts - 1
        ? (total - parseFloat(perPart) * (parts - 1)).toFixed(2)
        : perPart,
      date: "",
      paid: false,
    }));
    setPayments(newPayments);
  }

  function addPayment() {
    setPayments((prev) => [...prev, {
      id: generateId(),
      label: "",
      amount: "",
      date: "",
      paid: false,
    }]);
  }

  function removePayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePayment(id: string, field: keyof CommissionPayment, value: string | boolean) {
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }

  const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalPaid = payments.filter((p) => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const commissionTotal = parseFloat(form.commissionAmount) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dealType) { toast.error("Tipo de negocio es obligatorio"); return; }
    setSaving(true);
    try {
      const commissionPayments = payments.length > 0 ? JSON.stringify(payments.map((p) => ({
        id: p.id,
        label: p.label,
        amount: parseFloat(p.amount) || 0,
        date: p.date ? new Date(p.date).toISOString() : null,
        paid: p.paid,
      }))) : null;

      const allPaid = payments.length > 0
        ? payments.every((p) => p.paid)
        : false;

      const body = {
        dealType: form.dealType, status: form.status,
        clientId: form.clientId || null, propertyId: form.propertyId || null,
        agreedPrice: form.agreedPrice ? parseFloat(form.agreedPrice) : null,
        currency: form.currency,
        commissionPct: form.commissionPct ? parseFloat(form.commissionPct) : null,
        commissionAmount: form.commissionAmount ? parseFloat(form.commissionAmount) : null,
        commissionPaid: allPaid,
        commissionDate: null,
        commissionPayments,
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
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Informacion del Negocio</h2>
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

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Cliente y Propiedad</h2>
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

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Datos Financieros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Precio Acordado"><input type="number" className={inputClass} value={form.agreedPrice} onChange={(e) => update("agreedPrice", e.target.value)} /></FormField>
            <FormField label="Moneda">
              <select className={inputClass} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
            <FormField label="Comision (%)"><input type="number" step="0.01" className={inputClass} value={form.commissionPct} onChange={(e) => update("commissionPct", e.target.value)} /></FormField>
            <FormField label="Monto Comision Total"><input type="number" step="0.01" className={inputClass} value={form.commissionAmount} onChange={(e) => update("commissionAmount", e.target.value)} /></FormField>
          </div>
        </div>

        {/* Commission Payments Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pagos de Comision</h2>
              <p className="text-xs text-gray-400 mt-0.5">Divide la comision en pagos parciales para tu contabilidad</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => splitCommission(2)} className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                Dividir 50/50
              </button>
              <button type="button" onClick={() => splitCommission(3)} className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                Dividir en 3
              </button>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400 mb-3">No hay pagos parciales configurados</p>
              <button type="button" onClick={addPayment} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                <HiPlus className="w-4 h-4" /> Agregar pago manual
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {payments.map((payment, index) => (
                  <div key={payment.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${payment.paid ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-600 flex-shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase">Concepto</label>
                        <input
                          type="text"
                          className={`${inputClass} text-sm mt-1`}
                          value={payment.label}
                          onChange={(e) => updatePayment(payment.id, "label", e.target.value)}
                          placeholder="Ej: A la firma"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase">Monto</label>
                        <input
                          type="number"
                          step="0.01"
                          className={`${inputClass} text-sm mt-1`}
                          value={payment.amount}
                          onChange={(e) => updatePayment(payment.id, "amount", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-400 uppercase">Fecha</label>
                        <input
                          type="date"
                          className={`${inputClass} text-sm mt-1`}
                          value={payment.date}
                          onChange={(e) => updatePayment(payment.id, "date", e.target.value)}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-green-600 rounded border-gray-300"
                            checked={payment.paid}
                            onChange={(e) => updatePayment(payment.id, "paid", e.target.checked)}
                          />
                          <span className={`text-sm font-medium ${payment.paid ? "text-green-700" : "text-gray-500"}`}>
                            {payment.paid ? "Pagado" : "Pendiente"}
                          </span>
                        </label>
                        <button type="button" onClick={() => removePayment(payment.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={addPayment} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                  <HiPlus className="w-3 h-3" /> Agregar pago
                </button>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-400">Total pagos: </span>
                    <span className={`font-bold ${Math.abs(totalPayments - commissionTotal) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                      ${totalPayments.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      {Math.abs(totalPayments - commissionTotal) >= 0.01 && (
                        <span className="text-xs ml-1">(diferencia: ${(commissionTotal - totalPayments).toFixed(2)})</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Cobrado: </span>
                    <span className="font-bold text-green-600">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Pendiente: </span>
                    <span className="font-bold text-amber-600">${(totalPayments - totalPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {form.dealType === "ALQUILER" && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 border-l-4 border-l-teal-500">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Datos de Alquiler</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Fecha Inicio Contrato"><input type="date" className={inputClass} value={form.contractStartDate} onChange={(e) => update("contractStartDate", e.target.value)} /></FormField>
              <FormField label="Fecha Fin Contrato"><input type="date" className={inputClass} value={form.contractEndDate} onChange={(e) => update("contractEndDate", e.target.value)} /></FormField>
              <FormField label="Renta Mensual"><input type="number" className={inputClass} value={form.monthlyRent} onChange={(e) => update("monthlyRent", e.target.value)} /></FormField>
              <FormField label="Deposito de Seguridad"><input type="number" className={inputClass} value={form.securityDeposit} onChange={(e) => update("securityDeposit", e.target.value)} /></FormField>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Cierre y Documentacion</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Fecha de Cierre"><input type="date" className={inputClass} value={form.closingDate} onChange={(e) => update("closingDate", e.target.value)} /></FormField>
            <FormField label="Link Google Drive"><input className={inputClass} value={form.driveLink} onChange={(e) => update("driveLink", e.target.value)} placeholder="https://drive.google.com/..." /></FormField>
          </div>
          <div className="mt-4">
            <FormField label="Notas"><textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></FormField>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 shadow-sm shadow-blue-200">
            {saving ? "Guardando..." : "Guardar Negocio"}
          </button>
          <button type="button" onClick={() => router.push("/negocios")} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2.5 rounded-xl font-medium transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
