"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
} from "react-icons/hi";

const navItems = [
  { href: "/", label: "Dashboard", icon: HiHome, description: "Resumen general" },
  { href: "/clientes", label: "Clientes", icon: HiUsers, description: "Gestionar clientes" },
  { href: "/propiedades", label: "Propiedades", icon: HiOfficeBuilding, description: "Inventario de propiedades" },
  { href: "/negocios", label: "Negocios", icon: HiBriefcase, description: "Ventas y alquileres" },
  { href: "/tareas", label: "Tareas", icon: HiClipboardCheck, description: "Seguimientos y recordatorios" },
  { href: "/contabilidad", label: "Contabilidad", icon: HiCurrencyDollar, description: "Comisiones por agente" },
  { href: "/grupos", label: "Grupos WA", icon: HiChat, description: "Feed de grupos WhatsApp" },
  { href: "/matches", label: "Matches", icon: HiSparkles, description: "Coincidencias automáticas" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo / Brand */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-white font-bold text-lg">EP</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">E. Pringle</h1>
            <p className="text-[11px] text-slate-400 font-medium">Real Estate CRM</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-3">
          Menu Principal
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
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
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-white/20"
                  : "bg-slate-800 group-hover:bg-slate-700"
              }`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm">{item.label}</span>
                <p className={`text-[10px] leading-tight mt-0.5 ${isActive ? "text-blue-200" : "text-slate-500"}`}>
                  {item.description}
                </p>
              </div>
              {isActive && (
                <HiChevronRight className="w-4 h-4 text-blue-200" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />

      {/* Footer */}
      <div className="p-4">
        <div className="rounded-xl bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4 border border-slate-700/50">
          <p className="text-xs font-semibold text-slate-300">E. Pringle Real Estate</p>
          <p className="text-[10px] text-slate-500 mt-1">CRM v1.0</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-[60] lg:hidden bg-slate-800 text-white p-2.5 rounded-xl shadow-lg"
      >
        {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenuAlt2 className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 sidebar-overlay z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
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
