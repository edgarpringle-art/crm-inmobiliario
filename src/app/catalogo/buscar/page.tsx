import type { Metadata } from "next";
import PortalHeader from "@/components/portal/PortalHeader";
import { isPortalRequest } from "@/components/portal/portalHost";
import { MLS_PORTAL_URL, SANS, SERIF, waLink } from "@/components/portal/brand";
import { IconWA } from "@/components/portal/icons";

export const metadata: Metadata = {
  title: "Buscador MLS · Todo el inventario de Panamá · PanamaInmo",
  description: "Busca entre más de 1,200 propiedades en venta y alquiler de la red MLS ACOBIR, con atención directa de PanamaInmo.",
};

// Official Xposure / MLS ACOBIR agent portal (shows our contact data on every listing), embedded full-height.
export default async function BuscarMlsPage() {
  const portal = await isPortalRequest();
  return (
    <div className="h-dvh flex flex-col bg-[#FBF8F3] text-[#1E1A15]" style={SANS}>
      <PortalHeader portal={portal} />
      <div className="bg-[#1E1A15] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-sm sm:text-base" style={SERIF}>Buscador MLS · Todo el inventario</p>
            <p className="text-[11px] sm:text-xs text-[#CFC4B2]">Más de 1,200 propiedades de la red MLS ACOBIR. Te atendemos directamente en cualquiera de ellas.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a href={waLink("Hola PanamaInmo, vi una propiedad en el buscador MLS y quiero información.")} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em]">
              <IconWA className="w-3.5 h-3.5" /> Consultar
            </a>
            <a href={MLS_PORTAL_URL} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#D9BE8F] underline underline-offset-4 hidden sm:inline">
              Abrir en pantalla completa
            </a>
          </div>
        </div>
      </div>
      <div className="relative flex-1">
        {/* Visible until the portal paints over it (it can take a few seconds) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#6B6155]">
          <span className="w-8 h-8 rounded-full border-2 border-[#E4D9C6] border-t-[#B8945F] animate-spin" />
          <p className="text-sm">Cargando el buscador MLS...</p>
        </div>
        <iframe src={MLS_PORTAL_URL} title="Buscador de propiedades MLS ACOBIR" className="absolute inset-0 w-full h-full border-0"
          allow="geolocation; fullscreen" />
      </div>
    </div>
  );
}
