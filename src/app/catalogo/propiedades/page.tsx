import type { Metadata } from "next";
import { isPortalRequest } from "@/components/portal/portalHost";
import PortalHeader from "@/components/portal/PortalHeader";
import PortalFooter from "@/components/portal/PortalFooter";
import { getAvailableProperties } from "@/components/portal/data";
import Link from "next/link";
import { SANS, SERIF, portalHref } from "@/components/portal/brand";
import Listing from "./Listing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Propiedades en venta y alquiler · PanamaInmo",
  description: "Apartamentos, casas, penthouses, locales y terrenos en venta y alquiler en Panamá.",
};

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

export default async function PropiedadesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const portal = await isPortalRequest();
  const properties = await getAvailableProperties();

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} />
      <section className="relative bg-[#1E1A15] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(184,148,95,0.35),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-[#D9BE8F] text-[11px] font-semibold uppercase tracking-[0.35em] mb-3">Catálogo</p>
          <h1 className="text-3xl sm:text-5xl text-white font-medium" style={SERIF}>Propiedades disponibles</h1>
          <p className="text-[#CFC4B2] mt-3 max-w-xl">Filtra por operación, tipo, zona y habitaciones. Todas con información verificada.</p>
        </div>
      </section>
      <Listing
        properties={properties}
        basePath={portalHref("/propiedades", portal)}
        initial={{ op: one(sp.op), type: one(sp.type), zone: one(sp.zone), q: one(sp.q), beds: one(sp.beds) }}
      />
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-7xl mx-auto relative overflow-hidden rounded-3xl bg-[#1E1A15] px-6 sm:px-12 py-10 sm:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(184,148,95,0.35),transparent_60%)]" />
          <div className="relative">
            <p className="text-[#D9BE8F] text-[11px] font-semibold uppercase tracking-[0.35em] mb-2">Red MLS ACOBIR</p>
            <h2 className="text-2xl sm:text-3xl text-white" style={SERIF}>¿No encontraste lo que buscas?</h2>
            <p className="text-[#CFC4B2] mt-2 max-w-xl">Busca en todo el inventario de Panamá — más de 1,200 propiedades con mapa y filtros. Te atendemos directamente en cualquiera de ellas.</p>
          </div>
          <Link href={portalHref("/buscar", portal)}
            className="relative shrink-0 inline-flex items-center justify-center bg-[#B8945F] hover:bg-[#A4824F] text-white px-7 py-3.5 rounded-full text-xs font-semibold uppercase tracking-[0.15em] transition-colors">
            Abrir buscador MLS
          </Link>
        </div>
      </section>
      <PortalFooter portal={portal} />
    </div>
  );
}
