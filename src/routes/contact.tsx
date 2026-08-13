import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageHero, Section } from "@/components/ui-kit";
import { getSupabase, BACKEND_UNAVAILABLE } from "@/lib/supabase-optional";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact KaleidoNex — Partnerships, Support & Careers" },
      {
        name: "description",
        content:
          "Reach the KaleidoNex team for school partnerships, product enquiries, teacher training support or careers.",
      },
      { property: "og:title", content: "Contact KaleidoNex" },
      {
        property: "og:description",
        content: "Partnerships, product enquiries, support and careers — get in touch.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const enquiryType = String(data.get("type") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (message.length < 10) {
      setError("Please write at least a sentence so we can route your enquiry.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const client = getSupabase();
    if (!client) {
      setSubmitting(false);
      setError(BACKEND_UNAVAILABLE);
      return;
    }
    const { error: insertError } = await client.from("leads").insert({
      type: "contact",
      name,
      email,
      enquiry_type: enquiryType,
      message,
    });

    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong. Please try again or email us directly.");
      return;
    }
    setSent(true);
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the team"
        description="Partnerships, procurement, teacher training or careers — send a note and we will route it to the right person."
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            {sent ? (
              <div className="py-10 text-center">
                <h2 className="text-2xl font-bold">Message sent</h2>
                <p className="mt-3 text-muted-foreground">
                  Thanks for reaching out. Expect a reply within one working day.
                </p>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="grid gap-5">
                <label className="grid gap-2 text-sm font-medium">
                  Name
                  <input
                    name="name"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Email
                  <input
                    name="email"
                    type="email"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Enquiry type
                  <select
                    name="type"
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option>School partnership</option>
                    <option>Product / procurement</option>
                    <option>Teacher training</option>
                    <option>Careers</option>
                    <option>Something else</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Message
                  <textarea
                    name="message"
                    rows={5}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
                <button
                  type="submit"
                  disabled={submitting}
                  className="justify-self-start rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>

          <div className="grid gap-5 self-start">
            {[
              ["Partnerships", "partnerships@KaleidoNex.example", "+91 9798243828"],
              ["Support", "support@KaleidoNex.example", "Mon–Sat, 9:30am–6:30pm IST"],
              ["Careers", "careers@KaleidoNex.example", "Trainers, engineers, programme managers"],
            ].map(([title, a, b]) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-soft">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{a}</p>
                <p className="text-sm text-muted-foreground">{b}</p>
              </div>
            ))}
            <div className="rounded-xl border border-border bg-secondary/40 p-6">
              <h2 className="font-semibold">Head office</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sitapura RIICO Industrial Area, Jaipur 302001, Rajasthan, India


              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
