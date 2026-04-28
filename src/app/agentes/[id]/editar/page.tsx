"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditarAgentePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "agent",
    initials: "",
    color: "from-blue-500 to-blue-600",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/agents/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCode(d.code);
        setForm({
          fullName: d.fullName ?? "",
          email: d.email ?? "",
          phone: d.phone ?? "",
          password: "",
          role: d.role ?? "agent",
          initials: d.initials ?? "",
          color: d.color ?? "from-blue-500 to-blue-600",
          notes: d.notes ?? "",
        });
        setLoading(false);
      })
      .catch(() => { toast.error("Error al cargar"); router.push("/agentes"); });
  }, [id]); // eslint-disable-line

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName) { toast.error("Nombre requerido"); return; }
    if (form.password && form.password.length < 6) {
      toast.error("Si cambias la contraseña, mínimo 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        fullName: form.fullName,
        email: form.email || null,
        phone: form.phone || null,
        role: form.role,
        initials: form.initials || null,
        color: form.color,
        notes: form.notes || null,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Error");
      toast.success("Agente actualizado");
      router.push("/agentes");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Cargando...</div>;

  return (
    <div>
      <PageHeader title={`Editar Agente: ${code}`} />
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acceso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Código (usuario login)">
              <input className={inputClass + " bg-gray-100 cursor-not-allowed"} value={code} disabled />
            </FormField>
            <FormField label="Nueva contraseña (opcional)">
              <input
                type="text"
                className={inputClass}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="Dejar vacío para no cambiar"
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Rol" required>
              <select className={inputClass} value={form.role} onChange={(e) => update("role", e.target.value)}>
                <option value="agent">Agente</option>
                <option value="admin">Admin</option>
                <option value="broker">Broker</option>
              </select>
            </FormField>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos Personales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Nombre completo" required>
              <input className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
            </FormField>
            <FormField label="Iniciales (avatar)">
              <input className={inputClass} value={form.initials} onChange={(e) => update("initials", e.target.value.toUpperCase().slice(0, 3))} maxLength={3} />
            </FormField>
            <FormField label="Email">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} />
            </FormField>
            <FormField label="Teléfono">
              <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
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
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
          <button type="button" onClick={() => router.push("/agentes")} className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
