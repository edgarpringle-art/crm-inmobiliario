"use client";

import { useState } from "react";
import { tr, type Lang } from "./i18n";
import { PROPERTY_TYPE_OPTIONS } from "./brand";
import { IconCheck } from "./icons";

export interface AlertPrefill { op?: string; type?: string; zone?: string; beds?: string; maxPrice?: string }

// "Avísame cuando haya algo así": saves the visitor's search as a client alert in the CRM (/api/alertas).
// Starts collapsed; opening it copies the current search filters into the form.
export default function AlertForm({ lang = "es", prefill = {}, dark = false }: { lang?: Lang; prefill?: AlertPrefill; dark?: boolean }) {
  const t = tr(lang);
  const a = t.alert;
  const empty = { name: "", phone: "", email: "", op: "COMPRA", type: "", zones: "", max: "", beds: "", website: "" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const start = () => {
    setForm((s) => ({
      ...s,
      op: prefill.op === "ALQUILER" ? "ALQUILER" : "COMPRA",
      type: prefill.type || "", zones: prefill.zone || "", beds: prefill.beds || "", max: prefill.maxPrice || "",
    }));
    setOpen(true);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.phone.replace(/\D/g, "").length < 7) { setError(a.required); setState("error"); return; }
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/alertas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, zones: form.zones.split(",").map((z) => z.trim()).filter(Boolean), lang }),
      });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setError(a.failed); setState("error");
    }
  }

  const box = dark ? "bg-[#1E1A15] text-white border-[#3A3128]" : "bg-[#F3ECDF] text-[#1E1A15] border-[#E9E0D0]";
  const muted = dark ? "text-[#CFC4B2]" : "text-[#6B6155]";
  if (state === "done") {
    return (
      <div className={`rounded-2xl border p-6 sm:p-8 text-center ${box}`}>
        <span className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#25D366] text-white flex items-center justify-center"><IconCheck className="w-6 h-6" /></span>
        <p className="text-xl mb-1" style={{ fontFamily: "'Cinzel', serif" }}>{a.done}</p>
        <p className={`text-sm ${muted}`}>{a.doneSub}</p>
      </div>
    );
  }

  const input = "w-full bg-white border border-[#E4D9C6] rounded-lg px-3.5 py-2.5 text-sm text-[#1E1A15] placeholder:text-[#9C9182] focus:outline-none focus:border-[#B8945F]";
  return (
    <div className={`relative rounded-2xl border p-6 sm:p-8 ${box}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-xl" style={{ fontFamily: "'Cinzel', serif" }}>{a.title}</p>
          <p className={`text-sm mt-1 ${muted}`}>{a.sub}</p>
        </div>
        {!open && (
          <button type="button" onClick={start}
            className="shrink-0 bg-[#B8945F] hover:bg-[#A4824F] text-white font-semibold px-6 py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors pi-shine">
            🔔 {a.open}
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pi-pop">
          <input className={input} placeholder={a.name} value={form.name} onChange={set("name")} maxLength={100} autoComplete="name" />
          <input className={input} placeholder={a.phone} value={form.phone} onChange={set("phone")} maxLength={30} type="tel" autoComplete="tel" />
          <input className={`${input} sm:col-span-2`} placeholder={a.email} value={form.email} onChange={set("email")} maxLength={150} type="email" autoComplete="email" />
          <select className={input} value={form.op} onChange={set("op")} aria-label={a.op}>
            <option value="COMPRA">{a.op}: {a.buy}</option>
            <option value="ALQUILER">{a.op}: {a.rent}</option>
          </select>
          <select className={input} value={form.type} onChange={set("type")} aria-label={a.type}>
            <option value="">{a.anyType}</option>
            {PROPERTY_TYPE_OPTIONS.filter((o) => o.value).map((o) => <option key={o.value} value={o.value}>{t.types[o.value] || o.label}</option>)}
          </select>
          <input className={input} placeholder={a.max} value={form.max} onChange={set("max")} inputMode="numeric" maxLength={12} />
          <input className={input} placeholder={a.beds} value={form.beds} onChange={set("beds")} inputMode="numeric" maxLength={2} />
          <input className={`${input} sm:col-span-2 lg:col-span-3`} placeholder={a.zones} value={form.zones} onChange={set("zones")} maxLength={200} />
          <button type="submit" disabled={state === "sending"}
            className="bg-[#25D366] hover:bg-[#1EBE5A] text-white font-semibold py-2.5 rounded-full text-xs uppercase tracking-[0.15em] transition-colors disabled:opacity-60">
            {state === "sending" ? a.sending : a.cta}
          </button>
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")}
            className="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true" />
          {state === "error" && <p className="text-xs text-red-500 sm:col-span-2 lg:col-span-4">{error}</p>}
          <p className={`text-[11px] sm:col-span-2 lg:col-span-4 ${muted}`}>{a.privacy}</p>
        </form>
      )}
    </div>
  );
}
