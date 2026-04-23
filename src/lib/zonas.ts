// Zonas de Panamá para búsquedas y propiedades
// Basado en portales inmobiliarios (Encuentra24, MiInmueble, LaEstrella)

export interface ZonaGroup {
  group: string;
  zones: string[];
}

export const ZONAS: ZonaGroup[] = [
  {
    group: "Ciudad de Panamá — Zona Bancaria",
    zones: [
      "El Cangrejo", "Obarrio", "Marbella", "Bella Vista", "La Cresta",
      "El Carmen", "Campo Alegre", "Vía España", "La Alameda",
      "Urb. Marbella", "Paitilla", "Avenida Balboa",
    ],
  },
  {
    group: "Ciudad de Panamá — Lujo / Costero",
    zones: [
      "Punta Pacífica", "Punta Paitilla", "Coco del Mar",
      "Costa del Este", "Santa María Golf", "Versalles",
      "Brisas del Golf", "Santa Elena", "Riviera",
    ],
  },
  {
    group: "Ciudad de Panamá — San Francisco / Este",
    zones: [
      "San Francisco", "Betania", "Hato Pintado", "Pueblo Nuevo",
      "Parque Lefevre", "Río Abajo", "Chanis", "El Ingenio",
      "Miraflores", "Villa del Rey", "El Prado",
    ],
  },
  {
    group: "Ciudad de Panamá — Casco / Sur",
    zones: [
      "Casco Viejo", "Santa Ana", "Calidonia", "El Chorrillo",
      "La Exposición", "Curundú", "Amador", "Ancón", "Balboa",
    ],
  },
  {
    group: "Ciudad de Panamá — Zona del Canal",
    zones: [
      "Clayton", "Albrook", "Quarry Heights", "Miraflores (Canal)",
      "Panamá Pacífico", "Howard", "Kobbe",
    ],
  },
  {
    group: "Ciudad de Panamá — Norte / Afueras",
    zones: [
      "Las Cumbres", "Chilibre", "Alcalde Díaz", "Pedregal",
      "Juan Díaz", "Tocumen", "24 de Diciembre", "Las Mañanitas",
      "Las Garzas", "Pacora", "La Cabima",
    ],
  },
  {
    group: "San Miguelito",
    zones: [
      "San Miguelito", "Villa Lucre", "El Dorado", "Cerro Viento",
      "Victoriano Lorenzo", "Torrijos Carter", "Belisario Porras",
      "Los Andes", "Omar Torrijos", "José Domingo Espinar",
    ],
  },
  {
    group: "Panamá Oeste — La Chorrera / Arraijón",
    zones: [
      "La Chorrera", "Arraijón", "Veracruz", "Nuevo Arraiján",
      "Vista Alegre", "Puerto Caimito", "Barrio Colón (Chorrera)",
      "Las Uvas", "La Represa",
    ],
  },
  {
    group: "Panamá Oeste — Playas",
    zones: [
      "Coronado", "Gorgona", "Chame", "San Carlos", "Playa Blanca",
      "El Palmar", "Santa Clara", "Farallon", "Río Mar",
    ],
  },
  {
    group: "Chiriquí",
    zones: [
      "David", "Boquete", "Volcán", "Dolega", "Cerro Punta",
      "Puerto Armuelles", "Chiriquí Grande",
    ],
  },
  {
    group: "Colón / Caribe",
    zones: [
      "Colón", "Portobelo", "Nombre de Dios", "María Chiquita",
      "Sabanitas", "Colón 2000",
    ],
  },
  {
    group: "Bocas del Toro",
    zones: [
      "Bocas Town", "Isla Colón", "Bastimentos", "Almirante",
      "Changuinola", "Carenero",
    ],
  },
  {
    group: "Azuero / Interior",
    zones: [
      "Chitré", "Las Tablas", "Pedasi", "Tonosi", "Guararé",
      "Ocú", "Divisa", "Penonomé", "Aguadulce", "Santiago",
    ],
  },
];

export const ALL_ZONAS: string[] = ZONAS.flatMap((g) => g.zones);
