"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import PageHeader from "@/components/PageHeader";
import { HiPlus, HiPencil, HiUserCircle, HiBan, HiCheck } from "react-icons/hi";

interface Agent {
  id: string;
  code: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  initials: string | null;
  color: string | null;
  active: number;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  broker: { label: "Broker", color: "bg-amber-100 text-amber-800" },
  admin: { label: "Admin", color: "bg-blue-100 text-blue-800" },
  agent: { label: "Agente", color: "bg-gray-100 text-gray-700" },
};

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await fetch("/api/agents").then((r) => r.json()).catch(() => []);
    setAgents(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(a: Agent) {
    const action = a.active ? "desactivar" : "reactivar";
    if (!confirm(`¿${action} a ${a.fullName}?`)) return;
    const res = await fetch(`/api/agents/${a.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: a.active ? 0 : 1 }),
    });
    if (res.ok) {
      toast.success(a.active ? "Agente desactivado" : "Agente reactivado");
      load();
    } else {
      toast.error("Error");
    }
  }

  return (
    <div>
      <PageHeader title="Agentes" subtitle="Gestión de usuarios del CRM">
        <Link href="/agentes/nuevo" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <HiPlus className="w-4 h-4" /> Nuevo Agente
        </Link>
      </PageHeader>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Agente</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Email / Tel</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 uppercase text-[11px] tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agents.map((a) => {
                const role = ROLE_LABELS[a.role] || ROLE_LABELS.agent;
                return (
                  <tr key={a.id} className={a.active ? "" : "opacity-50"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${a.color || "from-gray-400 to-gray-600"} flex items-center justify-center text-white text-xs font-bold`}>
                          {a.initials || a.fullName.charAt(0)}
                        </div>
                        <div className="font-semibold text-gray-900">{a.fullName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.code}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {a.email && <div>{a.email}</div>}
                      {a.phone && <div className="text-gray-400">{a.phone}</div>}
                      {!a.email && !a.phone && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${role.color}`}>{role.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {a.active ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Activo</span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Link href={`/agentes/${a.id}/editar`} className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title="Editar">
                          <HiPencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleActive(a)}
                          className={`p-1.5 rounded-lg ${a.active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                          title={a.active ? "Desactivar" : "Reactivar"}
                        >
                          {a.active ? <HiBan className="w-4 h-4" /> : <HiCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <HiUserCircle className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                    <p>Sin agentes</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
        <p className="font-semibold mb-1">Roles:</p>
        <ul className="space-y-0.5 list-disc ml-4">
          <li><b>Broker</b>: acceso total + puede crear/editar agentes (solo Edgar).</li>
          <li><b>Admin</b>: acceso total al CRM (incluye Contabilidad de empresa).</li>
          <li><b>Agente</b>: ve todo el CRM excepto Contabilidad — solo ve sus propios números.</li>
        </ul>
      </div>
    </div>
  );
}
