"use client";

import { useState, useRef, useEffect } from "react";
import { searchLocations } from "@/lib/locations";
import { HiLocationMarker, HiSearch } from "react-icons/hi";

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function LocationSelect({ value, onChange, placeholder = "Buscar sector, ciudad...", label }: LocationSelectProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ReturnType<typeof searchLocations>>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInput(val: string) {
    setQuery(val);
    onChange(val);
    const r = searchLocations(val);
    setResults(r);
    setOpen(r.length > 0);
  }

  function handleSelect(val: string) {
    setQuery(val);
    onChange(val);
    setOpen(false);
  }

  const typeIcons: Record<string, string> = {
    province: "Provincia",
    city: "Ciudad",
    sector: "Sector",
  };

  const typeColors: Record<string, string> = {
    province: "bg-blue-100 text-blue-700",
    city: "bg-purple-100 text-purple-700",
    sector: "bg-green-100 text-green-700",
  };

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <div className="relative">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.value}-${i}`}
              onClick={() => handleSelect(r.value)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
            >
              <HiLocationMarker className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">{r.value}</span>
                {r.parent && (
                  <span className="text-xs text-gray-400 ml-1">- {r.parent}</span>
                )}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[r.type]}`}>
                {typeIcons[r.type]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
