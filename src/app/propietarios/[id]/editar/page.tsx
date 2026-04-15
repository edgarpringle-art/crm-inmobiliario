"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

export default function EditarPropietarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", phone2: "", cedula: "", address: "", city: "", notes: "" });

  useEffect(() => {
    fetch(`/api/owners/${id}`).then((r) => r.json()).then((data) => {
      setForm({
        firstName: data.firstName || "", lastName: data.lastName || "",
        email: data.email || "", phone: data.phone || "", phone2: data.phone2 || "",
        cedula: data.cedula || "", address: data.address || "", city: data.city || "", notes: data.notes || "",
      });
      setLoading(false);
    });
  }, [id]);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null]));
      const res = await fetch(`/api/owners/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Error");
      toast.success("Propietario actualizado");
      router.push(`/propietarios/${id}`);
    } catch { toast.error("Error al actualizar"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;

  return (
    <div>
      <PageHeader title="Editar Propietario" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre" required><input required className={inputClass} value={form.firstName} onChange={(e) => update("firstName", e.target.value)} /></FormField>
            <FormField label="Apellido" required><input required className={inputClass} value={form.lastName} onChange={(e) => update("lastName", e.target.value)} /></FormField>
            <FormField label="Teléfono"><input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} /></FormField>
            <FormField label="Teléfono 2"><input className={inputClass} value={form.phone2} onChange={(e) => update("phone2", e.target.value)} /></FormField>
            <FormField label="Email"><input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} /></FormField>
            <FormField label="Cédula"><input className={inputClass} value={form.cedula} onChange={(e) => update("cedula", e.target.value)} /></FormField>
            <FormField label="Dirección"><input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} /></FormField>
            <FormField label="Ciudad"><input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} /></FormField>
            <div className="md:col-span-2"><FormField label="Notas"><textarea className={inputClass} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></FormField></div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium disabled:opacity-50">{saving ? "Guardando..." : "Actualizar"}</button>
          <button type="button" onClick={() => router.push(`/propietarios/${id}`)} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium">Cancelar</button>
        </div>
      </form>
    </div>
  );
}
