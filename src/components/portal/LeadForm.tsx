"use client";

import { useState } from "react";
import { tr, type Lang } from "./i18n";

export default function LeadForm({ propertyId, waHref, title, cta, lang = "es" }: {
  propertyId?: string; waHref: string; title?: string; cta?: string; lang?: Lang;
}) {
  const t = tr(lang).lead;
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      setError(t.required); setState("error"); return;
    }
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId: propertyId || "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error");
      setState("done");
    } catch (err) {
      setError(lang === "en" ? t.failed : err instanceof Error ? err.message : t.failed); setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="bg-white border border-[#E9E0D0] rounded-2xl p-6 text-center">
        <p className="text-lg font-medium text-[#1E1A15] mb-2" style={{ fontFamily: "'Cinzel', serif" }}>{t.thanks}</p>
        <p className="text-sm text-[#6B6155] mb-4">{t.received}</p>
        <a href={waHref} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#1EBE5A] text-white font-semibold w-full py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
          {t.waNow}
        </a>
      </div>
    );
  }

  const input = "w-full bg-[#FBF8F3] border border-[#E4D9C6] rounded-lg px-3.5 py-2.5 text-sm text-[#1E1A15] placeholder:text-[#9C9182] focus:outline-none focus:border-[#B8945F] focus:bg-white transition-colors";

  return (
    <form onSubmit={submit} className="relative bg-white border border-[#E9E0D0] rounded-2xl p-6 space-y-3 shadow-[0_10px_30px_-18px_rgba(30,26,21,0.25)]">
      <p className="text-[11px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-1">{title || t.title}</p>
      <input className={input} placeholder={t.name} value={form.name} onChange={set("name")} maxLength={100} autoComplete="name" />
      <input className={input} placeholder={t.phone} value={form.phone} onChange={set("phone")} maxLength={30} type="tel" autoComplete="tel" />
      <input className={input} placeholder={t.email} value={form.email} onChange={set("email")} maxLength={150} type="email" autoComplete="email" />
      <textarea className={input} rows={3} placeholder={t.message} value={form.message} onChange={set("message")} maxLength={2000} />
      {/* Honeypot anti-spam */}
      <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")}
        className="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true" />
      {state === "error" && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={state === "sending"}
        className="w-full bg-[#1E1A15] hover:bg-[#B8945F] text-white font-semibold py-3 rounded-full text-xs uppercase tracking-[0.15em] transition-colors disabled:opacity-60 cursor-pointer">
        {state === "sending" ? t.sending : cta || t.cta}
      </button>
      <p className="text-[11px] text-[#9C9182] leading-snug">{t.privacy}</p>
    </form>
  );
}
