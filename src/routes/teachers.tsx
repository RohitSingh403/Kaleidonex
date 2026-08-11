import { createFileRoute } from "@tanstack/react-router";
import { Card, CtaBand, PageHero, Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "For Teachers — Training, Certification & Lesson Support | Kaleidonex" },
      {
        name: "description",
        content:
          "Kaleidonex trains and certifies school teachers to run coding, robotics and AI classes with ready lesson plans, kits and ongoing mentoring.",
      },
      { property: "og:title", content: "Teacher Training & Certification" },
      {
        property: "og:description",
        content: "Certification workshops, lesson plans and mentoring so your staff own the lab.",
      },
    ],
  }),
  component: Teachers,
});

function Teachers() {
  return (
    <>
      <PageHero
        eyebrow="For teachers"
        title="You do not need a computer science degree to teach this"
        description="Our certification path takes a subject teacher from first login to running an independent robotics or AI class in six weeks."
      />

      <Section>
        <SectionHeading eyebrow="Certification path" title="Four levels, all hands-on" />
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          <Card badge="Level 1" title="Foundations" description="Platform, lab safety, kit handling and block coding basics." />
          <Card badge="Level 2" title="Classroom delivery" description="Lesson plans, pacing, differentiation and assessment rubrics." />
          <Card badge="Level 3" title="Specialist track" description="Choose robotics, AI or VR and build three showcase projects." />
          <Card badge="Level 4" title="Mentor" description="Coach peers, judge competitions and lead your school's showcase." />
        </div>
      </Section>

      <div className="border-y border-border bg-secondary/40">
        <Section>
          <div className="grid gap-10 lg:grid-cols-2">
            <SectionHeading
              eyebrow="Ongoing support"
              title="Help that arrives before the period starts"
              description="Every certified teacher gets lesson kits, a WhatsApp support line with our trainers, and termly refresher sessions when curriculum updates ship."
            />
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                "Ready lesson plans and slides",
                "Printable worksheets and rubrics",
                "Video walkthroughs per project",
                "Spare parts within 72 hours",
                "Termly refresher workshops",
                "Competition preparation guides",
              ].map((item) => (
                <li key={item} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </div>

      <CtaBand
        title="Bring certification to your staff room"
        description="We run cohort training on campus or online, scheduled around your teaching load."
      />
    </>
  );
}
