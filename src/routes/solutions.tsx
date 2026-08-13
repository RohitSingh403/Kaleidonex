import { createFileRoute } from "@tanstack/react-router";
import { Card, CtaBand, PageHero, Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/solutions")({
  head: () => ({
    meta: [
      { title: "Solutions — Coding, Robotics, AI, STEM & VR for Schools" },
      {
        name: "description",
        content:
          "Explore KaleidoNex's school solutions: coding, robotics labs, AI labs, STEM infrastructure, VR learning and entrepreneurship programmes.",
      },
      { property: "og:title", content: "KaleidoNex Solutions for Schools" },
      {
        property: "og:description",
        content: "Coding, robotics, AI, STEM labs, VR and entrepreneurship delivered as one programme.",
      },
    ],
  }),
  component: Solutions,
});

const solutions = [
  {
    name: "Coding",
    summary: "Progressive computational thinking from blocks to full-stack projects.",
    includes: ["Block coding & Scratch", "Python and app building", "Web development", "Coding competitions"],
  },
  {
    name: "Robotics Lab",
    summary: "A complete lab: benches, kits, sensors, controllers and project library.",
    includes: ["Lab design & installation", "Kits and spares", "Teacher certification", "Competition mentoring"],
  },
  {
    name: "AI Lab",
    summary: "Data, machine learning and responsible AI, taught through build projects.",
    includes: ["Vision & speech projects", "Datasets and notebooks", "AI ethics modules", "Capstone showcase"],
  },
  {
    name: "STEM Labs",
    summary: "Cross-subject maker spaces for science, maths and design thinking.",
    includes: ["Maker equipment", "Consumables plan", "Activity handbooks", "Annual maintenance"],
  },
  {
    name: "VR Learning",
    summary: "Immersive concept experiences that make abstract topics concrete.",
    includes: ["Headset kits", "Concept library", "Guided lesson plans", "Class management app"],
  },
  {
    name: "Entrepreneurship",
    summary: "Finance literacy, critical thinking and student-run venture challenges.",
    includes: ["Business basics", "Pitch bootcamps", "Mentor network", "Inter-school demo day"],
  },
];

function Solutions() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Six programmes, one delivery team"
        description="Run any track independently or combine them into a full innovation ecosystem across your campus."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          {solutions.map((s) => (
            <article
              key={s.name}
              className="rounded-2xl border border-border bg-card p-8 shadow-soft transition-shadow hover:shadow-lift"
            >
              <h2 className="text-2xl font-bold">{s.name}</h2>
              <p className="mt-2 text-muted-foreground">{s.summary}</p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {s.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {i}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <div className="border-y border-border bg-secondary/40">
        <Section>
          <SectionHeading
            eyebrow="Included with every track"
            title="Delivery you do not have to manage"
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Card title="Dedicated programme manager" description="A single point of contact for scheduling, escalations and reporting." />
            <Card title="Teacher certification" description="Hands-on training, lesson kits and refresher sessions every term." />
            <Card title="Progress dashboards" description="Attendance, project completion and skill growth per student and class." />
          </div>
        </Section>
      </div>

      <CtaBand title="Not sure which track fits your school?" description="Tell us your grades and lab space; we will recommend a rollout." />
    </>
  );
}
