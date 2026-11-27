import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PhotoGallery from "../../p/[id]/PhotoGallery";
import { formatCurrency } from "@/lib/constants";
import { getPublicProperty } from "@/components/portal/data";
import { optimizePhoto, youtubeEmbedUrl } from "@/lib/publicProperty";
import { fmtRange, parseUnitModels } from "@/lib/unitModels";

// Ficha para colegas: muestra la propiedad SIN datos de contacto, marca ni propietario,
// para que otro agente la reenvíe a su propio cliente. No se indexa en buscadores.

const AMENITIES: Record<string, string> = {
  hasPool: "Piscina", hasGym: "Gimnasio", hasElevator: "Ascensor", hasSecurity: "Seguridad 24/7",
  hasGenerator: "Planta Eléctrica", hasFurniture: "Amueblado", hasAppliances: "Línea Blanca",
  hasAC: "Aires Acondicionados", hasBalcony: "Balcón", hasGarden: "Jardín",
};

interface Property {
  id: string; title: string; propertyType: string; operationType: string;
  address: string | null; sector: string | null; city: string | null; state: string | null;
  referencePoint: string | null;
  salePrice: number | null; rentPrice: number | null; currency: string; maintenanceFee: number | null;
  area: number | null; landArea: number | null; bedrooms: number | null; bathrooms: number | null;
  parkingSpots: number | null; floors: number | null; yearBuilt: number | null;
  description: string | null;
  isNewProject?: number | null; developerName?: string | null; deliveryDate?: string | null;
  salePriceMax?: number | null; areaMax?: number | null; unitModels?: string | null;
  photos: string | null; features: string | null; videoUrl: string | null;
  corregimiento?: string | null; mlsId?: string | null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = (await getPublicProperty(id)) as unknown as Property | null;
  return { title: p ? p.title : "Ficha", robots: { index: false, follow: false } };
}

const IconCheck = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IconPin = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-7-7.8-7-11a7 7 0 1114 0c0 3.2-3 7-7 11z" /><circle cx="12" cy="10" r="2" /></svg>;

export default async function FichaColegaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = (await getPublicProperty(id)) as unknown as Property | null;
  if (!p) notFound();

  const activeAmenities = Object.entries(AMENITIES).filter(([k]) => (p as unknown as Record<string, unknown>)[k]);
  const loc = [p.sector, p.mlsId ? null : p.corregimiento, p.city, p.state]
    .filter((x, i, a): x is string => !!x && a.findIndex((y) => y?.toLowerCase() === x.toLowerCase()) === i).join(", ");
  let photos: string[] = [];
  if (p.photos) { try { photos = (JSON.parse(p.photos) as string[]).map((u) => optimizePhoto(u)); } catch { /* ignore */ } }
  let features: string[] = [];
  if (p.features) { try { features = JSON.parse(p.features); } catch { /* ignore */ } }
  const videoEmbed = youtubeEmbedUrl(p.videoUrl);
  const mapQuery = [p.sector, p.city, p.state, "Panamá"].filter(Boolean).join(", ");
  const isVenta = p.operationType === "VENTA" || p.operationType === "VENTA_Y_ALQUILER";
  const isAlquiler = p.operationType === "ALQUILER" || p.operationType === "VENTA_Y_ALQUILER";
  const models = p.isNewProject ? parseUnitModels(p.unitModels) : [];

  return (
    <div className="min-h-screen bg-[#FBF8F3]" style={{ fontFamily: "'Josefin Sans', sans-serif", color: "#1E1A15" }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-10 space-y-8">

        {photos.length > 0 && (
          <div className="bg-white rounded-2xl overflow-hidden border border-[#E9E0D0]">
            <PhotoGallery photos={photos} title={p.title} countLabel={`${photos.length} fotos`} />
          </div>
        )}

        {/* Título + badges */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {p.isNewProject ? <span className="bg-[#B8945F] text-[#1E1A15] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-[0.2em]">Proyecto Nuevo</span> : null}
            {isVenta && <span className="bg-[#1E1A15] text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-[0.2em]">En Venta</span>}
            {isAlquiler && <span className="bg-[#8A6A3A] text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-[0.2em]">En Alquiler</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-medium leading-tight mb-3" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.01em" }}>{p.title}</h1>
          {loc && (
            <p className="flex items-start gap-2 text-[#5C5347] text-sm">
              <span className="mt-0.5 text-[#9C9182]"><IconPin /></span><span>{loc}</span>
            </p>
          )}
          {p.referencePoint && <p className="text-[#9C9182] text-xs mt-1 ml-6">{p.referencePoint}</p>}
        </div>

        {/* Precio */}
        <div className="bg-white border border-[#E9E0D0] rounded-2xl p-6 flex flex-wrap gap-8">
          {p.salePrice != null && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C9182] mb-0.5">Venta{p.salePriceMax && p.salePriceMax > p.salePrice ? " · Desde" : ""}</p>
              <p className="text-3xl font-semibold text-[#1E1A15]" style={{ fontFamily: "'Cinzel', serif" }}>{formatCurrency(p.salePrice, p.currency)}</p>
              {p.salePriceMax && p.salePriceMax > p.salePrice ? <p className="text-sm text-[#6B6155] mt-1">Hasta <span className="font-semibold text-[#1E1A15]">{formatCurrency(p.salePriceMax, p.currency)}</span></p> : null}
            </div>
          )}
          {p.rentPrice != null && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C9182] mb-0.5">Alquiler</p>
              <p className="text-3xl font-semibold text-[#8A6A3A]" style={{ fontFamily: "'Cinzel', serif" }}>{formatCurrency(p.rentPrice, p.currency)}<span className="text-base text-[#6B6155] font-normal">/mes</span></p>
            </div>
          )}
          {p.maintenanceFee != null && (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C9182] mb-0.5">Mantenimiento</p>
              <p className="text-base font-semibold text-[#4A4238] mt-1.5">{formatCurrency(p.maintenanceFee, p.currency)}<span className="text-xs text-[#6B6155] font-normal">/mes</span></p>
            </div>
          )}
        </div>

        {/* Especificaciones */}
        {(p.area || p.landArea || p.bedrooms || p.bathrooms || p.parkingSpots || p.floors || p.yearBuilt) && (
          <div className="bg-[#F3ECDF] rounded-2xl border border-[#E9E0D0] p-6">
            <p className="text-xs font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-5">Detalles</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {p.area != null && <Spec value={`${fmtRange(p.area, p.areaMax)}`} unit="m²" />}
              {p.landArea != null && <Spec value={p.landArea} unit="m² terreno" />}
              {p.bedrooms != null && <Spec value={p.bedrooms} unit="Habitaciones" />}
              {p.bathrooms != null && <Spec value={p.bathrooms} unit="Baños" />}
              {p.parkingSpots != null && <Spec value={p.parkingSpots} unit="Parqueos" />}
              {p.floors != null && <Spec value={p.floors} unit="Niveles" />}
              {p.yearBuilt != null && <Spec value={p.yearBuilt} unit="Año" />}
            </div>
          </div>
        )}

        {/* Modelos (proyectos nuevos) */}
        {models.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">Modelos</p>
            <div className="overflow-x-auto rounded-2xl border border-[#E9E0D0]">
              <table className="w-full text-sm text-[#4A4238]">
                <thead className="bg-[#F3ECDF] text-xs uppercase tracking-[0.15em] text-[#8A6A3A]">
                  <tr><th className="text-left font-semibold px-4 py-3">Modelo</th><th className="text-left font-semibold px-4 py-3">Rec.</th><th className="text-left font-semibold px-4 py-3">Baños</th><th className="text-left font-semibold px-4 py-3">m²</th><th className="text-left font-semibold px-4 py-3">Precio</th></tr>
                </thead>
                <tbody>
                  {models.map((m, i) => (
                    <tr key={i} className="border-t border-[#EFE6D6]">
                      <td className="px-4 py-3 font-medium text-[#1E1A15]">{m.name || "—"}</td>
                      <td className="px-4 py-3">{m.bedrooms || "—"}</td>
                      <td className="px-4 py-3">{m.bathrooms || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{fmtRange(m.areaMin, m.areaMax) || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-[#1E1A15]">{fmtRange(m.priceMin, m.priceMax, (n) => formatCurrency(n, p.currency)) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Descripción */}
        {p.description && (
          <div>
            <p className="text-xs font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">Descripción</p>
            <p className="text-sm text-[#4A4238] whitespace-pre-wrap leading-relaxed">{p.description}</p>
          </div>
        )}

        {/* Amenidades */}
        {activeAmenities.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">Amenidades</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeAmenities.map(([, label]) => (
                <div key={label} className="flex items-center gap-2 text-sm text-[#4A4238] py-2 border-b border-[#EFE6D6]"><span className="text-[#8A6A3A]"><IconCheck /></span>{label}</div>
              ))}
            </div>
          </div>
        )}

        {/* Características extra */}
        {features.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">Más características</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#4A4238] py-2 border-b border-[#EFE6D6]"><span className="text-[#8A6A3A]"><IconCheck /></span>{f}</div>
              ))}
            </div>
          </div>
        )}

        {/* Video */}
        {videoEmbed && (
          <div>
            <p className="text-xs font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">Video</p>
            <div className="aspect-video rounded-2xl overflow-hidden border border-[#E9E0D0] bg-[#EDE3D2]">
              <iframe src={videoEmbed} title={`Video ${p.title}`} className="w-full h-full" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        )}

        {/* Mapa */}
        {(p.sector || p.city) && (
          <div>
            <p className="text-xs font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-4">Ubicación</p>
            <div className="h-72 rounded-2xl overflow-hidden border border-[#E9E0D0] bg-[#EDE3D2]">
              <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`} title="Mapa" className="w-full h-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
            <p className="text-xs text-[#9C9182] mt-2">Ubicación aproximada.</p>
          </div>
        )}

        <div className="border-t border-[#E4D9C6] pt-6 text-center">
          <p className="text-sm text-[#6B6155]">Para más información, contacte al agente que le compartió esta propiedad.</p>
        </div>
      </main>
    </div>
  );
}

function Spec({ value, unit }: { value: number | string; unit: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-[#1E1A15]" style={{ fontFamily: "'Cinzel', serif" }}>{value}</p>
      <p className="text-xs text-[#6B6155] uppercase tracking-[0.15em] mt-0.5">{unit}</p>
    </div>
  );
}
