// Base de datos de ubicaciones de República Dominicana
// Extraída de portales inmobiliarios: Encuentra24, Compre o Alquile, SuperCasas

export interface Location {
  province: string;
  city: string;
  sectors: string[];
}

export const DR_LOCATIONS: Location[] = [
  {
    province: "Distrito Nacional",
    city: "Santo Domingo",
    sectors: [
      "Piantini", "Naco", "Evaristo Morales", "Paraíso", "Bella Vista",
      "La Esperilla", "Serralles", "El Vergel", "Gazcue", "Zona Universitaria",
      "Los Prados", "Arroyo Hondo", "Los Cacicazgos", "Mirador Norte", "Mirador Sur",
      "Renacimiento", "Julieta Morales", "La Julia", "Los Ríos", "El Millón",
      "Villa Juana", "San Carlos", "Ciudad Nueva", "La Feria", "Zona Colonial",
      "Los Restauradores", "Villa Francisca", "Cristo Rey", "Ensanche Luperón",
      "Ensanche Capotillo", "Villa Consuelo", "Villa Agrícola", "Miraflores",
      "Buenos Aires", "30 de Mayo", "Honduras", "El Cacique",
      "Altos de Arroyo Hondo", "Cerros de Arroyo Hondo", "Viejo Arroyo Hondo",
    ],
  },
  {
    province: "Santo Domingo",
    city: "Santo Domingo Este",
    sectors: [
      "Los Mina", "Alma Rosa", "Villa Faro", "Isabelita", "Mendoza",
      "San Isidro", "Los Tres Brazos", "Cancino", "Brisa del Este",
      "Las Américas", "Juan López", "Los Frailes", "Invivienda",
      "Ozama", "Ensanche Ozama", "La Caleta", "Boca Chica",
    ],
  },
  {
    province: "Santo Domingo",
    city: "Santo Domingo Norte",
    sectors: [
      "Villa Mella", "Sabana Perdida", "Los Guaricanos", "La Victoria",
      "Guaricano", "Los Algodones", "La Barranquita", "Charles de Gaulle",
      "Palmarejo", "Los Girasoles", "Alameda", "Ciudad Modelo",
    ],
  },
  {
    province: "Santo Domingo",
    city: "Santo Domingo Oeste",
    sectors: [
      "Herrera", "Los Alcarrizos", "Manoguayabo", "Pantoja",
      "El Abanico", "Hato Nuevo", "Engombe", "Las Caobas",
    ],
  },
  {
    province: "Santiago",
    city: "Santiago de los Caballeros",
    sectors: [
      "Los Jardines", "Reparto del Este", "Cerro Alto", "La Trinitaria",
      "Bella Terra", "Jardines del Sur", "Los Álamos", "Villa Olga",
      "El Embrujo", "Llanos de Gurabo", "Pontezuela", "Gurabo",
      "Cienfuegos", "Los Salados", "Pekín", "El Ejido",
      "La Zurza", "Ensanche Bermúdez", "Centro de la Ciudad",
      "Arroyo Hondo (Santiago)", "Las Colinas", "Reparto del Norte",
      "Thomén", "Nibaje", "El Retiro", "Vista del Cerro",
    ],
  },
  {
    province: "La Altagracia",
    city: "Punta Cana",
    sectors: [
      "Bávaro", "El Cortecito", "Arena Gorda", "Cabeza de Toro",
      "Cap Cana", "Cocotal", "Los Corales", "Palma Real",
      "Vista Cana", "Cana Bay", "Downtown Punta Cana",
      "White Sands", "Coco Bongo", "Punta Cana Village",
      "Las Canas", "Friusa", "Veron", "San Juan",
    ],
  },
  {
    province: "La Altagracia",
    city: "Higüey",
    sectors: [
      "Centro", "La Otra Banda", "Los Cerros de Higüey",
      "Ensanche San Martín", "Villa Cerro",
    ],
  },
  {
    province: "La Altagracia",
    city: "La Romana",
    sectors: [
      "Casa de Campo", "Centro", "Caleta",
      "Cumayasa", "Bayahíbe", "Dominicus",
    ],
  },
  {
    province: "Puerto Plata",
    city: "Puerto Plata",
    sectors: [
      "Playa Dorada", "Costámbar", "Cofresí", "Long Beach",
      "Cabarete", "Sosúa", "Centro", "Maimón",
      "Montellano", "Luperón",
    ],
  },
  {
    province: "Samaná",
    city: "Samaná",
    sectors: [
      "Las Terrenas", "El Portillo", "Playa Bonita",
      "Pueblo de los Pescadores", "Las Galeras",
      "Samaná Centro", "El Limón", "Playa Rincón",
    ],
  },
  {
    province: "La Vega",
    city: "La Vega",
    sectors: [
      "Centro", "Los Cajuilitos", "Bella Vista",
      "Jarabacoa", "Constanza",
    ],
  },
  {
    province: "San Pedro de Macorís",
    city: "San Pedro de Macorís",
    sectors: [
      "Centro", "Villa Velásquez", "Miramar",
      "Ensanche Juan Pablo Duarte", "Barrio México",
    ],
  },
  {
    province: "Espaillat",
    city: "Moca",
    sectors: [
      "Centro", "La Isleta", "Juan López",
    ],
  },
  {
    province: "Duarte",
    city: "San Francisco de Macorís",
    sectors: [
      "Centro", "Los Rieles", "San Martín de Porres",
      "Villa España", "Ensanche Espaillat",
    ],
  },
  {
    province: "Monseñor Nouel",
    city: "Bonao",
    sectors: [
      "Centro", "Los Quemados", "Sabana del Puerto",
    ],
  },
];

// Función para obtener todas las provincias
export function getProvinces(): string[] {
  return [...new Set(DR_LOCATIONS.map((l) => l.province))];
}

// Función para obtener ciudades de una provincia
export function getCities(province?: string): string[] {
  const locs = province ? DR_LOCATIONS.filter((l) => l.province === province) : DR_LOCATIONS;
  return [...new Set(locs.map((l) => l.city))];
}

// Función para obtener sectores de una ciudad
export function getSectors(city?: string): string[] {
  const locs = city ? DR_LOCATIONS.filter((l) => l.city === city) : DR_LOCATIONS;
  return locs.flatMap((l) => l.sectors).sort();
}

// Función para buscar ubicaciones (autocompletado)
export function searchLocations(query: string): { type: "province" | "city" | "sector"; value: string; parent: string }[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: { type: "province" | "city" | "sector"; value: string; parent: string }[] = [];

  for (const loc of DR_LOCATIONS) {
    if (loc.province.toLowerCase().includes(q)) {
      results.push({ type: "province", value: loc.province, parent: "" });
    }
    if (loc.city.toLowerCase().includes(q)) {
      results.push({ type: "city", value: loc.city, parent: loc.province });
    }
    for (const sector of loc.sectors) {
      if (sector.toLowerCase().includes(q)) {
        results.push({ type: "sector", value: sector, parent: `${loc.city}, ${loc.province}` });
      }
    }
  }

  // Eliminar duplicados
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = `${r.type}:${r.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 15);
}

// Rangos de precios para filtros
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
