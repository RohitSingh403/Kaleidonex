import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";


export function Section({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-7xl px-4 py-16 md:py-24 ${className}`}>{children}</section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="max-w-2xl">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-3 text-3xl font-bold md:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-muted-foreground">{description}</p> : null}
    </Reveal>
  );
}

export function Card({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <article className="group lift-card h-full rounded-xl border border-border bg-card p-6 shadow-soft">
      {badge ? (
        <span className="inline-block rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {badge}
        </span>
      ) : null}
      <h3 className="mt-3 text-lg font-semibold transition-colors group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </article>
  );
}


export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-border surface-grid">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold md:text-5xl">{title}</h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>
        </Reveal>
      </div>
    </div>
  );
}

export function CtaBand({
  title = "Bring an AI, robotics and STEM programme to your school",
  description = "Book a 30-minute walkthrough. We will map your grades, timetable and lab space to a rollout plan.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Section>
      <Reveal className="ink-panel block overflow-hidden rounded-2xl px-6 py-12 md:px-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
            <p className="mt-3 text-sm opacity-85">{description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/demo"
              className="inline-flex items-center rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground shadow-soft hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0"
            >
              Schedule a demo
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-md border border-white/25 px-5 py-3 text-sm font-semibold hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
