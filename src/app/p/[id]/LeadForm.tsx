"use client";

import { useState } from "react";

export default function LeadForm({ propertyId, waHref }: { propertyId: string; waHref: string }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      setError("Escribe tu nombre y un teléfono o email."); setState("error"); return;
    }
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar."); setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
        <p className="text-lg font-medium text-stone-900 mb-2" style={{ fontFamily: "'Cinzel', serif" }}>¡Gracias!</p>
        <p className="text-sm text-stone-600 mb-4">Recibimos tu solicitud. Te contactaremos muy pronto.</p>
        <a href={waHref} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold w-full py-3 rounded text-xs uppercase tracking-[0.15em] transition-colors">
          Escribir ahora por WhatsApp
        </a>
      </div>
    );
  }

  const input = "w-full border border-stone-300 rounded px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900";

  return (
    <form onSubmit={submit} className="bg-white border border-stone-200 rounded-xl p-6 space-y-3">
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.3em] mb-1">Solicitar información</p>
      <input className={input} placeholder="Nombre completo *" value={form.name} onChange={set("name")} maxLength={100} autoComplete="name" />
      <input className={input} placeholder="Teléfono / WhatsApp *" value={form.phone} onChange={set("phone")} maxLength={30} type="tel" autoComplete="tel" />
      <input className={input} placeholder="Email" value={form.email} onChange={set("email")} maxLength={150} type="email" autoComplete="email" />
      <textarea className={input} rows={3} placeholder="Mensaje (opcional)" value={form.message} onChange={set("message")} maxLength={2000} />
      {/* Honeypot anti-spam */}
      <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")}
        className="absolute -left-[9999px] w-px h-px opacity-0" aria-hidden="true" />
      {state === "error" && <p className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={state === "sending"}
        className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded text-xs uppercase tracking-[0.15em] transition-colors disabled:opacity-60 cursor-pointer">
        {state === "sending" ? "Enviando..." : "Enviar solicitud"}
      </button>
      <p className="text-[11px] text-stone-400 leading-snug">Te contactaremos por WhatsApp o email. Tus datos no se comparten con terceros.</p>
    </form>
  );
}
