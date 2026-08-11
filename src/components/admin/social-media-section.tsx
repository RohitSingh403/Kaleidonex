import { useMemo, useState } from "react";
import { Gem, Star, Search, Download, Heart } from "lucide-react";

type Card = { id: string; title: string; tier: "Free" | "Premium"; tone: string };
type Category = { id: string; name: string; blurb: string; cards: Card[] };

const CATEGORIES: Category[] = [
  {
    id: "foryou",
    name: "For You",
    blurb: "Beautiful designs just for you.",
    cards: [
      { id: "fy1", title: "Welcome Back to School", tier: "Free", tone: "from-primary to-accent" },
      { id: "fy2", title: "Admissions Open 2026", tier: "Free", tone: "from-accent to-primary" },
      { id: "fy3", title: "Robotics Lab Launch", tier: "Premium", tone: "from-primary to-secondary" },
      { id: "fy4", title: "STEM Week Highlights", tier: "Premium", tone: "from-secondary to-accent" },
    ],
  },
  {
    id: "aatmanirbhar",
    name: "Aatmanirbhar Bharat",
    blurb: "Designs for aatmanirbhar bharat.",
    cards: [
      { id: "ab1", title: "Atma Nirbhar Bharat", tier: "Free", tone: "from-accent to-primary" },
      { id: "ab2", title: "A Self-Reliant India", tier: "Free", tone: "from-primary to-accent" },
      { id: "ab3", title: "Made in India", tier: "Free", tone: "from-muted to-secondary" },
      { id: "ab4", title: "Harnessing Capabilities", tier: "Free", tone: "from-destructive to-accent" },
    ],
  },
  {
    id: "childrensday",
    name: "Childrens Day",
    blurb: "Designs for childrens day.",
    cards: [
      { id: "cd1", title: "Children's Book Day", tier: "Premium", tone: "from-secondary to-primary" },
      { id: "cd2", title: "Happy Children's Day", tier: "Premium", tone: "from-primary to-secondary" },
      { id: "cd3", title: "Joyful Learning", tier: "Premium", tone: "from-accent to-secondary" },
      { id: "cd4", title: "Little Explorers", tier: "Premium", tone: "from-secondary to-accent" },
    ],
  },
  {
    id: "devotional",
    name: "Devotional",
    blurb: "Designs for devotional posts.",
    cards: [
      { id: "dv1", title: "Festival Greetings", tier: "Free", tone: "from-accent to-primary" },
      { id: "dv2", title: "Blessings & Light", tier: "Premium", tone: "from-primary to-accent" },
      { id: "dv3", title: "Peace and Prayers", tier: "Premium", tone: "from-secondary to-primary" },
      { id: "dv4", title: "Auspicious Day", tier: "Free", tone: "from-muted to-accent" },
    ],
  },
];

const ALL_CARDS = CATEGORIES.flatMap((c) => c.cards.map((card) => ({ ...card, category: c.name })));

function TemplateTile({ card }: { card: Card }) {
  return (
    <figure className="group relative overflow-hidden rounded-xl border border-border">
      <div className={`aspect-[4/3] w-full bg-gradient-to-br ${card.tone}`} />
      <span
        className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          card.tier === "Free"
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground"
        }`}
      >
        <Star className="h-3 w-3" /> {card.tier}
      </span>
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-3 text-xs font-semibold text-background">
        {card.title}
      </figcaption>
    </figure>
  );
}

const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function SocialMediaSection() {
  const [view, setView] = useState<"dashboard" | "list" | "mycards">("dashboard");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [tier, setTier] = useState("all");
  const [saved, setSaved] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      ALL_CARDS.filter(
        (c) =>
          (category === "all" || c.category === category) &&
          (tier === "all" || c.tier === tier) &&
          c.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, category, tier],
  );

  const toggleSave = (id: string) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-6 border-b border-border pb-2 text-sm">
        {(
          [
            ["dashboard", "Dashboard"],
            ["list", "Template List"],
            ["mycards", "My Card List"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`pb-2 ${view === id ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "dashboard" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCategory(c.name);
                  setView("list");
                }}
                className="rounded-xl border border-primary/25 bg-card p-5 text-left transition-shadow hover:shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary">
                  <Gem className="h-5 w-5 text-accent" />
                </span>
                <p className="mt-3 font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.blurb}</p>
              </button>
            ))}
          </div>

          {CATEGORIES.map((c) => (
            <section key={c.id} className="rounded-xl border border-primary/25 bg-card p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{c.name}</h3>
                <button
                  onClick={() => {
                    setCategory(c.name);
                    setView("list");
                  }}
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
                >
                  View All
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {c.cards.map((card) => (
                  <TemplateTile key={card.id} card={card} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {view === "list" && (
        <div className="space-y-5">
          <section className="rounded-xl border border-primary/25 bg-card p-4 md:p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Search</span>
                <span className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search templates"
                    className={`${inputClass} pl-9`}
                  />
                </span>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Category</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Tier</span>
                <select value={tier} onChange={(e) => setTier(e.target.value)} className={inputClass}>
                  <option value="all">All</option>
                  <option>Free</option>
                  <option>Premium</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-primary/25 bg-card p-4 md:p-5">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {filtered.length} Templates
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {filtered.map((card) => (
                <div key={card.id} className="space-y-2">
                  <TemplateTile card={card} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{card.category}</span>
                    <span className="flex gap-2">
                      <button
                        title="Save to my cards"
                        onClick={() => toggleSave(card.id)}
                        className={saved.includes(card.id) ? "text-accent" : "text-muted-foreground"}
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                      <button title="Download" className="text-primary">
                        <Download className="h-4 w-4" />
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No templates match your filters.
              </p>
            )}
          </section>
        </div>
      )}

      {view === "mycards" && (
        <section className="rounded-xl border border-primary/25 bg-card p-4 md:p-5">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            My Card List ({saved.length})
          </h3>
          {saved.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No saved cards yet. Save designs from the Template List.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {ALL_CARDS.filter((c) => saved.includes(c.id)).map((card) => (
                <TemplateTile key={card.id} card={card} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
