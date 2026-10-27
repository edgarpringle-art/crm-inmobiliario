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
  HiLogout,
  HiUserGroup,
  HiCollection,
  HiChartBar,
  HiSpeakerphone,
  HiBell,
  HiCalendar,
  HiDocumentReport,
} from "react-icons/hi";

type Role = "broker" | "admin" | "agent";

interface Pulse {
  leads: number; overdue: { id: string; title: string; createdAt: string; clientId: string | null }[];
  newestLead: string | null; alertsNew: number; visitsToday: number; visitsTomorrowPending: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof HiHome;
  description: string;
  visibleFor: Role[];
  badge?: "leads" | "alerts" | "visits";
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: HiHome, description: "Resumen general", visibleFor: ["broker", "admin", "agent"] },
  { href: "/clientes", label: "Clientes", icon: HiUsers, description: "Embudo de clientes", visibleFor: ["broker", "admin", "agent"] },
  { href: "/propiedades", label: "Propiedades", icon: HiOfficeBuilding, description: "Inventario de propiedades", visibleFor: ["broker", "admin", "agent"] },
  { href: "/negocios", label: "Negocios", icon: HiBriefcase, description: "Ventas y alquileres", visibleFor: ["broker", "admin", "agent"] },
  { href: "/tareas", label: "Tareas", icon: HiClipboardCheck, description: "Seguimientos y recordatorios", visibleFor: ["broker", "admin", "agent"], badge: "leads" },
  { href: "/visitas", label: "Visitas", icon: HiCalendar, description: "Agenda de visitas a propiedades", visibleFor: ["broker", "admin", "agent"], badge: "visits" },
  { href: "/alertas-web", label: "Alertas Web", icon: HiBell, description: "Avisos de búsqueda desde la web", visibleFor: ["broker", "admin", "agent"], badge: "alerts" },
  { href: "/informes-propietarios", label: "Informes Propietarios", icon: HiDocumentReport, description: "Visitas y consultas por propiedad", visibleFor: ["broker", "admin", "agent"] },
  { href: "/contabilidad", label: "Contabilidad", icon: HiCurrencyDollar, description: "Empresa: comisiones y gastos", visibleFor: ["broker", "admin"] },
  { href: "/mis-comisiones", label: "Mis Comisiones", icon: HiCurrencyDollar, description: "Tus números personales", visibleFor: ["agent"] },
  { href: "/agentes", label: "Agentes", icon: HiUserGroup, description: "Gestión de usuarios", visibleFor: ["broker"] },
  { href: "/grupos", label: "Grupos WA", icon: HiChat, description: "Feed de grupos WhatsApp", visibleFor: ["broker", "admin", "agent"] },
  { href: "/publicar", label: "Publicar", icon: HiSpeakerphone, description: "Enviar a grupos de WhatsApp", visibleFor: ["broker", "admin", "agent"] },
  { href: "/matches", label: "Matches", icon: HiSparkles, description: "Coincidencias automáticas", visibleFor: ["broker", "admin", "agent"] },
  { href: "/inventario-mls", label: "Inventario MLS", icon: HiCollection, description: "Red MLS ACOBIR en tu web", visibleFor: ["broker", "admin", "agent"] },
  { href: "/estadisticas-web", label: "Estadísticas Web", icon: HiChartBar, description: "Visitas e interés en la web", visibleFor: ["broker", "admin", "agent"] },
];

interface CrmUser {
  username: string;
  role: Role;
  displayName: string;
}

function parseCrmUser(cookie: string): CrmUser | null {
  try {
    const parts = cookie.split(":");
    if (parts.length < 3) return null;
    const [username, role, ...nameParts] = parts;
    return { username, role: role as Role, displayName: nameParts.join(":") };
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

  // Web leads / alerts / visits counters, refreshed every 3 minutes. A desktop notification fires
  // when a new web lead arrives (if the browser allowed notifications).
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [notifPerm, setNotifPerm] = useState<string>("granted");
  useEffect(() => {
    let last: string | null = null;
    const load = () => fetch("/api/crm-pulse").then((r) => (r.ok ? r.json() : null)).then((d: Pulse | null) => {
      if (typeof Notification !== "undefined") setNotifPerm(Notification.permission);
      if (!d) return;
      if (last !== null && d.newestLead && d.newestLead > last && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Nuevo lead de la web", { body: "Un cliente pidió información en panamainmo.com. Revisa Tareas." });
      }
      last = d.newestLead || last || "";
      setPulse(d);
    }).catch(() => {});
    load();
    const id = setInterval(load, 3 * 60_000);
    return () => clearInterval(id);
  }, []);
  const badgeOf = (b?: NavItem["badge"]) =>
    !pulse || !b ? 0 : b === "leads" ? pulse.leads : b === "alerts" ? pulse.alertsNew : pulse.visitsToday;

  const role: Role = crmUser?.role ?? "agent";
  const navItems = ALL_NAV_ITEMS.filter((item) => item.visibleFor.includes(role));

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
              {badgeOf(item.badge) > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
                  item.badge === "leads" && pulse?.overdue.length ? "bg-red-500 text-white animate-pulse-dot" : "bg-amber-400 text-slate-900"
                }`}>{badgeOf(item.badge)}</span>
              )}
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
              role === "broker"
                ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                : role === "admin"
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                : "bg-slate-700 text-slate-300"
            }`}>
              {crmUser.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{crmUser.displayName}</p>
              <p className="text-[10px] text-slate-500">
                {role === "broker" ? "Broker" : role === "admin" ? "Admin" : "Agente"}
              </p>
            </div>
          </div>
        )}
        {notifPerm === "default" && (
          <button onClick={() => Notification.requestPermission().then(setNotifPerm)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-amber-300 hover:bg-white/5 transition-all text-xs font-medium">
            <HiBell className="w-4 h-4" /> Activar avisos de leads
          </button>
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

      {/* Web leads waiting more than 2 hours */}
      {pulse && pulse.overdue.length > 0 && !pathname.startsWith("/tareas") && (
        <Link href="/tareas" className="fixed bottom-4 right-4 z-[55] max-w-xs bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-start gap-3 animate-slide-in">
          <HiBell className="w-5 h-5 mt-0.5 flex-shrink-0 animate-pulse-dot" />
          <span className="text-sm">
            <b>{pulse.overdue.length} lead{pulse.overdue.length !== 1 ? "s" : ""} web sin atender</b> hace más de 2 horas.
            <span className="block text-red-100 text-xs mt-0.5">Quien responde primero se queda con el cliente →</span>
          </span>
        </Link>
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
