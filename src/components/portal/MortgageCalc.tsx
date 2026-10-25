"use client";

import { useState } from "react";
import { tr, type Lang } from "./i18n";

// Estimated monthly mortgage payment (French amortization) for sale listings.
export default function MortgageCalc({ price, lang = "es" }: { price: number; lang?: Lang }) {
  const t = tr(lang).mortgage;
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(30);

  const loan = price * (1 - downPct / 100);
  const r = rate / 100 / 12;
  const n = years * 12;
  const monthly = r > 0 ? (loan * r) / (1 - Math.pow(1 + r, -n)) : loan / n;
  const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

  const slider = "w-full accent-[#B8945F]";
  return (
    <div data-reveal className="bg-white border border-[#E9E0D0] rounded-2xl p-6">
      <p className="text-[10px] font-semibold text-[#8A6A3A] uppercase tracking-[0.3em] mb-1">{t.eyebrow}</p>
      <p className="text-xl text-[#1E1A15] mb-5" style={{ fontFamily: "'Cinzel', serif" }}>{t.title}</p>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-5">
          <label className="block">
            <span className="flex justify-between text-xs text-[#6B6155] mb-1.5"><span>{t.down}</span><span className="font-semibold text-[#1E1A15]">{downPct}% · {money(price * downPct / 100)}</span></span>
            <input type="range" min={5} max={60} step={5} value={downPct} onChange={(e) => setDownPct(+e.target.value)} className={slider} />
          </label>
          <label className="block">
            <span className="flex justify-between text-xs text-[#6B6155] mb-1.5"><span>{t.rate}</span><span className="font-semibold text-[#1E1A15]">{rate.toFixed(2)}%</span></span>
            <input type="range" min={3} max={10} step={0.25} value={rate} onChange={(e) => setRate(+e.target.value)} className={slider} />
          </label>
          <label className="block">
            <span className="flex justify-between text-xs text-[#6B6155] mb-1.5"><span>{t.years}</span><span className="font-semibold text-[#1E1A15]">{years} {t.yearsUnit}</span></span>
            <input type="range" min={5} max={30} step={5} value={years} onChange={(e) => setYears(+e.target.value)} className={slider} />
          </label>
        </div>
        <div className="rounded-2xl bg-[#1E1A15] text-white p-6 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#D9BE8F] mb-2">{t.monthly}</p>
          <p className="text-4xl text-[#D9BE8F]" style={{ fontFamily: "'Cinzel', serif" }}>{money(monthly)}</p>
          <div className="mt-4 pt-4 border-t border-white/10 space-y-1 text-xs text-[#CFC4B2]">
            <p className="flex justify-between"><span>{t.loan}</span><span>{money(loan)}</span></p>
            <p className="flex justify-between"><span>{t.total}</span><span>{money(monthly * n)}</span></p>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-[#9C9182] mt-4">{t.note}</p>
    </div>
  );
}
