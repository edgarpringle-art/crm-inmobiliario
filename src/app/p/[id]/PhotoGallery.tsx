"use client";

import { useState, useEffect, useCallback } from "react";

export default function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!photos.length) return null;

  const openAt = (i: number) => { setCurrent(i); setOpen(true); };

  return (
    <>
      {/* Grid preview */}
      <div
        className={`relative cursor-pointer ${photos.length === 1 ? "" : "grid grid-cols-2 grid-rows-2"} max-h-72 sm:max-h-96 overflow-hidden`}
        onClick={() => openAt(0)}
      >
        {photos.length === 1 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0]} alt={title} className="w-full h-72 sm:h-96 object-cover" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0]} alt={`${title} 1`} className="row-span-2 w-full h-full object-cover" />
            {photos[1] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[1]} alt={`${title} 2`} className="w-full h-full object-cover" />
            )}
            {photos[2] && (
              <div className="relative w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[2]} alt={`${title} 3`} className="w-full h-full object-cover" />
                {photos.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">+{photos.length - 3}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {/* "Ver todas" hint */}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg pointer-events-none">
          {photos.length} foto{photos.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Lightbox modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={() => setOpen(false)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <span className="text-white/70 text-sm">{current + 1} / {photos.length}</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-3xl leading-none font-light"
            >
              ×
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 flex items-center justify-center px-12 relative" onClick={(e) => e.stopPropagation()}>
            {/* Prev */}
            {photos.length > 1 && (
              <button
                onClick={prev}
                className="absolute left-2 sm:left-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
              >
                ‹
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[current]}
              alt={`${title} ${current + 1}`}
              className="max-h-full max-w-full object-contain rounded-lg"
              style={{ maxHeight: "calc(100vh - 140px)" }}
            />
            {/* Next */}
            {photos.length > 1 && (
              <button
                onClick={next}
                className="absolute right-2 sm:right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl transition-colors"
              >
                ›
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 px-4 py-3 overflow-x-auto justify-center" onClick={(e) => e.stopPropagation()}>
              {photos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === current ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
