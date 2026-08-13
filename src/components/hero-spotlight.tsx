import { useEffect, useRef } from "react";

/**
 * Subtle scroll-driven spotlight + parallax layer for the hero.
 * Purely decorative: rendered behind content, aria-hidden, and fully
 * disabled when the user prefers reduced motion.
 */
export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let running = false;

    const apply = () => {
      frame = 0;
      const section = el.parentElement;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 when the hero top is at the viewport top, 1 once it has scrolled past.
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height || vh)));
      el.style.setProperty("--hero-progress", progress.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };

    const start = () => {
      if (running || media.matches) return;
      running = true;
      apply();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
    };

    const stop = () => {
      running = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      el.style.setProperty("--hero-progress", "0");
    };

    const onPrefChange = () => (media.matches ? stop() : start());
    media.addEventListener("change", onPrefChange);
    start();

    return () => {
      media.removeEventListener("change", onPrefChange);
      stop();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="hero-spotlight" />;
}
