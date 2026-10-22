// División político-administrativa de Panamá: Provincia → Distrito → Corregimientos.
// Barrios/urbanizaciones are not official divisions; they come from the MLS inventory and the
// legacy sector lists in locations.ts. Fields stay free text, so anything missing can be typed.

export const DIVISION: Record<string, Record<string, string[]>> = {
  "Panamá": {
    "Panamá": [
      "San Felipe", "El Chorrillo", "Santa Ana", "La Exposición o Calidonia", "Curundú", "Betania",
      "Bella Vista", "Pueblo Nuevo", "San Francisco", "Parque Lefevre", "Río Abajo", "Juan Díaz",
      "Pedregal", "Ancón", "Chilibre", "Las Cumbres", "Pacora", "San Martín", "Tocumen",
      "Las Mañanitas", "24 de Diciembre", "Alcalde Díaz", "Ernesto Córdoba Campos", "Caimitillo",
      "Las Garzas", "Don Bosco",
    ],
    "San Miguelito": [
      "Amelia Denis de Icaza", "Belisario Porras", "José Domingo Espinar", "Mateo Iturralde",
      "Victoriano Lorenzo", "Arnulfo Arias", "Belisario Frías", "Omar Torrijos", "Rufina Alfaro",
    ],
    "Chepo": ["Chepo", "Cañita", "Chepillo", "El Llano", "Las Margaritas", "Santa Cruz de Chinina", "Madungandí", "Tortí"],
    "Chimán": ["Chimán", "Brujas", "Gonzalo Vásquez", "Pásiga", "Unión Santeña"],
    "Balboa": ["San Miguel", "La Ensenada", "La Esmeralda", "La Guinea", "Pedro González", "Saboga"],
    "Taboga": ["Taboga", "Otoque Occidente", "Otoque Oriente"],
  },
  "Panamá Oeste": {
    "Arraiján": [
      "Arraiján", "Juan Demóstenes Arosemena", "Nuevo Emperador", "Santa Clara", "Veracruz",
      "Vista Alegre", "Burunga", "Cerro Silvestre",
    ],
    "La Chorrera": [
      "Barrio Balboa", "Barrio Colón", "Amador", "Arosemena", "El Arado", "El Coco", "Feuillet",
      "Guadalupe", "Herrera", "Hurtado", "Iturralde", "La Represa", "Los Díaz", "Mendoza",
      "Obaldía", "Playa Leona", "Puerto Caimito", "Santa Rita",
    ],
    "Capira": [
      "Capira", "Caimito", "Campana", "Cermeño", "Cirí de Los Sotos", "Cirí Grande", "El Cacao",
      "La Trinidad", "Las Ollas Arriba", "Lídice", "Villa Carmen", "Villa Rosario", "Santa Rosa",
    ],
    "Chame": [
      "Chame", "Bejuco", "Buenos Aires", "Cabuya", "Chicá", "El Líbano", "Las Lajas",
      "Nueva Gorgona", "Punta Chame", "Sajalices", "Sorá",
    ],
    "San Carlos": ["San Carlos", "El Espino", "El Higo", "Guayabito", "La Ermita", "La Laguna", "Las Uvas", "Los Llanitos", "San José"],
  },
  "Coclé": {
    "Aguadulce": ["Aguadulce", "El Cristo", "El Roble", "Pocrí", "Barrios Unidos"],
    "Antón": ["Antón", "Cabuya", "El Chirú", "El Retiro", "El Valle", "Juan Hombrón", "Río Hato", "San Juan de Dios", "Santa Rita", "Caballero"],
    "La Pintada": ["La Pintada", "El Harino", "El Potrero", "Llano Grande", "Piedras Gordas", "Las Lomas"],
    "Natá": ["Natá", "Capellanía", "El Caño", "Guzmán", "Las Huacas", "Toza"],
    "Olá": ["Olá", "El Copé", "El Palmar", "El Picacho", "La Pava"],
    "Penonomé": ["Penonomé", "Cañaveral", "Coclé", "Chiguirí Arriba", "El Coco", "Pajonal", "Río Grande", "Río Indio", "Toabré", "Tulú"],
  },
  "Colón": {
    "Colón": [
      "Barrio Norte", "Barrio Sur", "Buena Vista", "Cativá", "Ciricito", "Cristóbal", "Cristóbal Este",
      "Escobal", "Limón", "Nueva Providencia", "Puerto Pilón", "Sabanitas", "Salamanca", "San Juan", "Santa Rosa",
    ],
    "Chagres": ["Nuevo Chagres", "Achiote", "El Guabo", "La Encantada", "Palmas Bellas", "Piña", "Salud"],
    "Donoso": ["Miguel de la Borda", "Coclé del Norte", "El Guásimo", "Gobea", "Río Indio", "San José del General"],
    "Portobelo": ["Portobelo", "Cacique", "Garrote", "Isla Grande", "María Chiquita"],
    "Santa Isabel": ["Palenque", "Cuango", "Miramar", "Nombre de Dios", "Palmira", "Playa Chiquita", "Santa Isabel", "Viento Frío"],
  },
  "Chiriquí": {
    "David": ["David", "David Este", "David Sur", "Bijagual", "Cochea", "Chiriquí", "Guacá", "Las Lomas", "Pedregal", "San Carlos", "San Pablo Nuevo", "San Pablo Viejo"],
    "Boquete": ["Bajo Boquete", "Alto Boquete", "Caldera", "Palmira", "Jaramillo", "Los Naranjos"],
    "Dolega": ["Dolega", "Dos Ríos", "Los Anastacios", "Potrerillos", "Potrerillos Abajo", "Rovira", "Tinajas", "Los Algarrobos"],
    "Bugaba": ["La Concepción", "Aserrío de Gariché", "Bugaba", "Gómez", "La Estrella", "San Andrés", "Santa Marta", "Santa Rosa", "Santo Domingo", "Sortová", "El Bongo"],
    "Tierras Altas": ["Volcán", "Cerro Punta", "Cuesta de Piedra", "Nueva California", "Paso Ancho"],
    "Boquerón": ["Boquerón", "Bágala", "Cordillera", "Guabal", "Guayabal", "Paraíso", "Pedregal", "Tijeras"],
    "Alanje": ["Alanje", "Divalá", "El Tejar", "Guarumal", "Palo Grande", "Querévalo", "Santo Tomás", "Canta Gallo", "Nuevo México"],
    "Barú": ["Puerto Armuelles", "Limones", "Progreso", "Baco", "Rodolfo Aguilar Delgado"],
    "Gualaca": ["Gualaca", "Hornito", "Los Ángeles", "Paja de Sombrero", "Rincón"],
    "Renacimiento": ["Río Sereno", "Breñón", "Cañas Gordas", "Monte Lirio", "Plaza de Caisán", "Santa Cruz", "Dominical", "Santa Clara"],
    "San Lorenzo": ["Horconcitos", "Boca Chica", "Boca del Monte", "San Juan", "San Lorenzo"],
    "San Félix": ["Las Lajas", "Juay", "Lajas Adentro", "San Félix", "Santa Cruz"],
    "Remedios": ["Remedios", "El Nancito", "El Porvenir", "El Puerto", "Santa Lucía"],
    "Tolé": ["Tolé", "Bella Vista", "Cerro Viejo", "El Cristo", "Justo Fidel Palacios", "Lajas de Tolé", "Potrero de Caña", "Quebrada de Piedra", "Veladero"],
  },
  "Los Santos": {
    "Las Tablas": ["Las Tablas", "Bajo Corral", "Bayano", "El Carate", "El Cocal", "El Manantial", "El Muñoz", "El Pedregoso", "La Laja", "La Miel", "La Palma", "La Tiza", "Las Palmitas", "Las Tablas Abajo", "Nuario", "Palmira", "Peña Blanca", "Río Hondo", "San José", "San Miguel", "Santo Domingo", "Sesteadero", "Valle Rico", "Vallerriquito"],
    "Los Santos": ["La Villa de Los Santos", "El Guásimo", "La Colorada", "La Espigadilla", "Las Cruces", "Las Guabas", "Los Ángeles", "Los Olivos", "Llano Largo", "Sabanagrande", "Santa Ana", "Tres Quebradas", "Agua Buena", "Villa Lourdes"],
    "Pedasí": ["Pedasí", "Los Asientos", "Mariabé", "Purio", "Oria Arriba"],
    "Guararé": ["Guararé", "Guararé Abajo", "El Espinal", "El Macano", "La Enea", "La Pasera", "Las Trancas", "Llano Abajo", "El Hato", "Perales"],
    "Tonosí": ["Tonosí", "Altos de Güera", "Cañas", "El Bebedero", "El Cacao", "El Cortezo", "Flores", "Guánico", "La Tronosa", "Cambutal", "Isla de Cañas"],
    "Pocrí": ["Pocrí", "El Cañafístulo", "Lajamina", "Paraíso", "Paritilla"],
    "Macaracas": ["Macaracas", "Bahía Honda", "Bajos de Güera", "Corozal", "Chupá", "El Cedro", "Espino Amarillo", "La Mesa", "Llano de Piedra", "Las Palmas", "Mogollón"],
  },
  "Herrera": {
    "Chitré": ["Chitré", "La Arena", "Monagrillo", "Llano Bonito", "San Juan Bautista"],
    "Parita": ["Parita", "Cabuya", "Los Castillos", "Llano de la Cruz", "París", "Portobelillo", "Potuga"],
    "Santa María": ["Santa María", "Chupampa", "El Limón", "Los Canelos", "El Rincón"],
    "Pesé": ["Pesé", "Las Cabras", "El Pájaro", "El Barrero", "El Pedregoso", "El Ciruelo", "Sabanagrande", "Rincón Hondo"],
    "Ocú": ["Ocú", "Cerro Largo", "Los Llanos", "Llano Grande", "Peñas Chatas", "El Tijera", "Menchaca"],
    "Las Minas": ["Las Minas", "Chepo", "Chumical", "El Toro", "Leones", "Quebrada del Rosario", "Quebrada El Ciprián"],
    "Los Pozos": ["Los Pozos", "Capurí", "El Calabacito", "El Cedro", "La Arena", "La Pitaloza", "Los Cerritos", "Los Cerros de Paja", "Las Llanas"],
  },
  "Veraguas": {
    "Santiago": ["Santiago", "La Colorada", "La Peña", "La Raya de Calobre", "Los Algarrobos", "Ponuga", "San Pedro del Espino", "Canto del Llano", "Carlos Santana Ávila", "Edwin Fábrega", "San Martín de Porres", "Urracá", "Rodrigo Luque", "Nuevo Santiago"],
    "Atalaya": ["Atalaya", "El Barrito", "La Montañuela", "San Antonio", "La Carrillo"],
    "Soná": ["Soná", "Bahía Honda", "Calidonia", "Cativé", "El Marañón", "Guarumal", "La Soledad", "Quebrada de Oro", "Río Grande", "Rodeo Viejo"],
    "Mariato": ["Arenas", "El Cacao", "Llano de Catival", "Quebro", "Tebario"],
    "Montijo": ["Montijo", "Gobernadora", "La Garceana", "Leones", "Pilón", "Cébaco", "Costa Hermosa", "Unión del Norte"],
    "Santa Fe": ["Santa Fe", "Calovébora", "El Alto", "El Cuay", "El Pantano", "Gatú", "Río Luis"],
  },
  "Bocas del Toro": {
    "Bocas del Toro": ["Bocas del Toro", "Bastimentos", "Cauchero", "Punta Laurel", "Tierra Oscura"],
    "Changuinola": ["Changuinola", "Cochigró", "El Empalme", "Las Tablas", "Guabito", "Teribe", "Las Delicias", "La Gloria"],
    "Almirante": ["Almirante", "Barrio Francés", "Barriada Guaymí", "Nance de Riscó", "Valle de Agua Arriba", "Valle de Riscó"],
    "Chiriquí Grande": ["Chiriquí Grande", "Bajo Culubre", "Miramar", "Punta Peña", "Punta Robalo", "Rambala"],
  },
  "Darién": {
    "Chepigana": ["La Palma", "Camoganti", "Chepigana", "Garachiné", "Jaqué", "Puerto Piña", "Sambú", "Setegantí", "Taimatí", "Tucutí"],
    "Pinogana": ["El Real de Santa María", "Boca de Cupe", "Paya", "Pinogana", "Púcuro", "Yape", "Yaviza", "Metetí", "Wargandí"],
    "Santa Fe": ["Santa Fe", "Agua Fría", "Cucunatí", "Río Congo", "Río Congo Arriba", "Río Iglesias", "Zapallal"],
  },
  "Guna Yala": { "Guna Yala": ["Narganá", "Ailigandí", "Puerto Obaldía", "Tubualá"] },
  "Ngäbe-Buglé": { "Kankintú": ["Kankintú"], "Besikó": ["Soloy"], "Müna": ["Chichica"], "Nole Duima": ["Cerro Iglesias"], "Ñürüm": ["Buenos Aires"] },
};
