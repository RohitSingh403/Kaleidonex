import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CtaBand, PageHero, Section, SectionHeading } from "@/components/ui-kit";
import { getPublicProducts } from "@/lib/admin.functions";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Robotics Kits, Electronics, Books & Lab Equipment" },
      {
        name: "description",
        content:
          "Browse Kaleidonex robotics kits, development boards, curriculum books and STEM lab equipment supplied to partner schools.",
      },
      { property: "og:title", content: "Kaleidonex Products & Robotics Kits" },
      {
        property: "og:description",
        content: "Robotics kits, electronics, curriculum books and lab equipment for schools.",
      },
    ],
  }),
  component: Products,
});

function Products() {
  const fetchProducts = useServerFn(getPublicProducts);
  const { data, isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: () => fetchProducts(),
  });

  const products = data ?? [];
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow="Products"
        title="Hardware and books built for classroom wear and tear"
        description="Everything we teach with is supplied, replaced and maintained through your annual programme."
      />

      <Section>
        {categories.length > 0 && (
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
        )}

        {isLoading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <article
                key={p.id || p.name}
                className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {p.category}
                </span>
                <h2 className="mt-2 text-base font-semibold">{p.name}</h2>
                {Array.isArray(p.features) && p.features.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {p.features.map((f: string) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border mt-5">
                  <span className="font-display text-lg font-bold text-primary">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.stock}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <h3 className="font-semibold text-lg">Product Catalog Updating</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Our hardware and kit catalog is being updated for the current academic session. Contact us for customized school kit requirements.
            </p>
          </div>
        )}
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
