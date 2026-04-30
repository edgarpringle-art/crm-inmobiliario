import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { formatCurrency } from "@/lib/constants";
import type { Metadata } from "next";

interface Property {
  id: string; title: string; propertyType: string; operationType: string; status: string;
  address: string | null; sector: string | null; city: string | null; state: string | null;
  country: string; referencePoint: string | null;
  salePrice: number | null; rentPrice: number | null; currency: string; maintenanceFee: number | null;
  area: number | null; landArea: number | null; bedrooms: number | null; bathrooms: number | null;
  parkingSpots: number | null; floors: number | null; yearBuilt: number | null;
  hasPool: number; hasGym: number; hasElevator: number; hasSecurity: number;
  hasGenerator: number; hasFurniture: number; hasAppliances: number;
  hasAC: number; hasBalcony: number; hasGarden: number;
  description: string | null; notes: string | null;
  ownerName: string | null;
  photos: string | null;
}

const amenityLabels: Record<string, string> = {
  hasPool: "Piscina", hasGym: "Gimnasio", hasElevator: "Ascensor", hasSecurity: "Seguridad 24/7",
  hasGenerator: "Planta Eléctrica", hasFurniture: "Amueblado", hasAppliances: "Línea Blanca",
  hasAC: "Aires Acondicionados", hasBalcony: "Balcón", hasGarden: "Jardín",
};

const typeEmoji: Record<string, string> = {
  APARTAMENTO: "🏢", PENTHOUSE: "🏙️", CASA: "🏠", VILLA: "🏡",
  LOCAL: "🏬", OFICINA: "🏢", TERRENO: "🌳", NAVE: "🏭", OTRO: "🏘️",
};

const typeLabel: Record<string, string> = {
  APARTAMENTO: "Apartamento", PENTHOUSE: "Penthouse", CASA: "Casa", VILLA: "Villa",
  LOCAL: "Local Comercial", OFICINA: "Oficina", TERRENO: "Terreno", NAVE: "Nave Industrial", OTRO: "Propiedad",
};

const opLabel: Record<string, string> = {
  VENTA: "En Venta", ALQUILER: "En Alquiler", VENTA_Y_ALQUILER: "Venta / Alquiler",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const rows = await query<Property>("SELECT * FROM Property WHERE id = ?", [id]).catch(() => []);
  if (!rows.length) return { title: "Propiedad no encontrada" };
  const p = rows[0];
  const loc = [p.sector, p.city].filter(Boolean).join(", ");
  const price = p.salePrice ? formatCurrency(p.salePrice, p.currency) : p.rentPrice ? `${formatCurrency(p.rentPrice, p.currency)}/mes` : "";
  let firstPhoto: string | undefined;
  if (p.photos) { try { const arr = JSON.parse(p.photos); firstPhoto = arr[0]; } catch { /* ignore */ } }
  return {
    title: `${p.title} — E. Pringle Real Estate`,
    description: `${typeLabel[p.propertyType] || "Propiedad"} en ${opLabel[p.operationType] || ""} · ${loc} · ${price}`,
    openGraph: {
      title: p.title,
      description: `${loc} · ${price}`,
      siteName: "E. Pringle Real Estate",
      images: firstPhoto ? [{ url: firstPhoto }] : undefined,
    },
  };
}

export default async function PublicPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await query<Property>("SELECT * FROM Property WHERE id = ?", [id]).catch(() => []);
  if (!rows.length) notFound();
  const p = rows[0];

  const activeAmenities = Object.entries(amenityLabels).filter(([k]) => (p as unknown as Record<string, unknown>)[k]);
  const loc = [p.sector, p.city, p.state].filter(Boolean).join(", ");
  let photos: string[] = [];
  if (p.photos) { try { photos = JSON.parse(p.photos); } catch { /* ignore */ } }
  const fullAddress = [p.address, loc].filter(Boolean).join(" · ");

  const waText = encodeURIComponent(
    `Hola, me interesa la propiedad: ${p.title}${loc ? ` en ${loc}` : ""}\nhttps://crm-inmobiliario-eta.vercel.app/p/${p.id}`
  );
  const edgarPhone = "50763183113";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">EP</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">E. Pringle Real Estate</p>
            <p className="text-[10px] text-gray-400">Agente Inmobiliario · Panamá</p>
          </div>
        </div>
        <a
          href={`https://wa.me/${edgarPhone}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Contactar
        </a>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Photo gallery */}
          {photos.length > 0 ? (
            <div className={`relative ${photos.length === 1 ? "" : "grid grid-cols-2 grid-rows-2"} max-h-72 sm:max-h-96 overflow-hidden`}>
              {photos.length === 1 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[0]} alt={p.title} className="w-full h-72 sm:h-96 object-cover" />
              ) : (
                <>
                  {/* Main photo - spans full left column */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photos[0]} alt={`${p.title} 1`} className="row-span-2 w-full h-full object-cover" />
                  {/* Second photo */}
                  {photos[1] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[1]} alt={`${p.title} 2`} className="w-full h-full object-cover" />
                  )}
                  {/* Third photo with overlay if more */}
                  {photos[2] && (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photos[2]} alt={`${p.title} 3`} className="w-full h-full object-cover" />
                      {photos.length > 3 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-xl">+{photos.length - 3}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}

          {/* Type banner */}
          <div className={`px-5 py-3 flex items-center gap-3 ${
            p.operationType === "VENTA" ? "bg-blue-600" :
            p.operationType === "ALQUILER" ? "bg-teal-600" : "bg-indigo-600"
          }`}>
            <span className="text-2xl">{typeEmoji[p.propertyType] || "🏠"}</span>
            <div>
              <p className="text-white font-bold text-lg leading-tight">{opLabel[p.operationType]}</p>
              <p className="text-white/80 text-sm">{typeLabel[p.propertyType] || "Propiedad"}</p>
            </div>
          </div>

          <div className="p-5">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{p.title}</h1>
            {fullAddress && (
              <p className="text-gray-500 text-sm flex items-center gap-1">
                <span>📍</span> {fullAddress}
              </p>
            )}
            {p.referencePoint && <p className="text-gray-400 text-xs mt-0.5 ml-5">{p.referencePoint}</p>}

            {/* Prices */}
            <div className="mt-4 flex flex-wrap gap-3">
              {p.salePrice != null && (
                <div className="bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-100">
                  <p className="text-[10px] text-blue-500 font-semibold uppercase">Precio Venta</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(p.salePrice, p.currency)}</p>
                </div>
              )}
              {p.rentPrice != null && (
                <div className="bg-teal-50 rounded-xl px-4 py-2.5 border border-teal-100">
                  <p className="text-[10px] text-teal-500 font-semibold uppercase">Alquiler / mes</p>
                  <p className="text-xl font-bold text-teal-700">{formatCurrency(p.rentPrice, p.currency)}</p>
                </div>
              )}
              {p.maintenanceFee != null && (
                <div className="bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Mantenimiento</p>
                  <p className="text-base font-bold text-gray-600">{formatCurrency(p.maintenanceFee, p.currency)}/mes</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Specs */}
        {(p.area || p.bedrooms || p.bathrooms || p.parkingSpots || p.floors || p.yearBuilt) && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Características</h2>
            <div className="grid grid-cols-3 gap-4">
              {p.area != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{p.area}</p>
                  <p className="text-xs text-gray-400 mt-0.5">m² área</p>
                </div>
              )}
              {p.landArea != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{p.landArea}</p>
                  <p className="text-xs text-gray-400 mt-0.5">m² terreno</p>
                </div>
              )}
              {p.bedrooms != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{p.bedrooms}</p>
                  <p className="text-xs text-gray-400 mt-0.5">habitaciones</p>
                </div>
              )}
              {p.bathrooms != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{p.bathrooms}</p>
                  <p className="text-xs text-gray-400 mt-0.5">baños</p>
                </div>
              )}
              {p.parkingSpots != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{p.parkingSpots}</p>
                  <p className="text-xs text-gray-400 mt-0.5">parqueos</p>
                </div>
              )}
              {p.floors != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{p.floors}</p>
                  <p className="text-xs text-gray-400 mt-0.5">niveles</p>
                </div>
              )}
              {p.yearBuilt != null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{p.yearBuilt}</p>
                  <p className="text-xs text-gray-400 mt-0.5">año const.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amenities */}
        {activeAmenities.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Amenidades</h2>
            <div className="grid grid-cols-2 gap-2">
              {activeAmenities.map(([, label]) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 font-bold">✓</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {p.description && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Descripción</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{p.description}</p>
          </div>
        )}

        {/* Notes (WA extras) */}
        {p.notes && (
          <div className="bg-amber-50 rounded-2xl shadow-sm p-5 border border-amber-100">
            <p className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">{p.notes}</p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl p-6 text-center shadow-lg">
          <p className="text-white font-bold text-lg mb-1">¿Te interesa esta propiedad?</p>
          <p className="text-white/80 text-sm mb-4">Contáctanos y te asesoramos sin compromiso.</p>
          <a
            href={`https://wa.me/${edgarPhone}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-400 hover:bg-green-300 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Escribir por WhatsApp
          </a>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">E. Pringle Real Estate · Agente Licenciado · Panamá</p>
      </div>
    </div>
  );
}
