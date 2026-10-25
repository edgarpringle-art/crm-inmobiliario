// Zonas de Panamá para búsquedas y propiedades
// Basado en portales inmobiliarios (Encuentra24, MiInmueble, LaEstrella).
// Área metropolitana: barriadas detalladas. Interior: ciudades / zonas principales.
// No renombrar zonas existentes: quedan guardadas en las búsquedas de los clientes.

export interface ZonaGroup {
  group: string;
  zones: string[];
}

export const ZONAS: ZonaGroup[] = [
  {
    group: "Ciudad de Panamá — Zona Bancaria / Centro",
    zones: [
      "El Cangrejo", "Obarrio", "Marbella", "Urb. Marbella", "Bella Vista", "La Cresta",
      "El Carmen", "Campo Alegre", "Vía España", "La Alameda", "Paitilla",
      "Avenida Balboa", "Área Bancaria", "Calle 50", "Vía Argentina", "Vía Veneto",
      "Herbruger", "Perejil", "Las Sabanas", "Vía Porras",     ],
  },
  {
    group: "Ciudad de Panamá — Lujo / Costero",
    zones: [
      "Punta Pacífica", "Punta Paitilla", "Coco del Mar", "Ocean Reef",
      "Costa del Este", "Santa María Golf", "Santa María", "Versalles",
      "Brisas del Golf", "Santa Elena", "Riviera", "Altos del Golf", "Club de Golf",
    ],
  },
  {
    group: "Ciudad de Panamá — San Francisco / Carrasquilla",
    zones: [
      "San Francisco", "Carrasquilla", "Boca La Caja", "Viña del Mar",
      "Altos de San Francisco", "Parque Omar", "Vista Hermosa", "La Locería",
    ],
  },
  {
    group: "Ciudad de Panamá — Pueblo Nuevo / Vía España",
    zones: [
      "Pueblo Nuevo", "Hato Pintado", "Altos de Hato Pintado", "El Bosque",
      "Las Acacias", "Lotería", "Villa de las Fuentes", "Cerro Batea",
      "Parque Lefevre", "Río Abajo", "Chanis", "El Ingenio", "Villa del Rey",
      "El Prado", "Club X", "Altos del Chase",     ],
  },
  {
    group: "Ciudad de Panamá — Betania / Tumba Muerto",
    zones: [
      "Betania", "El Dorado", "Los Ángeles", "Camino Real",
      "Altos de Betania", "La Gloria", "Dos Mares", "Linda Vista", "Miraflores",
      "Villa Cáceres", "Llano Bonito", "Ricardo J. Alfaro (Tumba Muerto)",
      "Condado del Rey", "Altos de Panamá",       "Altos del Bosque", "Villa Zaita", "Dorasol", "San Antonio", "El Crisol",
      "Las Mercedes", "Altos de Miraflores", "Puerta del Este", "Altos de Curundú",
      "Altos de Santa María",
    ],
  },
  {
    group: "Ciudad de Panamá — Casco / Sur",
    zones: [
      "Casco Viejo", "San Felipe", "Santa Ana", "Calidonia", "El Chorrillo",
      "La Exposición", "Curundú", "Barraza", "Amador", "Causeway de Amador",
    ],
  },
  {
    group: "Ciudad de Panamá — Ancón / Zona del Canal",
    zones: [
      "Ancón", "Balboa", "La Boca", "Clayton", "Ciudad del Saber", "Albrook",
      "Quarry Heights", "Diablo", "Los Ríos", "Corozal", "Cárdenas",
      "Llanos de Curundú", "Miraflores (Canal)", "Pedro Miguel", "Paraíso",
      "Gamboa", "Cocolí",
    ],
  },
  {
    group: "Ciudad de Panamá — Juan Díaz / Este",
    zones: [
      "Juan Díaz", "Don Bosco", "Costa Sur", "Ciudad Radial", "Villa Catalina",
      "Hipódromo", "Altos del Hipódromo", "Los Pueblos", "Villa Venus",
      "Teremar", "Puente del Rey", "Plaza Carolina", "Santa Clara (Juan Díaz)",
      "Villa de las Acacias", "Altos de Las Praderas", "Las Praderas",
      "Panamá Viejo", "Altos de Panamá Viejo", "Ciudad Jardín",
    ],
  },
  {
    group: "Panamá Este — Tocumen / Pacora / Chepo",
    zones: [
      "Tocumen", "Nuevo Tocumen", "La Siesta", "Altos de Tocumen", "Las Mañanitas",
      "24 de Diciembre", "La Doña", "Las Garzas", "Pacora",
      "San Martín", "Chepo", "Cerro Azul", "Altos de Cerro Azul",
      "Los Nogales",     ],
  },
  {
    group: "Panamá Norte",
    zones: [
      "Las Cumbres", "Altos de Las Cumbres", "Alcalde Díaz", "Ernesto Córdoba Campos",
      "Brisas del Norte", "Villa Grecia", "Chilibre", "Caimitillo", "Calzada Larga",
      "La Cabima", "Pedregal", "San Vicente", "Villa Unida", "Lucha Franco",
      "Altos de Lucha Franco", "Ciudad Bolívar", "Colinas de Las Cumbres",
    ],
  },
  {
    group: "San Miguelito",
    zones: [
      "San Miguelito", "Villa Lucre", "Altos de Villa Lucre", "Cerro Viento",
      "Altos de Cerro Viento", "Victoriano Lorenzo", "Torrijos Carter",
      "Belisario Porras", "Belisario Frías", "Los Andes", "Omar Torrijos",
      "José Domingo Espinar", "Amelia Denis de Icaza", "Mateo Iturralde",
      "Rufina Alfaro", "Arnulfo Arias", "Paraíso (San Miguelito)",
      "Santa Librada", "San Isidro", "Loma Linda", "Samaria", "Villa Guadalupe",
      "Altos de Las Acacias",       "Anita", "Buenos Aires", "El Espino", "Hermosa Provincia",
      "La Pradera", "La Victoria", "Las Quintas", "Monte Oscuro", "Mano de Piedra",
      "Villa Internacional", "Milla 8",     ],
  },
  {
    group: "Panamá Oeste — Arraiján",
    zones: [
      "Arraiján", "Nuevo Arraiján", "Vista Alegre", "Veracruz",
      "Panamá Pacífico", "Howard", "Kobbe", "Burunga", "Cerro Silvestre",
      "Juan Demóstenes Arosemena", "Nuevo Emperador", "Santa Clara (Arraiján)",
      "Vacamonte", "Altos de Vacamonte", "Loma Cová", "Ciudad Futuro",
      "Brisas del Lago", "Lago Emperador", "Cáceres",
    ],
  },
  {
    group: "Panamá Oeste — La Chorrera / Capira",
    zones: [
      "La Chorrera", "Barrio Colón (Chorrera)", "Barrio Balboa (Chorrera)",
      "Guadalupe", "El Coco", "Herrera", "Hurtado", "Feuillet", "Iturralde",
      "La Represa", "Mastranto", "Santa Rita", "Puerto Caimito", "Playa Leona",
      "Costa Verde", "Las Uvas", "Altos de San Francisco (Chorrera)",
      "Capira", "Campana", "Lídice", "Villa Rosario",
    ],
  },
  {
    group: "Panamá Oeste — Playas",
    zones: [
      "Punta Chame", "Chame", "Bejuco", "Nueva Gorgona", "Gorgona", "Coronado",
      "Las Lajas", "Punta Barco", "San Carlos", "El Palmar", "Playa Corona",
      "Río Mar", "Sora", "Altos del María", "El Higo",
    ],
  },
  {
    group: "Coclé",
    zones: [
      "Playa Blanca", "Farallon", "Santa Clara", "Río Hato", "Buenaventura",
      "Juan Hombrón", "Antón", "El Valle de Antón", "Penonomé", "Aguadulce", "Natá",
    ],
  },
  {
    group: "Islas",
    zones: [
      "Isla Taboga", "Contadora", "Islas de las Perlas", "Isla San José",
      "Isla Viveros", "Pedro González",
    ],
  },
  {
    group: "Colón / Caribe",
    zones: [
      "Colón", "Colón 2000", "Sabanitas", "Cativá", "Buena Vista", "Margarita",
      "Gatún", "Puerto Pilón", "María Chiquita", "Portobelo", "Isla Grande",
      "Nombre de Dios", "Costa Abajo",
    ],
  },
  {
    group: "Chiriquí",
    zones: [
      "David", "Boquete", "Volcán", "Dolega", "Cerro Punta", "Potrerillos",
      "Bugaba", "Puerto Armuelles", "Boca Chica", "Las Lajas (Chiriquí)",
      "Chiriquí Grande",
    ],
  },
  {
    group: "Bocas del Toro",
    zones: [
      "Bocas Town", "Isla Colón", "Bastimentos", "Carenero", "Almirante", "Changuinola",
    ],
  },
  {
    group: "Azuero / Interior",
    zones: [
      "Chitré", "Las Tablas", "Pedasi", "Playa Venao", "Tonosi", "Guararé",
      "Macaracas", "Ocú", "Parita", "Divisa", "Santiago", "Santa Fe",
      "Santa Catalina", "Darién",
    ],
  },
];

export const ALL_ZONAS: string[] = ZONAS.flatMap((g) => g.zones);
