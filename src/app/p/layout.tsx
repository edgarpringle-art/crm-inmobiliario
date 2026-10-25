import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import WebTracker from "@/components/portal/WebTracker";
import WaGate from "@/components/portal/WaGate";
import { ScrollReveal } from "@/components/portal/Motion";
import { MOTION_BOOT } from "@/components/portal/motionBoot";

export const metadata: Metadata = {
  metadataBase: new URL("https://panamainmo.com"),
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Josefin+Sans:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT }} />
      {children}
      <ScrollReveal />
      <WaGate />
      <WebTracker />
      <Analytics />
    </>
  );
}
