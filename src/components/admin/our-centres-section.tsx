import { useState } from "react";
import { MapPin, Plus, Minus, Phone, Mail } from "lucide-react";

type Centre = {
  id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  /** percentage position on the map canvas */
  x: number;
  y: number;
};

const CENTRES: Centre[] = [
  {
    id: "c1",
    name: "Kaleidonex HQ",
    city: "New Delhi",
    state: "Delhi",
    phone: "+91 98100 00001",
    email: "delhi@kaleidonex.com",
    x: 34,
    y: 30,
  },
  {
    id: "c2",
    name: "Kaleidonex Innovation Lab",
    city: "Bengaluru",
    state: "Karnataka",
    phone: "+91 98100 00002",
    email: "bengaluru@kaleidonex.com",
    x: 38,
    y: 74,
  },
  {
    id: "c3",
    name: "Kaleidonex Training Centre",
    city: "Pune",
    state: "Maharashtra",
    phone: "+91 98100 00003",
    email: "pune@kaleidonex.com",
    x: 28,
    y: 62,
  },
  {
    id: "c4",
    name: "Kaleidonex East Hub",
    city: "Kolkata",
    state: "West Bengal",
    phone: "+91 98100 00004",
    email: "kolkata@kaleidonex.com",
    x: 66,
    y: 44,
  },
];

export function OurCentresSection() {
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<Centre>(CENTRES[0]!);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-accent/50 bg-card p-3 md:p-4">
        <div className="relative overflow-hidden rounded-lg bg-muted/60 surface-grid">
          <div className="absolute left-3 top-3 z-10 flex flex-col overflow-hidden rounded-md border border-border bg-background">
            <button
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))}
              className="border-b border-border p-1.5 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
              className="p-1.5 text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <div
            className="relative mx-auto aspect-[16/7] w-full transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          >
            {CENTRES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-full"
                title={`${c.name}, ${c.city}`}
              >
                <MapPin
                  className={`h-6 w-6 drop-shadow ${selected.id === c.id ? "text-accent" : "text-primary"}`}
                />
                <span className="block text-[10px] font-medium text-muted-foreground">{c.city}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-primary/25 bg-card p-4 md:p-5 lg:col-span-2">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Our Centres ({CENTRES.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Centre</th>
                  <th className="py-2 pr-3">City</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3">Contact</th>
                </tr>
              </thead>
              <tbody>
                {CENTRES.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`cursor-pointer border-b border-border/60 ${selected.id === c.id ? "bg-secondary/60" : ""}`}
                  >
                    <td className="py-3 pr-3 font-medium">{c.name}</td>
                    <td className="py-3 pr-3">{c.city}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{c.state}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{c.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-primary/25 bg-card p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Centre Details
          </h3>
          <p className="text-lg font-bold">{selected.name}</p>
          <p className="text-sm text-muted-foreground">
            {selected.city}, {selected.state}
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-primary">
              <Phone className="h-4 w-4" /> {selected.phone}
            </a>
            <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-primary">
              <Mail className="h-4 w-4" /> {selected.email}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
