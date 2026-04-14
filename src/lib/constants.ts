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
  { value: "DOP", label: "DOP (RD$)" },
  { value: "EUR", label: "EUR (€)" },
];

export const SEARCH_TYPES = [
  { value: "COMPRA", label: "Compra" },
  { value: "ALQUILER", label: "Alquiler" },
  { value: "COMPRA_Y_ALQUILER", label: "Compra y Alquiler" },
];

export function formatCurrency(amount: number | null | undefined, currency: string = "USD"): string {
  if (amount == null) return "—";
  const symbols: Record<string, string> = { USD: "$", DOP: "RD$", EUR: "€" };
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getStatusColor(statuses: { value: string; color: string }[], value: string): string {
  return statuses.find((s) => s.value === value)?.color || "bg-gray-100 text-gray-800";
}

export function getLabel(options: { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label || value;
}
