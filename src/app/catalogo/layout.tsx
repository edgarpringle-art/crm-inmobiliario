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
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
