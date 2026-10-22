"use client";

import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Lang } from "./i18n";

// ES | EN switch: remembers the choice for a year and re-renders the page in that language.
export default function LangToggle({ lang, className = "" }: { lang: Lang; className?: string }) {
  const router = useRouter();
  const pick = (l: Lang) => {
    if (l === lang) return;
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  const btn = (l: Lang) =>
    `px-2 py-0.5 rounded-full transition-colors ${l === lang ? "bg-[#B8945F] text-white" : "hover:text-[#B8945F]"}`;
  return (
    <div className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tracking-[0.12em] ${className}`} role="group" aria-label="Language / Idioma">
      <button type="button" onClick={() => pick("es")} className={btn("es")} aria-pressed={lang === "es"}>ES</button>
      <span className="opacity-40">|</span>
      <button type="button" onClick={() => pick("en")} className={btn("en")} aria-pressed={lang === "en"}>EN</button>
    </div>
  );
}
