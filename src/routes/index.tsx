import { createFileRoute, Link } from "@tanstack/react-router";
import heroImage from "@/assets/hero-lab.jpg";
import { Card, CtaBand, Section, SectionHeading, Eyebrow } from "@/components/ui-kit";
import { Reveal } from "@/components/reveal";
import { HeroSpotlight } from "@/components/hero-spotlight";
import { CountUp } from "@/components/count-up";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KaleidoNex — AI, Robotics & STEM Programmes for Schools" },
      {
        name: "description",
        content:
          "KaleidoNex equips schools with coding, AI, robotics, STEM and VR programmes: curriculum, labs, kits, teacher training and student progress tracking.",
      },
      { property: "og:title", content: "KaleidoNex — AI, Robotics & STEM Programmes for Schools" },
      {
        property: "og:description",
        content:
          "A complete future-ready education programme for schools: curriculum, labs, kits, teacher training and progress tracking.",
      },
    ],
  }),
  component: Home,
});

const stats: { value: number; suffix: string; decimals?: number; label: string }[] = [
  { value: 480, suffix: "+", label: "Partner schools" },
  { value: 3.2, suffix: "L", decimals: 1, label: "Students taught" },
  { value: 6500, suffix: "", label: "Teachers trained" },
  { value: 72, suffix: "", label: "Cities across India" },
];



const programs = [
  {
    title: "Coding",
    description: "Block-based to Python and web development, mapped grade by grade.",
    badge: "Grades 1–12",
  },
  {
    title: "Robotics",
    description: "Sensors, microcontrollers and build challenges with competition support.",
    badge: "Lab based",
  },
  {
    title: "Artificial Intelligence",
    description: "Data literacy, computer vision and responsible AI projects for seniors.",
    badge: "Grades 6–12",
  },
  {
    title: "STEM Labs",
    description: "Turnkey lab design, equipment, consumables and annual maintenance.",
    badge: "Infrastructure",
  },
  {
    title: "VR Learning",
    description: "Immersive concept libraries for science, geography and history.",
    badge: "Immersive",
  },
  {
    title: "Entrepreneurship",
    description: "Finance, critical thinking and life skills through school ventures.",
    badge: "Life skills",
  },
];

const journey = [
  { step: "01", title: "Discovery call", text: "We audit grades, timetable, lab space and goals." },
  { step: "02", title: "Programme design", text: "A curriculum map and lab plan built for your school." },
  { step: "03", title: "Setup & training", text: "Lab installation, kits delivered, teachers certified." },
  { step: "04", title: "Delivery & review", text: "Weekly classes, quarterly audits, progress dashboards." },
];

const testimonials = [
  {
    quote:
      "Our students went from zero robotics exposure to a state-level championship in one academic year.",
    name: "Dr. Meera Rao",
    role: "Principal, Sunrise International School",
  },
  {
    quote:
      "The teacher training was the difference. Our own staff now run the AI lab confidently.",
    name: "Anil Kher",
    role: "Trustee, Vidya Educational Trust",
  },
  {
    quote: "Parents finally see measurable evidence of skill growth every term.",
    name: "Sneha Pillai",
    role: "Academic Head, Greenfield Academy",
  },
];

const faqs = [
  {
    q: "How long does a school rollout take?",
    a: "Most schools go live within four to six weeks of signing, including lab setup and teacher certification.",
  },
  {
    q: "Do you provide the teachers?",
    a: "Both models work. We can train your existing staff or place a trained KaleidoNex instructor on campus.",
  },
  {
    q: "Is the curriculum aligned to NEP and CBSE?",
    a: "Yes. Learning paths are mapped to NEP 2020 skill outcomes and CBSE AI and ICT syllabi.",
  },
  {
    q: "What does a lab cost?",
    a: "Pricing depends on grade coverage and lab size. Share your requirements and we will send a costed proposal.",
  },
];

function Home() {
  return (
    <>
      <section className="surface-grid relative isolate overflow-hidden border-b border-border">
        <HeroSpotlight />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
          <div>
            <Reveal>
              <Eyebrow>Future-ready education, delivered</Eyebrow>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mt-4 text-4xl font-bold leading-[1.05] md:text-6xl">
                AI, robotics and STEM programmes your school can actually run
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                KaleidoNex gives schools an end-to-end ecosystem: graded curriculum, lab setup,
                robotics kits, certified teacher training and a dashboard that tracks every
                student&rsquo;s progress.
              </p>
            </Reveal>
            <Reveal delay={270} className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/demo"
                className="btn-shimmer inline-flex items-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
              >
                Book a demo
              </Link>
              <Link
                to="/solutions"
                className="btn-press inline-flex items-center rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-secondary"
              >
                Explore solutions
              </Link>
            </Reveal>
            <Reveal delay={360}>
              <p className="mt-6 text-sm text-muted-foreground">
                Trusted by 480+ schools · NEP 2020 aligned · Onboarding in 4–6 weeks
              </p>
            </Reveal>
          </div>

          <Reveal delay={200} className="relative">
            <div className="group overflow-hidden rounded-2xl border border-border shadow-lift">
              <img
                src={heroImage}
                alt="Students building a robot with laptops, circuit boards and a VR headset"
                width={1200}
                height={1008}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <Section className="!py-12">
        <dl className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-card p-8 shadow-soft md:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-primary">
                <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </Section>


      <Section>
        <SectionHeading
          eyebrow="Programmes"
          title="One partner for every future-skills subject"
          description="Pick a single track or run the full ecosystem across primary, middle and senior school."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((p, i) => (
            <Reveal key={p.title} delay={(i % 3) * 90}>
              <Card {...p} />
            </Reveal>
          ))}
        </div>
      </Section>

      <div className="border-y border-border bg-secondary/40">
        <Section>
          <SectionHeading
            eyebrow="School workflow"
            title="How a partnership runs"
            description="A dedicated programme manager owns delivery from the first call to the annual review."
          />
          <ol className="mt-10 grid gap-5 md:grid-cols-4">
            {journey.map((j, i) => (
              <Reveal as="li" key={j.step} delay={i * 90}>
                <div className="lift-card h-full rounded-xl border border-border bg-card p-6 shadow-soft">
                  <span className="font-display text-3xl font-bold text-accent">{j.step}</span>
                  <h3 className="mt-3 font-semibold">{j.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{j.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Section>
      </div>

      <Section>
        <SectionHeading eyebrow="Proof" title="What school leaders say" />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal as="figure" key={t.name} delay={i * 90}>
              <div className="lift-card h-full rounded-xl border border-border bg-card p-6 shadow-soft">
                <blockquote className="text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  <span className="block text-muted-foreground">{t.role}</span>
                </figcaption>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="!pt-0">
        <SectionHeading eyebrow="FAQ" title="Questions schools ask us first" />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={(i % 2) * 90}>
              <details className="group rounded-xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="text-primary transition-transform duration-300 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
