// Base de datos de ubicaciones de Panamá
// Provincias, distritos y corregimientos

export interface Location {
  province: string;
  district: string;
  sectors: string[];
}

export const PA_LOCATIONS: Location[] = [
  {
    province: "Panamá",
    district: "Panamá",
    sectors: [
      "Casco Viejo", "El Cangrejo", "Punta Pacifica", "Costa del Este",
      "Amador", "Calidonia", "Curundu", "La Exposición", "San Miguelito",
      "Parque Lefevre", "Belisario Porras", "Juan Díaz", "Tocumen",
      "Condado del Rey", "Clayton", "Ancón", "Balboa",
    ],
  },
  {
    province: "Panamá",
    district: "San Miguelito",
    sectors: [
      "Anita", "Belisario Porras", "Buenos Aires", "Cresto",
      "El Espino", "Hermosa Provincia", "La Pradera", "La Victoria",
      "Las Acacias", "Las Mañanitas", "Las Quintas", "Loma Linda",
      "Los Andes", "Mateo Iturralde", "Omar Torrijos", "Pedregal",
    ],
  },
  {
    province: "Panamá",
    district: "San Blas",
    sectors: [
      "El Porvenir", "Nargana", "Corazón de Jesús", "Ustupu",
      "Mulatupo", "Tupile", "Ailigandi", "Playón Chico",
    ],
  },
  {
    province: "Panamá Oeste",
    district: "Arraijón",
    sectors: [
      "Centro", "Veracruz", "Oleoducto", "Casco Antiguo",
      "Puerto Caimito", "Bejuco", "Río Abajo",
    ],
  },
  {
    province: "Panamá Oeste",
    district: "Capira",
    sectors: [
      "Capira", "Chicuaco", "El Aljibe",
    ],
  },
  {
    province: "Panamá Oeste",
    district: "Chame",
    sectors: [
      "Chame", "Punta Chame", "Bejuco", "El Aljibe",
      "Coronado", "San Carlos",
    ],
  },
  {
    province: "Bocas del Toro",
    district: "Bocas del Toro",
    sectors: [
      "Bocas Town", "Bastimentos", "Carenero", "Colón",
      "Popa", "Cristóbal", "Isla Colón",
    ],
  },
  {
    province: "Bocas del Toro",
    district: "Changuinola",
    sectors: [
      "Changuinola", "Almirante", "Guabito", "Isla Colón",
    ],
  },
  {
    province: "Colón",
    district: "Colón",
    sectors: [
      "Centro", "San Juan de Dios", "El Marañón", "Sabanita",
      "Barrio Toro", "La Exposición", "Colón 2000",
    ],
  },
  {
    province: "Colón",
    district: "Chagres",
    sectors: [
      "Nuevo Chagres", "Gatún", "Gatuncillo",
    ],
  },
  {
    province: "Colón",
    district: "Portobelo",
    sectors: [
      "Portobelo", "La Guaira", "Nombre de Dios",
    ],
  },
  {
    province: "Darién",
    district: "La Palma",
    sectors: [
      "La Palma", "Garachimé",
    ],
  },
  {
    province: "Darién",
    district: "Chepigana",
    sectors: [
      "Chepigana", "Jaqué",
    ],
  },
  {
    province: "Herrera",
    district: "Chitré",
    sectors: [
      "Centro", "Las Tablas", "La Arena", "Ocú",
      "Pesé", "Divisa", "Santa María", "Parita",
    ],
  },
  {
    province: "Herrera",
    district: "Las Tablas",
    sectors: [
      "Centro", "Pedasi", "Tonosi",
    ],
  },
  {
    province: "Los Santos",
    district: "Las Tablas",
    sectors: [
      "Centro", "Guararé", "Macaracas",
    ],
  },
  {
    province: "Los Santos",
    district: "Pedasi",
    sectors: [
      "Pedasi", "Tonosi", "Cambutal",
    ],
  },
  {
    province: "Veraguas",
    district: "Santiago",
    sectors: [
      "Centro", "La Chorrera", "Calobre", "Canto de Ladrillos",
      "Divisa", "Ocú", "Atalaya", "Escuela", "Santa Fe",
    ],
  },
  {
    province: "Veraguas",
    district: "David",
    sectors: [
      "Centro", "Boquete", "Cerro Punta", "Renacimiento",
      "Palo Alto", "Potrerillos", "Pedasí",
    ],
  },
  {
    province: "Veraguas",
    district: "Boquete",
    sectors: [
      "Centro", "Bajo Boquete", "Alto Boquete", "Caldera",
    ],
  },
  {
    province: "Ngäbe-Buglé",
    district: "Changuinola",
    sectors: [
      "Changuinola", "Guabito",
    ],
  },
];

export function getProvinces(): string[] {
  return [...new Set(PA_LOCATIONS.map((l) => l.province))];
}

export function getDistricts(province?: string): string[] {
  const locs = province ? PA_LOCATIONS.filter((l) => l.province === province) : PA_LOCATIONS;
  return [...new Set(locs.map((l) => l.district))];
}

export function getSectors(district?: string): string[] {
  const locs = district ? PA_LOCATIONS.filter((l) => l.district === district) : PA_LOCATIONS;
  return locs.flatMap((l) => l.sectors).sort();
}

export function searchLocations(query: string): { type: "province" | "district" | "sector"; value: string; parent: string }[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: { type: "province" | "district" | "sector"; value: string; parent: string }[] = [];

  for (const loc of PA_LOCATIONS) {
    if (loc.province.toLowerCase().includes(q)) {
      results.push({ type: "province", value: loc.province, parent: "" });
    }
    if (loc.district.toLowerCase().includes(q)) {
      results.push({ type: "district", value: loc.district, parent: loc.province });
    }
    for (const sector of loc.sectors) {
      if (sector.toLowerCase().includes(q)) {
        results.push({ type: "sector", value: sector, parent: `${loc.district}, ${loc.province}` });
      }
    }
  }

  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.type}:${r.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 15);
}

export const PRICE_RANGES_SALE = [
  { value: "0-50000", label: "Hasta US$50,000" },
  { value: "50000-100000", label: "US$50,000 - US$100,000" },
  { value: "100000-200000", label: "US$100,000 - US$200,000" },
  { value: "200000-500000", label: "US$200,000 - US$500,000" },
  { value: "500000-1000000", label: "US$500,000 - US$1,000,000" },
  { value: "1000000-99999999", label: "Más de US$1,000,000" },
];

export const PRICE_RANGES_RENT = [
  { value: "0-500", label: "Hasta US$500/mes" },
  { value: "500-1000", label: "US$500 - US$1,000/mes" },
  { value: "1000-2000", label: "US$1,000 - US$2,000/mes" },
  { value: "2000-5000", label: "US$2,000 - US$5,000/mes" },
  { value: "5000-99999999", label: "Más de US$5,000/mes" },
];
