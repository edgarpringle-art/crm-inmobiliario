"use client";

import { useState } from "react";
import { tr, type Lang } from "@/components/portal/i18n";
import { PROPERTY_TYPE_OPTIONS } from "@/components/portal/brand";

export default function SellForm({ lang = "es" }: { lang?: Lang }) {
  const t = tr(lang);
  const f = t.sell.form;
  const [form, setForm] = useState({
    name: "", phone: "", email: "", operation: "VENTA", propertyType: "APARTAMENTO", zone: "",
    area: "", bedrooms: "", expectedPrice: "", message: "", website: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.phone.replace(/\D/g, "").length < 7) { setError(f.required); setState("error"); return; }
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/valoracion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyType: t.types[form.propertyType] || form.propertyType }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setError(f.failed); setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="bg-white border border-[#E9E0D0] rounded-2xl p-8 text-center">
        <p className="text-2xl text-[#1E1A15] mb-2" style={{ fontFamily: "'Cinzel', serif" }}>{f.thanks}</p>
        <p className="text-sm text-[#6B6155]">{f.received}</p>
      </div>
    );
  }

  const input = "w-full bg-[#FBF8F3] border border-[#E4D9C6] rounded-lg px-3.5 py-2.5 text-sm text-[#1E1A15] placeholder:text-[#9C9182] focus:outline-none focus:border-[#B8945F] focus:bg-white transition-colors";
  const ops = [["VENTA", f.opSell], ["ALQUILER", f.opRent], ["AMBOS", f.opBoth]] as const;
  return (
    <form onSubmit={submit} className="relative bg-white border border-[#E9E0D0] rounded-2xl p-6 sm:p-8 space-y-3 shadow-[0_10px_30px_-18px_rgba(30,26,21,0.25)]">
      <p className="text-[11px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-2">{f.title}</p>
      <div>
        <p className="text-xs text-[#6B6155] mb-1.5">{f.op}</p>
        <div className="grid grid-cols-3 gap-2">
          {ops.map(([v, label]) => (
            <button key={v} type="button" onClick={() => setForm((s) => ({ ...s, operation: v }))}
              className={`py-2.5 rounded-full text-xs font-semibold uppercase tracking-[0.12em] border transition-colors ${form.operation === v ? "bg-[#1E1A15] text-white border-[#1E1A15]" : "border-[#E4D9C6] text-[#4A4238] hover:border-[#B8945F]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input className={input} placeholder={f.name} value={form.name} onChange={set("name")} maxLength={100} autoComplete="name" />
        <input className={input} placeholder={f.phone} value={form.phone} onChange={set("phone")} maxLength={30} type="tel" autoComplete="tel" />
        <input className={`${input} sm:col-span-2`} placeholder={f.email} value={form.email} onChange={set("email")} maxLength={150} type="email" autoComplete="email" />
        <select className={input} value={form.propertyType} onChange={set("propertyType")} aria-label={f.type}>
          {PROPERTY_TYPE_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{t.types[o.value] || o.label}</option>)}
        </select>
        <input className={input} placeholder={f.zone} value={form.zone} onChange={set("zone")} maxLength={120} />
        <input className={input} placeholder={f.area} value={form.area} onChange={set("area")} inputMode="numeric" maxLength={10} />
        <input className={input} placeholder={f.beds} value={form.bedrooms} onChange={set("bedrooms")} inputMode="numeric" maxLength={3} />
        <input className={`${input} sm:col-span-2`} placeholder={f.expected} value={form.expectedPrice} onChange={set("expectedPrice")} inputMode="numeric" maxLength={15} />
      </div>
      <textarea className={input} rows={3} placeholder={f.message} value={form.message} onChange={set("message")} maxLength={2000} />
      <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")}
        className="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true" />
      {state === "error" && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={state === "sending"}
        className="w-full bg-[#B8945F] hover:bg-[#A4824F] text-white font-semibold py-3.5 rounded-full text-xs uppercase tracking-[0.15em] transition-colors disabled:opacity-60 pi-shine">
        {state === "sending" ? f.sending : f.cta}
      </button>
      <p className="text-[11px] text-[#9C9182] leading-snug">{f.privacy}</p>
    </form>
  );
}
