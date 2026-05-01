import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edgar Pringle Real Estate · Propiedades en Panamá",
  description: "Asesoría inmobiliaria profesional en Panamá. Compra, venta y alquiler de apartamentos, casas, penthouses y locales. Licencia PN5016.",
  openGraph: {
    title: "Edgar Pringle Real Estate · Panamá",
    description: "Propiedades en venta y alquiler en Panamá. Apartamentos, casas, penthouses.",
    siteName: "Edgar Pringle Real Estate",
    type: "website",
  },
  icons: {
    icon: "/logo.svg",
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
