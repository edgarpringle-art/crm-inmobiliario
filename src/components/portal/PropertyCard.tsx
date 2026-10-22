import Link from "next/link";
import { formatCurrency } from "@/lib/constants";
import { optimizePhoto } from "@/lib/publicProperty";
import { SERIF, typeLabel, waLink, type PortalProperty } from "./brand";
import { IconArea, IconBath, IconBed, IconCar, IconHouse, IconImages, IconPin, IconWA } from "./icons";

export default function PropertyCard({ p }: { p: PortalProperty }) {
  const photo = p.photos[0];
  const loc = [p.sector, p.city].filter(Boolean).join(", ");
  const isVenta = p.operationType === "VENTA" || p.operationType === "VENTA_Y_ALQUILER";
  const isAlquiler = p.operationType === "ALQUILER" || p.operationType === "VENTA_Y_ALQUILER";

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#E9E0D0] hover:shadow-[0_20px_40px_-20px_rgba(30,26,21,0.35)] hover:-translate-y-1 transition-all duration-300 group flex flex-col">
      <Link href={`/p/${p.id}`} className="block relative overflow-hidden bg-[#EDE3D2]" style={{ aspectRatio: "4/3" }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={optimizePhoto(photo, 800)} alt={p.title} loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#B8945F]"><IconHouse /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1A15]/60 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isVenta && <span className="bg-[#1E1A15]/85 backdrop-blur text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-[0.15em]">Venta</span>}
          {isAlquiler && <span className="bg-[#B8945F] text-white text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-[0.15em]">Alquiler</span>}
        </div>
        {(p.photoCount ?? p.photos.length) > 1 && (
          <span className="absolute top-3 right-3 bg-black/50 text-white text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <IconImages /> {p.photoCount ?? p.photos.length}
          </span>
        )}
        <div className="absolute bottom-3 left-4 right-4 text-white">
          {p.salePrice != null && <p className="text-xl font-semibold drop-shadow" style={SERIF}>{formatCurrency(p.salePrice, p.currency)}</p>}
          {p.rentPrice != null && (
            <p className={`${p.salePrice != null ? "text-sm" : "text-xl"} font-semibold drop-shadow`} style={SERIF}>
              {formatCurrency(p.rentPrice, p.currency)}<span className="text-xs font-normal opacity-80">/mes</span>
            </p>
          )}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.2em] mb-2">{typeLabel[p.propertyType] || "Propiedad"}</p>
        <Link href={`/p/${p.id}`}>
          <h3 className="font-semibold text-[#1E1A15] leading-snug group-hover:text-[#8A6A3A] transition-colors line-clamp-2 mb-1.5 text-base" style={SERIF}>
            {p.title}
          </h3>
        </Link>
        {loc && <p className="text-xs text-[#6B6155] flex items-center gap-1 mb-4"><IconPin />{loc}</p>}

        <div className="flex items-center gap-4 text-xs text-[#4A4238] mb-4 flex-wrap pt-3 border-t border-[#F0E8DA]">
          {p.bedrooms != null && <span className="flex items-center gap-1"><IconBed />{p.bedrooms} hab</span>}
          {p.bathrooms != null && <span className="flex items-center gap-1"><IconBath />{p.bathrooms} baños</span>}
          {p.area != null && <span className="flex items-center gap-1"><IconArea />{p.area} m²</span>}
          {p.parkingSpots != null && p.parkingSpots > 0 && <span className="flex items-center gap-1"><IconCar />{p.parkingSpots}</span>}
        </div>

        <div className="flex gap-2 mt-auto">
          <Link href={`/p/${p.id}`}
            className="flex-1 text-center text-xs font-semibold text-[#1E1A15] border border-[#1E1A15] rounded-full py-2.5 hover:bg-[#1E1A15] hover:text-white transition-all uppercase tracking-[0.15em]">
            Ver ficha
          </Link>
          <a href={waLink(`Hola, me interesa la propiedad: ${p.title}${loc ? ` en ${loc}` : ""}\nhttps://panamainmo.com/p/${p.id}`)}
            target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp"
            className="flex items-center justify-center w-11 h-11 bg-[#25D366] hover:bg-[#1EBE5A] text-white rounded-full transition-colors shrink-0">
            <IconWA />
          </a>
        </div>
      </div>
    </div>
  );
}
