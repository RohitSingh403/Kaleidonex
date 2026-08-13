import { createFileRoute } from "@tanstack/react-router";
import { CtaBand, PageHero, Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum — Graded Coding, AI & Robotics Learning Paths" },
      {
        name: "description",
        content:
          "KaleidoNex's NEP-aligned curriculum spans primary, middle and senior school with coding, AI, robotics, critical thinking and life skills.",
      },
      { property: "og:title", content: "KaleidoNex Curriculum for Grades 1–12" },
      {
        property: "og:description",
        content: "Graded learning paths across coding, AI, robotics, finance and life skills.",
      },
    ],
  }),
  component: Curriculum,
});

const bands = [
  {
    band: "Primary",
    grades: "Grades 1–5",
    focus: "Curiosity and logic",
    modules: ["Block coding", "Simple machines", "Sensors play", "Digital citizenship", "Storytelling with tech"],
  },
  {
    band: "Middle",
    grades: "Grades 6–8",
    focus: "Build and iterate",
    modules: ["Python foundations", "Robotics with microcontrollers", "Intro to AI & data", "3D design", "Team projects"],
  },
  {
    band: "Senior",
    grades: "Grades 9–12",
    focus: "Depth and portfolio",
    modules: ["Applied machine learning", "IoT and automation", "App & web development", "Entrepreneurship", "Capstone research"],
  },
];

const strands = [
  ["Coding", "40 hours / year"],
  ["Robotics", "32 hours / year"],
  ["Artificial Intelligence", "28 hours / year"],
  ["Critical thinking", "20 hours / year"],
  ["Life skills", "16 hours / year"],
  ["Finance & entrepreneurship", "16 hours / year"],
];

function Curriculum() {
  return (
    <>
      <PageHero
        eyebrow="Curriculum"
        title="A twelve-year learning path, not a set of workshops"
        description="Every grade builds on the last, with printed books, digital lessons, project rubrics and assessments included."
      />

      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {bands.map((b) => (
            <article key={b.band} className="rounded-2xl border border-border bg-card p-8 shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                {b.grades}
              </span>
              <h2 className="mt-2 text-2xl font-bold">{b.band}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{b.focus}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {b.modules.map((m) => (
                  <li key={m} className="rounded-md bg-secondary/60 px-3 py-2">
                    {m}
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
            eyebrow="Time allocation"
            title="Six strands mapped to your timetable"
            description="Schools typically run two periods a week; we adjust hours to fit your academic calendar."
          />
          <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/70">
                <tr>
                  <th className="px-5 py-3 font-semibold">Strand</th>
                  <th className="px-5 py-3 font-semibold">Indicative hours</th>
                </tr>
              </thead>
              <tbody>
                {strands.map(([name, hours]) => (
                  <tr key={name} className="border-t border-border">
                    <td className="px-5 py-3">{name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <CtaBand title="Request the full curriculum map" description="We will send grade-wise outcomes, book samples and assessment rubrics." />
    </>
  );
}
