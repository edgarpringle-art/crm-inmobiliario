"use client";

import React, { useEffect, useState } from "react";

interface Propuesta {
  id: string;
  title: string;
  description: string | null;
  zona: string | null;
  price: number | null;
  currency: string | null;
  link: string | null;
  photos: string | null;
  status: string;
}

function parsePhotos(raw: string | null): string[] {
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch { return []; }
}

type Lang = "es" | "en";

const T = {
  es: {
    invalid: "Este enlace no es válido o expiró.", hello: "Hola",
    intro: "Estas son las opciones que encontré para ti. Marca las que te interesan y coordino la visita.",
    empty: "Aún no hay opciones. Te avisaré cuando agregue algunas.",
    liked: "Te interesan", discarded: "Descartadas", noPhotos: "Sin fotos", photo: "Foto",
    details: "Ver más detalles →", yes: "Me interesa", noThanks: "No, gracias", no: "No me interesa",
  },
  en: {
    invalid: "This link is invalid or has expired.", hello: "Hi",
    intro: "Here are the options I found for you. Mark the ones you like and I'll set up the viewing.",
    empty: "No options yet. I'll let you know when I add some.",
    liked: "You're interested", discarded: "Dismissed", noPhotos: "No photos", photo: "Photo",
    details: "See more details →", yes: "I'm interested", noThanks: "No, thanks", no: "Not interested",
  },
};

// English: our own site links go to the English page, and the auto-generated MLS specs are translated.
function enLink(link: string): string {
  return link.replace(/^(https?:\/\/(?:www\.)?panamainmo\.com)\/(?!en\/)/, "$1/en/");
}
function enText(text: string): string {
  return text.replace(/(\d+) rec/g, "$1 bd").replace(/(\d+) baños/g, "$1 baths");
}

function money(price: number | null, currency: string | null): string {
  if (price == null) return "";
  const sym = currency === "PAB" ? "B/." : currency === "EUR" ? "€" : "$";
  return `${sym}${price.toLocaleString("en-US")}`;
}

export default function VerPropuestasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // The first render is the loading spinner (same in both languages), so reading the URL here is hydration-safe.
  const [lang, setLang] = useState<Lang>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "es"
  );
  const t = T[lang];

  function switchLang(l: Lang) {
    setLang(l);
    const u = new URL(window.location.href);
    if (l === "en") u.searchParams.set("lang", "en"); else u.searchParams.delete("lang");
    window.history.replaceState(null, "", u.toString());
  }

  useEffect(() => {
    fetch(`/api/propuestas/public?clientId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setNotFound(true); return; }
        setName(d.clientFirstName || "");
        setPropuestas(Array.isArray(d.propuestas) ? d.propuestas : []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function respond(pid: string, status: string) {
    setPropuestas((prev) => prev.map((p) => (p.id === pid ? { ...p, status } : p)));
    try {
      await fetch("/api/propuestas/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pid, status }),
      });
    } catch { /* optimistic; ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-stone-200 border-t-stone-700" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6 text-center">
        <p className="text-stone-500">{t.invalid}</p>
      </div>
    );
  }

  const pendientes = propuestas.filter((p) => p.status === "PENDIENTE");
  const interesado = propuestas.filter((p) => p.status === "INTERESADO");
  const descartado = propuestas.filter((p) => p.status === "DESCARTADO");

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Josefin Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="relative bg-stone-900 text-white px-5 py-6 text-center">
        <div className="absolute top-3 right-3 flex rounded-full border border-white/30 overflow-hidden text-xs font-semibold">
          {(["es", "en"] as Lang[]).map((l) => (
            <button key={l} onClick={() => switchLang(l)} aria-pressed={lang === l}
              className={`px-3 py-1 ${lang === l ? "bg-white text-stone-900" : "text-white/80 hover:text-white"}`}>
              {l === "es" ? "ES" : "EN"}
            </button>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/panamainmo-logo-blanco.png" alt="PanamaInmo — Real Estate & Legal Advisory" className="h-10 w-auto mx-auto" />
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold text-stone-900">
            {name ? `${t.hello} ${name} 👋` : `${t.hello} 👋`}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {t.intro}
          </p>
        </div>

        {propuestas.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm bg-white rounded-2xl border border-stone-100">
            {t.empty}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pendientes (need decision) */}
            {pendientes.length > 0 && (
              <div className="space-y-4">
                {pendientes.map((p) => <Card key={p.id} p={p} lang={lang} onRespond={respond} />)}
              </div>
            )}

            {/* Interesado */}
            {interesado.length > 0 && (
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">✅ {t.liked} ({interesado.length})</p>
                <div className="space-y-4">
                  {interesado.map((p) => <Card key={p.id} p={p} lang={lang} onRespond={respond} />)}
                </div>
              </div>
            )}

            {/* Descartado */}
            {descartado.length > 0 && (
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">{t.discarded} ({descartado.length})</p>
                <div className="space-y-4 opacity-60">
                  {descartado.map((p) => <Card key={p.id} p={p} lang={lang} onRespond={respond} />)}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-stone-400 mt-10 pb-6">
          PanamaInmo · Real Estate &amp; Legal Advisory
        </p>
      </div>
    </div>
  );
}

function PhotoCarousel({ photos, lang }: { photos: string[]; lang: Lang }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      setActive(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * scrollRef.current.offsetWidth, behavior: "smooth" });
  };

  if (photos.length === 0) {
    return <div className="w-full h-48 bg-stone-100 flex items-center justify-center text-stone-300 text-sm">{T[lang].noPhotos}</div>;
  }

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`${T[lang].photo} ${i + 1}`}
            className="w-full aspect-[4/3] object-cover flex-shrink-0 snap-center"
            style={{ minWidth: "100%" }}
          />
        ))}
      </div>

      {photos.length > 1 && (
        <>
          {/* Counter */}
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {active + 1} / {photos.length}
          </div>

          {/* Arrows */}
          {active > 0 && (
            <button onClick={() => goTo(active - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center text-lg">‹</button>
          )}
          {active < photos.length - 1 && (
            <button onClick={() => goTo(active + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center text-lg">›</button>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} className={`w-2 h-2 rounded-full transition-colors ${i === active ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ p, lang, onRespond }: { p: Propuesta; lang: Lang; onRespond: (id: string, status: string) => void }) {
  const photos = parsePhotos(p.photos);
  const t = T[lang];
  const description = p.description && lang === "en" ? enText(p.description) : p.description;
  const link = p.link && lang === "en" ? enLink(p.link) : p.link;
  const isYes = p.status === "INTERESADO";
  const isNo = p.status === "DESCARTADO";

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <PhotoCarousel photos={photos} lang={lang} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-stone-900 leading-snug">{p.title}</h3>
            {p.zona && <p className="text-sm text-stone-500 mt-0.5">{p.zona}</p>}
          </div>
          {p.price != null && (
            <p className="text-lg font-bold text-stone-900 whitespace-nowrap" style={{ fontFamily: "'Cinzel', serif" }}>
              {money(p.price, p.currency)}
            </p>
          )}
        </div>

        {description && (
          <p className="text-sm text-stone-600 mt-3 whitespace-pre-wrap leading-relaxed">{description}</p>
        )}

        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-blue-600 underline mt-3">
            {t.details}
          </a>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => onRespond(p.id, isYes ? "PENDIENTE" : "INTERESADO")}
            className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
              isYes ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            {isYes ? `✅ ${t.yes}` : `👍 ${t.yes}`}
          </button>
          <button
            onClick={() => onRespond(p.id, isNo ? "PENDIENTE" : "DESCARTADO")}
            className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
              isNo ? "bg-stone-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            {isNo ? t.noThanks : `👎 ${t.no}`}
          </button>
        </div>
      </div>
    </div>
  );
}
