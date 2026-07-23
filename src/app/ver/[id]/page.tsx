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
        <p className="text-stone-500">Este enlace no es válido o expiró.</p>
      </div>
    );
  }

  const pendientes = propuestas.filter((p) => p.status === "PENDIENTE");
  const interesado = propuestas.filter((p) => p.status === "INTERESADO");
  const descartado = propuestas.filter((p) => p.status === "DESCARTADO");

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Josefin Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="bg-stone-900 text-white px-5 py-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="EP" className="w-11 h-11 mx-auto mb-2 invert" />
        <h1 className="text-lg font-semibold tracking-[0.15em]" style={{ fontFamily: "'Cinzel', serif" }}>EDGAR PRINGLE</h1>
        <p className="text-[11px] text-stone-400 uppercase tracking-[0.2em]">Real Estate · Panamá</p>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="mb-5 text-center">
          <h2 className="text-xl font-semibold text-stone-900">
            {name ? `Hola ${name} 👋` : "Hola 👋"}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Estas son las opciones que encontré para ti. Marca las que te interesan y coordino la visita.
          </p>
        </div>

        {propuestas.length === 0 ? (
          <div className="text-center py-16 text-stone-400 text-sm bg-white rounded-2xl border border-stone-100">
            Aún no hay opciones. Te avisaré cuando agregue algunas.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pendientes (need decision) */}
            {pendientes.length > 0 && (
              <div className="space-y-4">
                {pendientes.map((p) => <Card key={p.id} p={p} onRespond={respond} />)}
              </div>
            )}

            {/* Interesado */}
            {interesado.length > 0 && (
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">✅ Te interesan ({interesado.length})</p>
                <div className="space-y-4">
                  {interesado.map((p) => <Card key={p.id} p={p} onRespond={respond} />)}
                </div>
              </div>
            )}

            {/* Descartado */}
            {descartado.length > 0 && (
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Descartadas ({descartado.length})</p>
                <div className="space-y-4 opacity-60">
                  {descartado.map((p) => <Card key={p.id} p={p} onRespond={respond} />)}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-stone-400 mt-10 pb-6">
          Edgar Pringle Real Estate · Panamá
        </p>
      </div>
    </div>
  );
}

function PhotoCarousel({ photos }: { photos: string[] }) {
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
    return <div className="w-full h-48 bg-stone-100 flex items-center justify-center text-stone-300 text-sm">Sin fotos</div>;
  }

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={url}
            alt={`Foto ${i + 1}`}
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

function Card({ p, onRespond }: { p: Propuesta; onRespond: (id: string, status: string) => void }) {
  const photos = parsePhotos(p.photos);
  const isYes = p.status === "INTERESADO";
  const isNo = p.status === "DESCARTADO";

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <PhotoCarousel photos={photos} />

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

        {p.description && (
          <p className="text-sm text-stone-600 mt-3 whitespace-pre-wrap leading-relaxed">{p.description}</p>
        )}

        {p.link && (
          <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-blue-600 underline mt-3">
            Ver más detalles →
          </a>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => onRespond(p.id, isYes ? "PENDIENTE" : "INTERESADO")}
            className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
              isYes ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            {isYes ? "✅ Me interesa" : "👍 Me interesa"}
          </button>
          <button
            onClick={() => onRespond(p.id, isNo ? "PENDIENTE" : "DESCARTADO")}
            className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
              isNo ? "bg-stone-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200"
            }`}
          >
            {isNo ? "No, gracias" : "👎 No me interesa"}
          </button>
        </div>
      </div>
    </div>
  );
}
