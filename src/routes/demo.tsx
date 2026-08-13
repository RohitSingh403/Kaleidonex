import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PageHero, Section } from "@/components/ui-kit";
import { getSupabase, BACKEND_UNAVAILABLE } from "@/lib/supabase-optional";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Request a Demo — Kaleidonex School Programmes" },
      {
        name: "description",
        content:
          "Book a 30-minute walkthrough of Kaleidonex's coding, AI, robotics and STEM programme for your school and get a costed rollout plan.",
      },
      { property: "og:title", content: "Request an Kaleidonex Demo" },
      {
        property: "og:description",
        content: "Book a 30-minute school walkthrough and receive a rollout plan.",
      },
    ],
  }),
  component: Demo,
});

type Errors = Record<string, string>;

const interests = ["Coding", "Robotics lab", "AI lab", "STEM lab", "VR learning", "Entrepreneurship"];

function Demo() {
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const school = String(data.get("school") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const role = String(data.get("role") ?? "").trim();
    const size = String(data.get("size") ?? "").trim();
    const selectedInterests = data.getAll("interest").map(String);

    if (name.length < 2) next["name"] = "Please enter your full name.";
    if (school.length < 2) next["school"] = "Please enter your school or trust name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next["email"] = "Enter a valid email address.";
    if (!/^\+?[0-9\s-]{10,15}$/.test(phone)) next["phone"] = "Enter a valid phone number.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setServerError(null);

    const client = getSupabase();
    if (!client) {
      setSubmitting(false);
      setServerError(BACKEND_UNAVAILABLE);
      return;
    }
    const { error: insertError } = await client.from("leads").insert({
      type: "demo",
      name,
      email,
      phone,
      school,
      enquiry_type: `${role} · ${size}`,
      message: message || "No additional notes.",
      interests: selectedInterests,
    });

    setSubmitting(false);
    if (insertError) {
      setServerError("Something went wrong. Please try again or call us.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <>
      <PageHero
        eyebrow="Request a demo"
        title="See the programme before you commit"
        description="Share a few details and our partnerships team will schedule a 30-minute walkthrough within two working days."
      />

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            {submitted ? (
              <div className="py-10 text-center">
                <h2 className="text-2xl font-bold">Request received</h2>
                <p className="mt-3 text-muted-foreground">
                  Thank you. Our partnerships team will contact you within two working days to
                  confirm a slot.
                </p>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="grid gap-5">
                <Field label="Full name" name="name" error={errors["name"]} />
                <Field label="School / trust name" name="school" error={errors["school"]} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Work email" name="email" type="email" error={errors["email"]} />
                  <Field label="Phone" name="phone" type="tel" error={errors["phone"]} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    Role
                    <select
                      name="role"
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option>Principal</option>
                      <option>Trustee / Management</option>
                      <option>Academic head</option>
                      <option>Teacher</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    Number of students
                    <select
                      name="size"
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option>Under 300</option>
                      <option>300–800</option>
                      <option>800–2000</option>
                      <option>2000+</option>
                    </select>
                  </label>
                </div>

                <fieldset className="grid gap-2">
                  <legend className="text-sm font-medium">Interested in</legend>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {interests.map((i) => (
                      <label
                        key={i}
                        className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm"
                      >
                        <input type="checkbox" name="interest" value={i} className="accent-primary" />
                        {i}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="grid gap-2 text-sm font-medium">
                  Anything we should know?
                  <textarea
                    name="message"
                    rows={4}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>

                {serverError ? <p className="text-xs text-destructive">{serverError}</p> : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="justify-self-start rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Request demo"}
                </button>
              </form>
            )}
          </div>

          <aside className="rounded-2xl border border-border bg-secondary/40 p-8">
            <h2 className="text-lg font-semibold">What happens next</h2>
            <ol className="mt-4 space-y-4 text-sm text-muted-foreground">
              <li>1. A partnerships lead calls to understand your grades and goals.</li>
              <li>2. We run a live walkthrough with curriculum and kit samples.</li>
              <li>3. You receive a costed rollout plan and reference schools.</li>
            </ol>
            <p className="mt-6 text-sm text-muted-foreground">
              Prefer to talk now? Call +91 98000 00000 or email partnerships@kaleidonex.example.
            </p>
          </aside>
        </div>
      </Section>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string | undefined;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}
    </label>
  );
}
