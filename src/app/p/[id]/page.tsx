import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { formatCurrency } from "@/lib/constants";
import type { Metadata } from "next";
import Link from "next/link";
import PhotoGallery from "./PhotoGallery";

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

const typeLabel: Record<string, string> = {
  APARTAMENTO: "Apartamento", PENTHOUSE: "Penthouse", CASA: "Casa", VILLA: "Villa",
  LOCAL: "Local Comercial", OFICINA: "Oficina", TERRENO: "Terreno", NAVE: "Nave Industrial", OTRO: "Propiedad",
};

const opLabel: Record<string, string> = {
  VENTA: "En Venta", ALQUILER: "En Alquiler", VENTA_Y_ALQUILER: "Venta / Alquiler",
};

const BROKER = {
  phone: "50763183113",
  phoneDisplay: "+507 6318-3113",
  email: "epringlerealtor@gmail.com",
  instagram: "epringle.realestate",
  instagramUrl: "https://www.instagram.com/epringle.realestate",
  license: "PN5016",
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
    title: `${p.title} — Edgar Pringle Real Estate`,
    description: `${typeLabel[p.propertyType] || "Propiedad"} ${opLabel[p.operationType] || ""} · ${loc} · ${price}`,
    openGraph: {
      title: p.title,
      description: `${loc} · ${price}`,
      siteName: "Edgar Pringle Real Estate",
      images: firstPhoto ? [{ url: firstPhoto }] : undefined,
    },
  };
}

// ── SVG Icons ────────────────────────────────────────────────────────
const IconWA = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);
const IconPhone = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconMail = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>;
const IconInstagram = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
const IconBadge = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IconPin = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-7-7.8-7-11a7 7 0 1114 0c0 3.2-3 7-7 11z"/><circle cx="12" cy="10" r="2"/></svg>;
const IconArrow = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const IconCheck = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;

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
  const isVenta = p.operationType === "VENTA" || p.operationType === "VENTA_Y_ALQUILER";
  const isAlquiler = p.operationType === "ALQUILER" || p.operationType === "VENTA_Y_ALQUILER";

  const waText = encodeURIComponent(
    `Hola, me interesa la propiedad: ${p.title}${loc ? ` en ${loc}` : ""}\nhttps://panamainmo.com/p/${p.id}`
  );

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Josefin Sans', sans-serif", color: "#1c1917" }}>

      {/* ─── Top utility bar ─── */}
      <div className="hidden md:block bg-stone-900 text-stone-300 text-xs">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href={`tel:+${BROKER.phone}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <IconPhone /> {BROKER.phoneDisplay}
            </a>
            <a href={`mailto:${BROKER.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <IconMail /> {BROKER.email}
            </a>
            <a href={BROKER.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <IconInstagram /> @{BROKER.instagram}
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-stone-400">
            <IconBadge /> Licencia <span className="text-white font-semibold tracking-wider">{BROKER.license}</span>
          </div>
        </div>
      </div>

      {/* ─── Main navbar ─── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/catalogo" className="flex items-center gap-3 cursor-pointer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="EP" className="w-10 h-10 sm:w-11 sm:h-11" />
            <div className="border-l border-stone-300 pl-3">
              <p className="text-sm sm:text-base font-medium text-stone-900 leading-tight tracking-[0.18em]" style={{ fontFamily: "'Cinzel', serif" }}>
                EDGAR PRINGLE
              </p>
              <p className="text-[10px] sm:text-[11px] text-stone-500 tracking-[0.2em] uppercase">Real Estate · Panamá</p>
            </div>
          </Link>

          <a href={`https://wa.me/${BROKER.phone}?text=${waText}`} target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer">
            <IconWA /> WhatsApp
          </a>
          <a href={`https://wa.me/${BROKER.phone}?text=${waText}`} target="_blank" rel="noopener noreferrer"
            className="sm:hidden flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded">
            <IconWA />
          </a>
        </div>
      </header>

      {/* ─── Breadcrumb ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/catalogo" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors uppercase tracking-[0.15em]">
          <IconArrow /> Volver al catálogo
        </Link>
      </div>

      {/* ─── Main content ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left column — gallery + details */}
        <div className="lg:col-span-2 space-y-8">

          {/* Gallery */}
          {photos.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden border border-stone-200">
              <PhotoGallery photos={photos} title={p.title} />
            </div>
          )}

          {/* Title + badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isVenta && <span className="bg-stone-900 text-white text-[10px] font-semibold px-3 py-1 rounded uppercase tracking-[0.2em]">En Venta</span>}
              {isAlquiler && <span className="bg-[#0F766E] text-white text-[10px] font-semibold px-3 py-1 rounded uppercase tracking-[0.2em]">En Alquiler</span>}
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-[0.2em] border border-stone-200 px-3 py-1 rounded">
                {typeLabel[p.propertyType] || "Propiedad"}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-medium text-stone-900 leading-tight mb-3" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.01em" }}>
              {p.title}
            </h1>

            {fullAddress && (
              <p className="flex items-start gap-2 text-stone-600 text-sm">
                <span className="mt-0.5 text-stone-400"><IconPin /></span>
                <span>{fullAddress}</span>
              </p>
            )}
            {p.referencePoint && <p className="text-stone-400 text-xs mt-1 ml-6">{p.referencePoint}</p>}
          </div>

          {/* Specs grid */}
          {(p.area || p.landArea || p.bedrooms || p.bathrooms || p.parkingSpots || p.floors || p.yearBuilt) && (
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] mb-5">Características</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {p.area != null && <SpecItem value={p.area} unit="m² área" />}
                {p.landArea != null && <SpecItem value={p.landArea} unit="m² terreno" />}
                {p.bedrooms != null && <SpecItem value={p.bedrooms} unit="habitaciones" />}
                {p.bathrooms != null && <SpecItem value={p.bathrooms} unit="baños" />}
                {p.parkingSpots != null && <SpecItem value={p.parkingSpots} unit="parqueos" />}
                {p.floors != null && <SpecItem value={p.floors} unit="niveles" />}
                {p.yearBuilt != null && <SpecItem value={p.yearBuilt} unit="año const." />}
              </div>
            </div>
          )}

          {/* Description */}
          {p.description && (
            <div>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] mb-4">Descripción</p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{p.description}</p>
            </div>
          )}

          {/* Amenities */}
          {activeAmenities.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] mb-4">Amenidades</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeAmenities.map(([, label]) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-stone-700 py-2 border-b border-stone-100">
                    <span className="text-[#0F766E]"><IconCheck /></span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {p.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-[0.3em] mb-2">Detalles adicionales</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{p.notes}</p>
            </div>
          )}
        </div>

        {/* Right column — sticky sidebar with prices + contact */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28 space-y-4">

            {/* Prices card */}
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] mb-4">Precio</p>
              <div className="space-y-3">
                {p.salePrice != null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-0.5">Venta</p>
                    <p className="text-3xl font-semibold text-stone-900" style={{ fontFamily: "'Cinzel', serif" }}>
                      {formatCurrency(p.salePrice, p.currency)}
                    </p>
                  </div>
                )}
                {p.rentPrice != null && (
                  <div className={p.salePrice != null ? "pt-3 border-t border-stone-100" : ""}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-0.5">Alquiler</p>
                    <p className="text-3xl font-semibold text-[#0F766E]" style={{ fontFamily: "'Cinzel', serif" }}>
                      {formatCurrency(p.rentPrice, p.currency)}<span className="text-base text-stone-500 font-normal">/mes</span>
                    </p>
                  </div>
                )}
                {p.maintenanceFee != null && (
                  <div className="pt-3 border-t border-stone-100">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-0.5">Mantenimiento</p>
                    <p className="text-base font-semibold text-stone-700">
                      {formatCurrency(p.maintenanceFee, p.currency)}<span className="text-xs text-stone-500 font-normal">/mes</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-stone-900 text-white rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="EP" className="w-10 h-10 invert" />
                <div>
                  <p className="text-sm font-medium tracking-[0.15em]" style={{ fontFamily: "'Cinzel', serif" }}>EDGAR PRINGLE</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-[0.2em]">Real Estate · Panamá</p>
                </div>
              </div>
              <p className="text-stone-300 text-sm leading-relaxed mb-5">
                ¿Te interesa esta propiedad? Estoy disponible para responder tus preguntas o coordinar una visita.
              </p>
              <a href={`https://wa.me/${BROKER.phone}?text=${waText}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold w-full py-3 rounded text-xs uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer mb-2">
                <IconWA /> WhatsApp
              </a>
              <a href={`mailto:${BROKER.email}?subject=${encodeURIComponent(`Consulta: ${p.title}`)}&body=${encodeURIComponent(`Hola Edgar,\n\nMe interesa la propiedad "${p.title}" — https://panamainmo.com/p/${p.id}\n\nGracias.`)}`}
                className="flex items-center justify-center gap-2 bg-transparent border border-stone-700 hover:border-white text-white font-semibold w-full py-3 rounded text-xs uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer">
                <IconMail /> Email
              </a>
              <div className="border-t border-stone-700 pt-4 mt-5 space-y-2 text-xs">
                <a href={`tel:+${BROKER.phone}`} className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors"><IconPhone />{BROKER.phoneDisplay}</a>
                <a href={BROKER.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors"><IconInstagram />@{BROKER.instagram}</a>
                <p className="flex items-center gap-2 text-stone-400"><IconBadge />Licencia {BROKER.license}</p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-stone-900 text-stone-400 pt-14 pb-6 px-4 sm:px-6 mt-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="EP" className="w-12 h-12 invert" />
              <div className="border-l border-stone-700 pl-3">
                <p className="text-white text-base font-medium tracking-[0.2em]" style={{ fontFamily: "'Cinzel', serif" }}>EDGAR PRINGLE</p>
                <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em]">Real Estate · Panamá</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-stone-400 max-w-md mb-4">
              Asesoría inmobiliaria profesional en Panamá. Compra, venta y alquiler de propiedades con transparencia y dedicación.
            </p>
            <p className="text-xs text-stone-500">
              <span className="uppercase tracking-[0.15em]">Licencia</span> <span className="text-white font-semibold ml-1">{BROKER.license}</span>
            </p>
          </div>

          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-4">Contacto</p>
            <ul className="space-y-3 text-sm">
              <li><a href={`tel:+${BROKER.phone}`} className="flex items-center gap-2 hover:text-white transition-colors"><IconPhone />{BROKER.phoneDisplay}</a></li>
              <li><a href={`mailto:${BROKER.email}`} className="flex items-center gap-2 hover:text-white transition-colors break-all"><IconMail /><span className="break-all">{BROKER.email}</span></a></li>
              <li><a href={BROKER.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><IconInstagram />@{BROKER.instagram}</a></li>
              <li><a href={`https://wa.me/${BROKER.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><IconWA />WhatsApp</a></li>
            </ul>
          </div>

          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-[0.2em] mb-4">Explorar</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/catalogo" className="hover:text-white transition-colors">Todas las propiedades</Link></li>
              <li><Link href="/catalogo" className="hover:text-white transition-colors">En venta</Link></li>
              <li><Link href="/catalogo" className="hover:text-white transition-colors">En alquiler</Link></li>
              <li><Link href="/catalogo" className="hover:text-white transition-colors">Apartamentos</Link></li>
              <li><Link href="/catalogo" className="hover:text-white transition-colors">Casas</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Edgar Pringle Real Estate. Todos los derechos reservados.</p>
          <p className="tracking-[0.2em] uppercase">Panamá · Lic. {BROKER.license}</p>
        </div>
      </footer>
    </div>
  );
}

function SpecItem({ value, unit }: { value: number; unit: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-stone-900" style={{ fontFamily: "'Cinzel', serif" }}>{value}</p>
      <p className="text-[11px] text-stone-500 uppercase tracking-[0.15em] mt-0.5">{unit}</p>
    </div>
  );
}
