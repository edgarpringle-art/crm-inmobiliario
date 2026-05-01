import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "react-hot-toast";
import { cookies, headers } from "next/headers";
import { verifySession, COOKIE_SESSION } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Inmobiliario | E. Pringle Real Estate",
  description: "Sistema de gestión de clientes y propiedades inmobiliarias",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const sessionCookie = cookieStore.get(COOKIE_SESSION)?.value;
  const user = sessionCookie ? await verifySession(sessionCookie) : null;

  // Show app shell (sidebar + padded main) only for authenticated non-public routes
  const isPublic =
    pathname.startsWith("/p/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/catalogo");
  const showShell = !!user && !isPublic;

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex bg-background">
        {showShell && <Sidebar />}
        {showShell ? (
          <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 overflow-auto pt-16 lg:pt-8">
            <div className="max-w-7xl mx-auto animate-slide-in">
              {children}
            </div>
          </main>
        ) : (
          <main className="flex-1">{children}</main>
        )}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: "12px", padding: "14px 20px", fontSize: "14px", fontWeight: "500" },
            success: { style: { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" } },
            error: { style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" } },
          }}
        />
      </body>
    </html>
  );
}
