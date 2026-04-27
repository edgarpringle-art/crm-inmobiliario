"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  HiHome,
  HiUsers,
  HiOfficeBuilding,
  HiBriefcase,
  HiMenuAlt2,
  HiX,
  HiChevronRight,
  HiCurrencyDollar,
  HiClipboardCheck,
  HiChat,
  HiSparkles,
  HiSearch,
  HiLogout,
} from "react-icons/hi";

const ALL_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: HiHome, description: "Resumen general", adminOnly: false },
  { href: "/clientes", label: "Clientes", icon: HiUsers, description: "Gestionar clientes", adminOnly: false },
  { href: "/busquedas", label: "Búsquedas", icon: HiSearch, description: "Clientes buscando propiedades", adminOnly: false },
  { href: "/propiedades", label: "Propiedades", icon: HiOfficeBuilding, description: "Inventario de propiedades", adminOnly: false },
  { href: "/negocios", label: "Negocios", icon: HiBriefcase, description: "Ventas y alquileres", adminOnly: false },
  { href: "/tareas", label: "Tareas", icon: HiClipboardCheck, description: "Seguimientos y recordatorios", adminOnly: false },
  { href: "/contabilidad", label: "Contabilidad", icon: HiCurrencyDollar, description: "Comisiones por agente", adminOnly: true },
  { href: "/grupos", label: "Grupos WA", icon: HiChat, description: "Feed de grupos WhatsApp", adminOnly: false },
  { href: "/matches", label: "Matches", icon: HiSparkles, description: "Coincidencias automáticas", adminOnly: false },
];

interface CrmUser {
  username: string;
  role: "admin" | "agent";
  displayName: string;
}

function parseCrmUser(cookie: string): CrmUser | null {
  try {
    const parts = cookie.split(":");
    if (parts.length < 3) return null;
    const [username, role, ...nameParts] = parts;
    return { username, role: role as "admin" | "agent", displayName: nameParts.join(":") };
  } catch {
    return null;
  }
}

function getCrmUserFromCookies(): CrmUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith("crm_user="));
  if (!match) return null;
  return parseCrmUser(decodeURIComponent(match.split("=")[1]));
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [crmUser, setCrmUser] = useState<CrmUser | null>(null);

  useEffect(() => {
    setCrmUser(getCrmUserFromCookies());
  }, []);

  const role = crmUser?.role ?? "agent";
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <>
      {/* Logo / Brand */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <span className="text-white font-bold text-lg">EP</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight truncate">E. Pringle</h1>
            <p className="text-[11px] text-slate-400 font-medium">Real Estate CRM</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-3">
          Menu Principal
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${
                isActive ? "bg-white/20" : "bg-slate-800 group-hover:bg-slate-700"
              }`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm">{item.label}</span>
                <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-blue-200" : "text-slate-500"}`}>
                  {item.description}
                </p>
              </div>
              {isActive && <HiChevronRight className="w-4 h-4 text-blue-200 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

      {/* User + Logout */}
      <div className="p-4 space-y-2">
        {crmUser && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              role === "admin"
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                : "bg-slate-700 text-slate-300"
            }`}>
              {crmUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{crmUser.displayName}</p>
              <p className="text-[10px] text-slate-500">{role === "admin" ? "Administrador" : "Agente"}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-red-900/30 transition-all text-sm font-medium"
        >
          <HiLogout className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden bg-slate-800 text-white p-2.5 rounded-xl shadow-lg"
      >
        {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenuAlt2 className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 sidebar-overlay z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-sidebar-bg flex-col z-50 border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed left-0 top-0 h-screen w-72 bg-sidebar-bg flex flex-col z-50 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {sidebarContent}
      </aside>
    </>
  );
}
