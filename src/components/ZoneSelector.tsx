"use client";

import { useState, useRef, useEffect } from "react";
import { ZONAS } from "@/lib/zonas";

interface Props {
  value: string[];
  onChange: (zones: string[]) => void;
  maxSelect?: number;
  placeholder?: string;
}

export default function ZoneSelector({
  value,
  onChange,
  maxSelect = 5,
  placeholder = "Seleccionar zonas...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const q = filter.toLowerCase();
  const filtered = ZONAS.map((g) => ({
    ...g,
    zones: g.zones.filter((z) => !q || z.toLowerCase().includes(q)),
  })).filter((g) => g.zones.length > 0);

  function toggle(zone: string) {
    if (value.includes(zone)) {
      onChange(value.filter((z) => z !== zone));
    } else if (value.length < maxSelect) {
      onChange([...value, zone]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger box */}
      <div
        className={`min-h-[42px] w-full px-3 py-2 border rounded-lg cursor-pointer flex flex-wrap gap-1.5 transition-colors ${
          open
            ? "border-blue-500 ring-2 ring-blue-500"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => setOpen(!open)}
      >
        {value.length === 0 ? (
          <span className="text-gray-400 text-sm self-center">{placeholder}</span>
        ) : (
          value.map((z) => (
            <span
              key={z}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full"
            >
              {z}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggle(z); }}
                className="hover:text-blue-600 leading-none"
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {/* Search + counter */}
          <div className="sticky top-0 bg-white px-3 py-2 border-b border-gray-100 space-y-1">
            <input
              autoFocus
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar zona..."
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[10px] text-gray-400">
              {value.length}/{maxSelect} zonas seleccionadas
              {value.length >= maxSelect && (
                <span className="text-amber-600 font-semibold ml-1">— límite alcanzado</span>
              )}
            </p>
          </div>

          {/* Zone groups */}
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin resultados</p>
          ) : (
            filtered.map((g) => (
              <div key={g.group}>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2.5 pb-1 bg-gray-50/80">
                  {g.group}
                </p>
                {g.zones.map((z) => {
                  const checked = value.includes(z);
                  const disabled = !checked && value.length >= maxSelect;
                  return (
                    <label
                      key={z}
                      className={`flex items-center gap-2.5 px-3 py-1.5 hover:bg-blue-50 cursor-pointer transition-colors ${
                        disabled ? "opacity-40 cursor-not-allowed" : ""
                      } ${checked ? "bg-blue-50/60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(z)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${checked ? "text-blue-800 font-medium" : "text-gray-700"}`}>
                        {z}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
