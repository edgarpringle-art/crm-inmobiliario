import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Propiedades en Venta y Alquiler · E. Pringle Real Estate",
  description: "Explora nuestro catálogo de propiedades disponibles en Panamá — apartamentos, casas, penthouses, locales y más.",
  openGraph: {
    title: "Catálogo de Propiedades · E. Pringle Real Estate",
    description: "Propiedades en venta y alquiler en Panamá",
    siteName: "E. Pringle Real Estate",
  },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
