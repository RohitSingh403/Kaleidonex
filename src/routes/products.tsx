import { createFileRoute } from "@tanstack/react-router";
import { CtaBand, PageHero, Section, SectionHeading } from "@/components/ui-kit";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Robotics Kits, Electronics, Books & Lab Equipment" },
      {
        name: "description",
        content:
          "Browse KaleidoNex robotics kits, development boards, curriculum books and STEM lab equipment supplied to partner schools.",
      },
      { property: "og:title", content: "KaleidoNex Products & Robotics Kits" },
      {
        property: "og:description",
        content: "Robotics kits, electronics, curriculum books and lab equipment for schools.",
      },
    ],
  }),
  component: Products,
});

const categories = ["Robotics kits", "Electronics", "Books", "Lab equipment"];

const products = [
  { name: "Starter Robotics Kit", category: "Robotics kits", price: "₹6,499", stock: "In stock", features: ["12 build projects", "Motor driver + chassis", "Grades 3–6"] },
  { name: "Advanced Robotics Kit", category: "Robotics kits", price: "₹14,999", stock: "In stock", features: ["Line follower & arm", "Bluetooth module", "Grades 7–12"] },
  { name: "AI Vision Board", category: "Electronics", price: "₹9,250", stock: "Low stock", features: ["On-device inference", "Camera module", "Python SDK"] },
  { name: "Sensor Pack (24 pcs)", category: "Electronics", price: "₹3,199", stock: "In stock", features: ["IR, ultrasonic, DHT", "Jumper set", "Lab replenishment"] },
  { name: "Coding Companion — Grades 1–5", category: "Books", price: "₹499", stock: "In stock", features: ["Full colour workbook", "Teacher guide", "NEP mapped"] },
  { name: "AI & ICT Handbook — Grades 9–12", category: "Books", price: "₹749", stock: "In stock", features: ["CBSE aligned", "Project rubrics", "Assessment bank"] },
  { name: "STEM Workbench", category: "Lab equipment", price: "₹42,000", stock: "Made to order", features: ["Anti-static top", "Tool storage", "Seats 6 students"] },
  { name: "VR Class Set (10 headsets)", category: "Lab equipment", price: "₹1,85,000", stock: "Made to order", features: ["Concept library", "Charging case", "Teacher console"] },
];

function Products() {
  return (
    <>
      <PageHero
        eyebrow="Products"
        title="Hardware and books built for classroom wear and tear"
        description="Everything we teach with is supplied, replaced and maintained through your annual programme."
      />

      <Section>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-soft"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <article
              key={p.name}
              className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {p.category}
              </span>
              <h2 className="mt-2 text-base font-semibold">{p.name}</h2>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="font-display text-lg font-bold text-primary">{p.price}</span>
                <span className="text-xs text-muted-foreground">{p.stock}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <div className="border-y border-border bg-secondary/40">
        <Section>
          <SectionHeading
            eyebrow="Procurement"
            title="Bulk pricing for schools and trusts"
            description="Prices shown are indicative per-unit school rates. Multi-campus trusts receive consolidated quotations, GST invoicing and staggered delivery schedules."
          />
        </Section>
      </div>

      <CtaBand title="Need a costed equipment quotation?" description="Send us your grade coverage and lab size for a detailed proposal." />
    </>
  );
}
