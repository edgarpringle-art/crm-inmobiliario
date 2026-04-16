export const CLIENT_TYPES = [
  { value: "COMPRADOR", label: "Comprador" },
  { value: "VENDEDOR", label: "Vendedor" },
  { value: "ARRENDATARIO", label: "Arrendatario" },
  { value: "PROPIETARIO", label: "Propietario" },
  { value: "INVERSOR", label: "Inversor" },
];

export const CLIENT_SOURCES = [
  { value: "REFERIDO", label: "Referido" },
  { value: "PORTAL_WEB", label: "Portal Web" },
  { value: "REDES_SOCIALES", label: "Redes Sociales" },
  { value: "LLAMADA", label: "Llamada" },
  { value: "OFICINA", label: "Oficina" },
  { value: "OTRO", label: "Otro" },
];

export const CLIENT_STATUSES = [
  { value: "ACTIVO", label: "Activo", color: "bg-green-100 text-green-800" },
  { value: "PROSPECTO", label: "Prospecto", color: "bg-blue-100 text-blue-800" },
  { value: "INACTIVO", label: "Inactivo", color: "bg-gray-100 text-gray-800" },
  { value: "CERRADO", label: "Cerrado", color: "bg-purple-100 text-purple-800" },
];

export const PROPERTY_TYPES = [
  { value: "APARTAMENTO", label: "Apartamento" },
  { value: "CASA", label: "Casa" },
  { value: "LOCAL", label: "Local Comercial" },
  { value: "OFICINA", label: "Oficina" },
  { value: "TERRENO", label: "Terreno" },
  { value: "NAVE", label: "Nave Industrial" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "VILLA", label: "Villa" },
  { value: "OTRO", label: "Otro" },
];

export const OPERATION_TYPES = [
  { value: "VENTA", label: "Venta" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "VENTA_Y_ALQUILER", label: "Venta y Alquiler" },
];

export const PROPERTY_STATUSES = [
  { value: "DISPONIBLE", label: "Disponible", color: "bg-green-100 text-green-800" },
  { value: "RESERVADA", label: "Reservada", color: "bg-yellow-100 text-yellow-800" },
  { value: "VENDIDA", label: "Vendida", color: "bg-blue-100 text-blue-800" },
  { value: "ALQUILADA", label: "Alquilada", color: "bg-purple-100 text-purple-800" },
  { value: "NO_DISPONIBLE", label: "No Disponible", color: "bg-red-100 text-red-800" },
];

export const DEAL_TYPES = [
  { value: "VENTA", label: "Venta" },
  { value: "ALQUILER", label: "Alquiler" },
];

export const DEAL_STATUSES = [
  { value: "EN_PROCESO", label: "En Proceso", color: "bg-yellow-100 text-yellow-800" },
  { value: "PENDIENTE_FIRMA", label: "Pendiente Firma", color: "bg-orange-100 text-orange-800" },
  { value: "PENDIENTE_PAGO", label: "Pendiente Pago", color: "bg-red-100 text-red-800" },
  { value: "CERRADO", label: "Cerrado", color: "bg-green-100 text-green-800" },
  { value: "CANCELADO", label: "Cancelado", color: "bg-gray-100 text-gray-800" },
];

export const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "PAB", label: "PAB (B/.)" },
  { value: "EUR", label: "EUR (€)" },
];

export const SEARCH_TYPES = [
  { value: "COMPRA", label: "Compra" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "COMPRA_Y_ALQUILER", label: "Compra y Alquiler" },
];

export const AGENTS = [
  { value: "EDGAR", label: "Edgar Pringle", initials: "EP", color: "from-blue-500 to-blue-600" },
  { value: "ANA_LORENA", label: "Ana Lorena Chanis", initials: "AC", color: "from-purple-500 to-purple-600" },
  { value: "AMBOS", label: "Ambos", initials: "EP/AC", color: "from-indigo-500 to-pink-500" },
];

export const EXPENSE_CATEGORIES = [
  { value: "MARKETING", label: "Marketing" },
  { value: "OFICINA", label: "Oficina" },
  { value: "TRANSPORTE", label: "Transporte" },
  { value: "LEGAL", label: "Legal/Notarial" },
  { value: "TECNOLOGIA", label: "Tecnología" },
  { value: "SERVICIOS", label: "Servicios" },
  { value: "OTRO", label: "Otro" },
];

export const MONTHS = [
  { value: 1, label: "Enero" }, { value: 2, label: "Febrero" }, { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" }, { value: 5, label: "Mayo" }, { value: 6, label: "Junio" },
  { value: 7, label: "Julio" }, { value: 8, label: "Agosto" }, { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" }, { value: 11, label: "Noviembre" }, { value: 12, label: "Diciembre" },
];

export function formatCurrency(amount: number | null | undefined, currency: string = "USD"): string {
  if (amount == null) return "—";
  const symbols: Record<string, string> = { USD: "$", PAB: "B/.", EUR: "€" };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  // If it's a YYYY-MM-DD string, parse as local date (avoid UTC shift in Panamá/UTC-5)
  let d: Date;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, day] = date.split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(date);
  }
  return d.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/Panama",
  });
}

export function getStatusColor(statuses: { value: string; color: string }[], value: string): string {
  return statuses.find((s) => s.value === value)?.color || "bg-gray-100 text-gray-800";
}

export function getLabel(options: { value: string | number; label: string }[], value: string | number): string {
  return options.find((o) => o.value === value)?.label || String(value);
}
