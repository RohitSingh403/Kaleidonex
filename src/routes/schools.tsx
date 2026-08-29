import { createFileRoute } from "@tanstack/react-router";
import { Card, CtaBand, PageHero, Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/schools")({
  head: () => ({
    meta: [
      { title: "For Schools — Partnership Model & Rollout Plan | Kaleidonex" },
      {
        name: "description",
        content:
          "See how Kaleidonex school partnerships work: onboarding, programme manager, lab setup, teacher training, audits and student progress reporting.",
      },
      { property: "og:title", content: "Kaleidonex School Partnerships" },
      {
        property: "og:description",
        content: "Onboarding, labs, trained teachers, audits and reporting — managed end to end.",
      },
    ],
  }),
  component: Schools,
});

const steps = [
  ["Onboarding", "Agreement, grade mapping, academic calendar alignment."],
  ["Programme manager", "A named manager owns scheduling and escalations."],
  ["Lab setup", "Design, installation, kit delivery and safety checks."],
  ["Teacher training", "Certification workshops plus termly refreshers."],
  ["Class delivery", "Weekly periods run by your staff or our instructors."],
  ["Audit & reporting", "Quarterly audit, dashboards and parent-facing reports."],
];

function Schools() {
  return (
    <>
      <PageHero
        eyebrow="For schools"
        title="A partnership designed for the academic year"
        description="Signing with Kaleidonex replaces vendor management with one accountable programme, one manager and one reporting line."
      />

      <Section>
        <SectionHeading eyebrow="Rollout" title="Six stages from signature to showcase" />
        <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(([title, text], i) => (
            <li key={title} className="rounded-xl border border-border bg-card p-6 shadow-soft">
              <span className="font-display text-2xl font-bold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <div className="border-y border-border bg-secondary/40">
        <Section>
          <SectionHeading eyebrow="What leadership gets" title="Visibility at every level" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Card title="Management dashboard" description="Attendance, coverage and lab utilisation across grades and sections." />
            <Card title="Quarterly audit report" description="An independent review of delivery quality with corrective actions." />
            <Card title="Showcase day" description="An annual exhibition where students present projects to parents and press." />
          </div>
        </Section>
      </div>

      <Section>
        <SectionHeading
          eyebrow="Commercials"
          title="Three ways to run the programme"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Card badge="Model A" title="School-funded" description="The school pays an annual programme fee; classes are free for every student." />
          <Card badge="Model B" title="Parent-funded" description="Opt-in per-student fee collected termly; the school hosts the lab." />
          <Card badge="Model C" title="Hybrid" description="School funds infrastructure, parents fund elective advanced tracks." />
        </div>
      </Section>

      <CtaBand title="Start with a free lab readiness audit" description="We visit or review photos of your space and return a rollout plan in a week." />
    </>
  );
}
