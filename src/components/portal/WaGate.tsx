"use client";

import { useEffect, useRef, useState } from "react";
import { tr, type Lang } from "./i18n";
import { IconClose, IconWA } from "./icons";

// Intercepts every wa.me link on the public site: asks for name + phone once, creates the
// client in the CRM through /api/leads and then opens WhatsApp. Links marked data-wa-direct skip it.
const STORE = "pi_wa_lead";

interface Saved { name: string; phone: string; sent: string[] }
interface Pending { href: string; propertyId: string | null; text: string }

function load(): Saved | null {
  try { return JSON.parse(localStorage.getItem(STORE) || "null"); } catch { return null; }
}
function save(v: Saved) {
  try { localStorage.setItem(STORE, JSON.stringify(v)); } catch { /* private mode */ }
}
function sendLead(name: string, phone: string, p: Pending) {
  const message = `📱 Contactó por WhatsApp desde ${location.pathname}${p.text ? `\n${p.text}` : ""}`;
  fetch("/api/leads", {
    method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, message, propertyId: p.propertyId || undefined }),
  }).catch(() => {});
}

export default function WaGate() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [lang, setLang] = useState<Lang>("es");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.("a[href*='wa.me']") as HTMLAnchorElement | null;
      if (!a || a.dataset.waDirect !== undefined || e.defaultPrevented) return;
      const href = a.href;
      const propertyId = location.pathname.match(/^\/p\/([^/?#]+)/)?.[1] || a.dataset.propertyId || null;
      let text = "";
      try { text = new URL(href).searchParams.get("text") || ""; } catch { /* keep empty */ }
      const p = { href, propertyId, text };
      const saved = load();
      if (saved) {
        // Already identified: let WhatsApp open, log interest once per property.
        const key = propertyId || "general";
        if (!saved.sent.includes(key)) { sendLead(saved.name, saved.phone, p); save({ ...saved, sent: [...saved.sent, key] }); }
        return;
      }
      e.preventDefault();
      setLang(document.cookie.match(/(?:^|; )pi_lang=(\w+)/)?.[1] === "en" ? "en" : "es");
      setError("");
      setPending(p);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!pending) return;
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPending(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending]);

  if (!pending) return null;
  const t = tr(lang).waGate;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim(), ph = phone.trim();
    if (n.length < 2) return setError(t.errName);
    if (ph.replace(/\D/g, "").length < 7) return setError(t.errPhone);
    sendLead(n, ph, pending);
    save({ name: n, phone: ph, sent: [pending.propertyId || "general"] });
    // Opened synchronously inside the submit gesture so popup blockers allow it.
    window.open(pending.href, "_blank", "noopener,noreferrer");
    setPending(null);
  };

  const field = "w-full px-4 py-3 rounded-xl border border-[#E4D9C6] bg-white text-[#1E1A15] text-sm focus:border-[#B8945F] focus:outline-none";
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="wa-gate-title">
      <div className="absolute inset-0 bg-[#1E1A15]/60 backdrop-blur-sm pi-fade" onClick={() => setPending(null)} />
      <form onSubmit={submit} className="relative w-full sm:max-w-md bg-[#FBF8F3] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl pi-pop" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
        <button type="button" onClick={() => setPending(null)} aria-label={t.close} className="absolute top-4 right-4 p-1.5 text-[#6B6155] hover:text-[#1E1A15]">
          <IconClose />
        </button>
        <span className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center mb-4"><IconWA /></span>
        <h2 id="wa-gate-title" className="text-2xl text-[#1E1A15] mb-2" style={{ fontFamily: "'Cinzel', serif" }}>{t.title}</h2>
        <p className="text-sm text-[#6B6155] mb-5 leading-relaxed">{t.sub}</p>
        <div className="space-y-3">
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} autoComplete="name" className={field} maxLength={100} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phone} autoComplete="tel" type="tel" inputMode="tel" className={field} maxLength={30} />
        </div>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        <button type="submit" className="mt-5 w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE5A] text-white font-semibold py-3.5 rounded-full text-xs uppercase tracking-[0.15em] transition-colors">
          <IconWA /> {t.cta}
        </button>
        <p className="text-[11px] text-[#9C9182] text-center mt-3">{t.privacy}</p>
      </form>
    </div>
  );
}
