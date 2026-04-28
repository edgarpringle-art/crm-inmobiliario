"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import FormField from "@/components/FormField";

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const COLORS = [
  { value: "from-blue-500 to-blue-600", label: "Azul" },
  { value: "from-purple-500 to-purple-600", label: "Púrpura" },
  { value: "from-pink-500 to-rose-600", label: "Rosa" },
  { value: "from-green-500 to-emerald-600", label: "Verde" },
  { value: "from-amber-500 to-orange-600", label: "Naranja" },
  { value: "from-indigo-500 to-blue-600", label: "Índigo" },
  { value: "from-teal-500 to-cyan-600", label: "Teal" },
  { value: "from-red-500 to-pink-600", label: "Rojo" },
  { value: "from-slate-500 to-slate-600", label: "Gris" },
];

export default function NuevoAgentePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "agent",
    initials: "",
    color: "from-blue-500 to-blue-600",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.fullName || !form.password) {
      toast.error("Código, nombre y contraseña son obligatorios");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(form.code.toLowerCase())) {
      toast.error("Código solo letras minúsculas, números o '_' (sin espacios)");
      return;
    }
    if (form.password.length < 6) {
      toast.error("La contraseña debe tener mínimo 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...form,
        code: form.code.toLowerCase().trim(),
        initials: form.initials || form.fullName.split(" ").map((s) => s.charAt(0)).slice(0, 2).join("").toUpperCase(),
      };
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error");
      }
      toast.success("Agente creado");
      router.push("/agentes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear agente");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Nuevo Agente" />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos de Acceso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Código (usuario login)" required>
              <input
                className={inputClass}
                value={form.code}
                onChange={(e) => update("code", e.target.value.toLowerCase())}
                placeholder="ej: maria"
                autoComplete="off"
              />
            </FormField>
            <FormField label="Contraseña" required>
              <input
                type="text"
                className={inputClass}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Rol" required>
              <select className={inputClass} value={form.role} onChange={(e) => update("role", e.target.value)}>
                <option value="agent">Agente (sin contabilidad de empresa)</option>
                <option value="admin">Admin (acceso total)</option>
                <option value="broker">Broker (gestiona otros agentes)</option>
              </select>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre completo" required>
              <input className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Ej: María González" />
            </FormField>
            <FormField label="Iniciales (avatar)">
              <input className={inputClass} value={form.initials} onChange={(e) => update("initials", e.target.value.toUpperCase().slice(0, 3))} placeholder="MG" maxLength={3} />
            </FormField>
            <FormField label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
            </FormField>
            <FormField label="Teléfono">
              <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+507 6000-0000" />
            </FormField>
            <FormField label="Color del avatar">
              <select className={inputClass} value={form.color} onChange={(e) => update("color", e.target.value)}>
                {COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Notas">
                <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
              </FormField>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? "Guardando..." : "Crear Agente"}
          </button>
          <button type="button" onClick={() => router.push("/agentes")} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
