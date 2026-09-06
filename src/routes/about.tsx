import { createFileRoute } from "@tanstack/react-router";
import { Card, CtaBand, Section, SectionHeading, Eyebrow } from "@/components/ui-kit";
import { Reveal } from "@/components/reveal";
import ceoImage from "@/assets/ceo.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About KaleidoNex — Building Future-Ready Education Ecosystems" },
      {
        name: "description",
        content:
          "KaleidoNex partners with schools to deliver practical, technology-enabled learning across Coding, AI, Robotics, Quantum Technology, AR/VR, STEM and Entrepreneurship.",
      },
      { property: "og:title", content: "About KaleidoNex" },
      {
        property: "og:description",
        content:
          "We connect schools, students, educators and emerging technologies to build future-ready learning ecosystems.",
      },
    ],
  }),
  component: About,
});

const values = [
  {
    title: "Schools first",
    description:
      "Every programme is designed around your timetable, staff and budget reality — not a generic template.",
  },
  {
    title: "Teachers own it",
    description:
      "We certify your educators so the programme thrives beyond year one — not dependent on external staff.",
  },
  {
    title: "Evidence, not slides",
    description:
      "Quarterly audits and progress dashboards show what students actually built, tested and shipped.",
  },
  {
    title: "Made to last",
    description:
      "Kits, consumables, lab maintenance and refresher training are all covered through the programme year.",
  },
];

const deliverables = [
  {
    badge: "01",
    title: "Future-Ready School Programs",
    description:
      "Technology-focused K–12 programs that complement academic learning and develop practical digital and emerging-technology skills.",
  },
  {
    badge: "02",
    title: "On-Ground Technology Education",
    description:
      "Trained educators and programme managers working directly with schools — delivering engaging practical sessions, project-based learning and classroom execution.",
  },
  {
    badge: "03",
    title: "Innovation Labs & Infrastructure",
    description:
      "Design, setup and support for AI, Robotics, Coding, STEM, AR/VR and Quantum Technology labs — equipped with robotics kits, 3D printers and hands-on resources.",
  },
  {
    badge: "04",
    title: "Smart Learning Ecosystem",
    description:
      "Technology-enabled tools for curriculum delivery, classroom management, assessments, project tracking and student progress monitoring.",
  },
  {
    badge: "05",
    title: "Entrepreneurship & Innovation",
    description:
      "Helping students transform ideas into prototypes while developing creativity, critical thinking, collaboration and an entrepreneurial mindset.",
  },
];

function About() {
  return (
    <>
      {/* ── Hero: two-column, text left / CEO image right ── */}
      <div className="surface-grid border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
          {/* Left — text */}
          <div>
            <Reveal>
              <Eyebrow>About us</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-3 text-4xl font-bold leading-[1.08] md:text-5xl">
                Building a future-ready education ecosystem
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                KaleidoNex connects schools, students, educators and emerging
                technologies. Technology education should go beyond textbooks —
                giving students the opportunity to learn, build, experiment,
                create and solve real-world challenges.
              </p>
            </Reveal>
          </div>

          {/* Right — CEO image */}
          <Reveal delay={200} className="relative">
            <div className="group relative overflow-hidden rounded-2xl border border-border shadow-lift">
              <img
                src={ceoImage}
                alt="Kaushlendra Kumar — Founder & CEO of KaleidoNex"
                className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              {/* Quote overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-6 pb-6 pt-12">
                <p className="text-sm font-medium italic leading-relaxed text-white/90">
                  "Every child in India deserves access to the same quality of
                  future-skills education — regardless of where they live."
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/70">
                  Kaushlendra Kumar — Founder &amp; CEO, KaleidoNex
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* ── Mission ── */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our mission"
              title="Technology education should not depend on postcode"
              description="Most schools want to teach coding, AI and robotics but lack curriculum, equipment and trained staff. We supply all three as one accountable programme — so a school in a tier-3 town runs the same quality lab as a metro flagship."
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <Card key={v.title} {...v} />
            ))}
          </div>
        </div>
      </Section>

      {/* ── What We Deliver ── */}
      <div className="border-y border-border bg-secondary/40">
        <Section>
          <SectionHeading
            eyebrow="What we deliver"
            title="Five pillars of the KaleidoNex programme"
            description="We partner with schools across Coding, AI, Robotics, Quantum Technology, AR/VR, STEM and Entrepreneurship — delivered as one integrated ecosystem."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {deliverables.map((d) => (
              <Card key={d.title} badge={d.badge} title={d.title} description={d.description} />
            ))}
          </div>
        </Section>
      </div>

      {/* ── Vision ── */}
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Our vision</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Schools as innovation-driven environments
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 text-lg text-muted-foreground">
              We envision schools where students are not only consumers of
              technology but also creators, builders and problem-solvers.
              KaleidoNex bridges the gap between classroom education and the
              rapidly evolving technology landscape — preparing students with
              the confidence and capabilities required for the future.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-8 font-display text-xl font-bold tracking-wide text-primary">
              Learn → Build → Experiment → Innovate
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Empowering learners. Enabling innovation. Shaping the future.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ── Milestones ── */}
      <div className="border-y border-border bg-secondary/40">
        <Section>
          <SectionHeading eyebrow="Milestones" title="How we got here" />
          <ol className="mt-10 space-y-5">
            {[
              ["2024", "First robotics lab installed on a single campus in Pune."],
              ["2025", "Graded curriculum for Grades 1–12 published, NEP 2020 aligned."],
              [
                "2026",
                "AI lab, AR/VR and Quantum Technology programmes launched across 120+ schools.",
              ],
            ].map(([year, text]) => (
              <li
                key={year}
                className="flex gap-6 rounded-xl border border-border bg-card p-6"
              >
                <span className="font-display text-xl font-bold text-primary">{year}</span>
                <p className="text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <CtaBand
        title="Want to see our programme in your school?"
        description="Book a 30-minute walkthrough. We will map your grades, timetable and lab space to a rollout plan."
      />
    </>
  );
}
