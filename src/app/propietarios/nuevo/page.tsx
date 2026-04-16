"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function NuevoPropietarioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", phone2: "", address: "", city: "", notes: "" });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]));
      const res = await fetch("/api/owners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      toast.success("Propietario creado");
      router.push(`/propietarios/${data.id}`);
    } catch { toast.error("Error al crear propietario"); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader title="Nuevo Propietario" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre" required><input required className={inputClass} value={form.firstName} onChange={(e) => update("firstName", e.target.value)} /></FormField>
            <FormField label="Apellido" required><input required className={inputClass} value={form.lastName} onChange={(e) => update("lastName", e.target.value)} /></FormField>
            <FormField label="Teléfono"><input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} /></FormField>
            <FormField label="Teléfono 2"><input className={inputClass} value={form.phone2} onChange={(e) => update("phone2", e.target.value)} /></FormField>
            <FormField label="Email"><input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} /></FormField>
            <FormField label="Dirección"><input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} /></FormField>
            <FormField label="Ciudad"><input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} /></FormField>
            <div className="md:col-span-2"><FormField label="Notas"><textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></FormField></div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">{saving ? "Guardando..." : "Crear Propietario"}</button>
          <button type="button" onClick={() => router.push("/propietarios")} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
