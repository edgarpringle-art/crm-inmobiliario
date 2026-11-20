"use client";

import { HiPlus, HiTrash } from "react-icons/hi";
import { emptyModel, type UnitModel } from "@/lib/unitModels";

const cell = "w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const COLS: { key: keyof UnitModel; label: string; ph: string; num?: boolean }[] = [
  { key: "name", label: "Modelo", ph: "Modelo A" },
  { key: "bedrooms", label: "Rec.", ph: "2", num: true },
  { key: "bathrooms", label: "Baños", ph: "2.5", num: true },
  { key: "areaMin", label: "m² desde", ph: "78", num: true },
  { key: "areaMax", label: "m² hasta", ph: "85", num: true },
  { key: "priceMin", label: "Precio desde", ph: "294500", num: true },
  { key: "priceMax", label: "Precio hasta", ph: "350000", num: true },
];

export default function UnitModelsEditor({ models, onChange }: { models: UnitModel[]; onChange: (m: UnitModel[]) => void }) {
  const set = (i: number, key: keyof UnitModel, v: string) => onChange(models.map((m, j) => (j === i ? { ...m, [key]: v } : m)));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-gray-800">Modelos / tipologías</p>
        <button type="button" onClick={() => onChange([...models, emptyModel()])}
          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          <HiPlus className="w-4 h-4" /> Agregar modelo
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-3">Opcional. Si dejas vacío el rango del proyecto, se calcula solo con los modelos. Deja &quot;hasta&quot; vacío si es un solo valor.</p>
      {models.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin modelos cargados.</p>
      ) : (
        <div className="space-y-3">
          {models.map((m, i) => (
            <div key={i} className="grid grid-cols-2 md:grid-cols-[1.4fr_0.6fr_0.6fr_0.8fr_0.8fr_1fr_1fr_auto] gap-2 items-end p-3 md:p-0 border md:border-0 border-gray-200 rounded-lg">
              {COLS.map((c) => (
                <label key={c.key} className={c.key === "name" ? "col-span-2 md:col-span-1" : ""}>
                  <span className={`block text-[11px] text-gray-500 mb-0.5 ${i > 0 ? "md:hidden" : ""}`}>{c.label}</span>
                  <input className={cell} type={c.num ? "number" : "text"} step="any" placeholder={c.ph}
                    value={m[c.key]} onChange={(e) => set(i, c.key, e.target.value)} />
                </label>
              ))}
              <button type="button" onClick={() => onChange(models.filter((_, j) => j !== i))} title="Quitar modelo"
                className="col-span-2 md:col-span-1 justify-self-end p-2 text-red-500 hover:bg-red-50 rounded-md">
                <HiTrash className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
