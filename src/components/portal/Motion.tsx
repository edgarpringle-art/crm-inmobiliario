"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Scroll reveal: any element with data-reveal fades/slides in when it enters the viewport.
// Items entering together are staggered. Watches the DOM so "Ver más" cards animate too.
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    (window as unknown as { __piMotion: boolean }).__piMotion = true;
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        if (!el.style.transitionDelay) el.style.transitionDelay = `${Math.min(n++, 5) * 90}ms`;
        el.classList.add("is-in");
        io.unobserve(el);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    const scan = () => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);
  return null;
}

// Counts up from 0 to `value` the first time it becomes visible.
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - start) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);
  return <span ref={ref}>{shown.toLocaleString("en-US")}</span>;
}
