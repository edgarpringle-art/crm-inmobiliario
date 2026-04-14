"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiHome, HiUsers, HiOfficeBuilding, HiBriefcase } from "react-icons/hi";

const navItems = [
  { href: "/", label: "Dashboard", icon: HiHome },
  { href: "/clientes", label: "Clientes", icon: HiUsers },
  { href: "/propiedades", label: "Propiedades", icon: HiOfficeBuilding },
  { href: "/negocios", label: "Negocios", icon: HiBriefcase },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar-bg text-sidebar-text flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">CRM Inmobiliario</h1>
        <p className="text-xs text-sidebar-text mt-1">Gestión de Bienes Raíces</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-sidebar-active text-white"
                  : "hover:bg-white/10 text-sidebar-text"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 text-xs text-sidebar-text/60">
        E. Pringle Real Estate
      </div>
    </aside>
  );
}
