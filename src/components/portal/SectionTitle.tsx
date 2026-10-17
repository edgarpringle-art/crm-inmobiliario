import { SERIF } from "./brand";

// Eyebrow + serif title with the gold rule used in the logo.
export default function SectionTitle({
  eyebrow, title, subtitle, align = "center", dark = false,
}: { eyebrow: string; title: string; subtitle?: string; align?: "center" | "left"; dark?: boolean }) {
  const center = align === "center";
  return (
    <div className={center ? "text-center" : ""}>
      <div className={`flex items-center gap-3 mb-3 ${center ? "justify-center" : ""}`}>
        <span className="h-px w-8 bg-[#B8945F]" />
        <p className={`text-[11px] font-semibold uppercase tracking-[0.35em] ${dark ? "text-[#D9BE8F]" : "text-[#8A6A3A]"}`}>{eyebrow}</p>
        {center && <span className="h-px w-8 bg-[#B8945F]" />}
      </div>
      <h2 className={`text-3xl sm:text-4xl font-medium leading-tight ${dark ? "text-white" : "text-[#1E1A15]"}`} style={SERIF}>{title}</h2>
      {subtitle && <p className={`mt-3 text-sm sm:text-base max-w-2xl ${center ? "mx-auto" : ""} ${dark ? "text-[#CFC4B2]" : "text-[#6B6155]"}`}>{subtitle}</p>}
    </div>
  );
}
