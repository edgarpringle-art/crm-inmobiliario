import { SERIF } from "./brand";

// Banner for inner pages: photo + warm overlay + eyebrow/title.
export default function PageHero({ eyebrow, title, subtitle, image }: { eyebrow: string; title: string; subtitle?: string; image: string }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1E1A15]/90 via-[#1E1A15]/70 to-[#3A2C1C]/50" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-10 bg-[#D9BE8F]" />
          <p className="text-[#D9BE8F] text-[11px] font-semibold uppercase tracking-[0.35em]">{eyebrow}</p>
        </div>
        <h1 className="text-4xl sm:text-5xl text-white font-medium max-w-3xl leading-tight" style={SERIF}>{title}</h1>
        {subtitle && <p className="text-[#E6DCCB] mt-4 max-w-2xl text-sm sm:text-lg leading-relaxed">{subtitle}</p>}
      </div>
    </section>
  );
}
