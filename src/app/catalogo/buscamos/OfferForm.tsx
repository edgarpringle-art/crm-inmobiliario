"use client";

import { useState } from "react";
import { tr, type Lang } from "@/components/portal/i18n";

// Collapsible form on each wanted card: a broker/owner sends a property for that search.
export default function OfferForm({ code, lang }: { code: string; lang: Lang }) {
  const t = tr(lang).wanted;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", link: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) { setError(t.f.required); setState("error"); return; }
    if (!form.link.trim() && !form.message.trim()) { setError(t.f.needProp); setState("error"); return; }
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/buscamos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error");
      setState("done");
    } catch (err) {
      setError(lang === "en" ? t.f.failed : err instanceof Error ? err.message : t.f.failed); setState("error");
    }
  }

  if (state === "done") return <p className="mt-3 text-sm text-[#5C7A4A] bg-[#F1F5EC] rounded-xl px-4 py-3">{t.f.thanks}</p>;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full border border-[#E4D9C6] hover:border-[#B8945F] text-[#1E1A15] py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors cursor-pointer">
        {t.form}
      </button>
    );
  }

  const input = "w-full bg-[#FBF8F3] border border-[#E4D9C6] rounded-lg px-3 py-2 text-sm text-[#1E1A15] placeholder:text-[#9C9182] focus:outline-none focus:border-[#B8945F] focus:bg-white transition-colors";
  return (
    <form onSubmit={submit} className="relative mt-1 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input className={input} placeholder={t.f.name} value={form.name} onChange={set("name")} maxLength={100} autoComplete="name" />
        <input className={input} placeholder={t.f.company} value={form.company} onChange={set("company")} maxLength={100} autoComplete="organization" />
        <input className={input} placeholder={t.f.phone} value={form.phone} onChange={set("phone")} maxLength={30} type="tel" autoComplete="tel" />
        <input className={input} placeholder={t.f.email} value={form.email} onChange={set("email")} maxLength={150} type="email" autoComplete="email" />
      </div>
      <input className={input} placeholder={t.f.link} value={form.link} onChange={set("link")} maxLength={500} />
      <textarea className={input} rows={2} placeholder={t.f.message} value={form.message} onChange={set("message")} maxLength={2000} />
      <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")}
        className="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true" />
      {state === "error" && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={state === "sending"}
        className="w-full bg-[#1E1A15] hover:bg-[#B8945F] text-white py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors disabled:opacity-60 cursor-pointer">
        {state === "sending" ? t.f.sending : t.f.send}
      </button>
    </form>
  );
}
