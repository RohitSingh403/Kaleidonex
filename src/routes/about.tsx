import { createFileRoute } from "@tanstack/react-router";
import { Card, CtaBand, PageHero, Section, SectionHeading } from "@/components/ui-kit";

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
      <PageHero
        eyebrow="About us"
        title="We build innovation capability inside schools"
        description="Kaleidonex started in 2016 with one robotics lab. Today we run future-skills programmes across 480 campuses, 72 cities and 6,500 trained teachers."
      />

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
              ["2016", "First robotics lab installed in a single campus in Pune."],
              ["2019", "Graded curriculum for grades 1–12 published and NEP-mapped."],
              ["2022", "AI lab and VR concept library launched across 120 schools."],
              ["2026", "480 partner schools, in-house kit manufacturing and progress dashboards."],
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
