import { useEffect, useRef, useState } from "react";

type Props = {
  /** Numeric target, e.g. 480 */
  value: number;
  /** Text before the number, e.g. "₹" */
  prefix?: string;
  /** Text after the number, e.g. "+" or "L" */
  suffix?: string;
  /** Decimal places to render */
  decimals?: number;
  /** Animation duration in ms */
  duration?: number;
  className?: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const format = (n: number, decimals: number) =>
  n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Counts from 0 to `value` when it first scrolls into view.
 * Respects prefers-reduced-motion by rendering the final value immediately.
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1600,
  className = "",
}: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      setDisplay(value);
      setDone(true);
    };

    if (reduced || typeof IntersectionObserver === "undefined") {
      finish();
      return;
    }

    let raf = 0;
    let startTime = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const t = Math.min(1, (now - startTime) / duration);
      setDisplay(value * easeOutCubic(t));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            raf = requestAnimationFrame(tick);
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  const text = `${prefix}${format(done ? value : display, decimals)}${suffix}`;

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">{`${prefix}${format(value, decimals)}${suffix}`}</span>
    </span>
  );
}
