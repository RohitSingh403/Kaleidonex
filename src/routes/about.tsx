import { createFileRoute } from "@tanstack/react-router";
import { Card, CtaBand, Section, SectionHeading, Eyebrow } from "@/components/ui-kit";
import { Reveal } from "@/components/reveal";
import ceoImage from "@/assets/ceo.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Kaleidonex — Building School Innovation Ecosystems" },
      {
        name: "description",
        content:
          "Kaleidonex partners with schools and trusts to build lasting AI, robotics and STEM capability through curriculum, labs and teacher training.",
      },
      { property: "og:title", content: "About Kaleidonex" },
      {
        property: "og:description",
        content: "Why we build future-skills ecosystems with schools instead of selling courses.",
      },
    ],
  }),
  component: About,
});

const values = [
  { title: "Schools first", description: "Every programme is designed around your timetable, staff and budget reality." },
  { title: "Teachers own it", description: "We certify your teachers so the programme survives beyond year one." },
  { title: "Evidence, not slides", description: "Quarterly audits and dashboards show what students actually built." },
  { title: "Made to last", description: "Kits, consumables and maintenance are covered through the year." },
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
                We build innovation capability inside schools
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Kaleidonex started in 2016 with one robotics lab. Today we run
                future-skills programmes across 480 campuses, 72 cities and
                6,500 trained teachers.
              </p>
            </Reveal>
          </div>

          {/* Right — CEO image */}
          <Reveal delay={200} className="relative">
            <div className="group relative overflow-hidden rounded-2xl border border-border shadow-lift">
              <img
                src={ceoImage}
                alt="Founder & CEO of Kaleidonex"
                className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              {/* Quote card overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-6 pb-6 pt-12">
                <p className="text-sm font-medium italic leading-relaxed text-white/90">
                  "Every child in India deserves access to the same quality of
                  future-skills education — regardless of where they live."
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-white/70">
                  Kaushlendra Kumar — Founder &amp; CEO, Kaleidonex
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Our mission"
              title="Technology education should not depend on postcode"
              description="Most schools want to teach coding, AI and robotics but lack curriculum, equipment and trained staff. We supply all three as one accountable programme, so a school in a tier-3 town runs the same quality of lab as a metro flagship."
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <Card key={v.title} {...v} />
            ))}
          </div>
        </div>
      </Section>

      <div className="border-y border-border bg-secondary/40">
        <Section>
          <SectionHeading eyebrow="Milestones" title="How we got here" />
          <ol className="mt-10 space-y-5">
            {[
              ["2024", "First robotics lab installed in a single campus in Pune."],
              ["2025", "Graded curriculum for grades 1–12 published and NEP-mapped."],
              ["2026", "AI lab and VR concept library launched across 120 schools."],
              // ["2026", "480 partner schools, in-house kit manufacturing and progress dashboards."],
            ].map(([year, text]) => (
              <li key={year} className="flex gap-6 rounded-xl border border-border bg-card p-6">
                <span className="font-display text-xl font-bold text-primary">{year}</span>
                <p className="text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <CtaBand title="Want to see our programme in your school?" />
    </>
  );
}
