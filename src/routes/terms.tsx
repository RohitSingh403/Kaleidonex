import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ScrollText, Info, FileText, Shield, AlertCircle, Scale } from "lucide-react";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — KaleidoNex" },
      {
        name: "description",
        content:
          "Read KaleidoNex's Terms and Conditions. Please read these terms carefully before using our website and services.",
      },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    id: "introduction",
    label: "Introduction",
    icon: Info,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The terms <strong>"We" / "Us" / "Our" / "Company"</strong> individually and collectively
          refer to KaleidoNex Learning Labs and the terms <strong>"Visitor" / "User"</strong> refer
          to the users.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-secondary/50 px-5 py-4 text-sm text-muted-foreground leading-relaxed">
          This page states the Terms and Conditions under which you (Visitor) may visit this website
          ("kaleidonex.com"). Please read this page carefully. If you do not accept the Terms and
          Conditions stated here, we would request you to exit this site.
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          KaleidoNex, any of its business divisions and/or its subsidiaries, associate companies or
          subsidiaries reserve their respective rights to revise these Terms and Conditions at any
          time by updating this posting. You should visit this page periodically to re-appraise
          yourself of the Terms and Conditions, because they are binding on all users of this
          website.
        </p>
      </>
    ),
  },
  {
    id: "use-of-content",
    label: "Use of Content",
    icon: FileText,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All content on this website — including but not limited to text, graphics, logos, images,
          curriculum materials and programme descriptions — is the property of KaleidoNex Learning
          Labs and is protected by applicable intellectual property laws.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {[
            "You may not reproduce or distribute any content without prior written permission",
            "You may not modify or create derivative works from our content",
            "You may not use our content for commercial purposes without consent",
            "You may share links to our pages for non-commercial, informational purposes",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "acceptable-use",
    label: "Acceptable Use",
    icon: Shield,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You agree to use this website only for lawful purposes and in a manner that does not
          infringe the rights of others. Prohibited activities include:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {[
            "Transmitting any unlawful, harmful or objectionable content",
            "Attempting to gain unauthorised access to any part of the website",
            "Using automated tools to scrape or harvest data from the website",
            "Impersonating any person or entity",
            "Uploading or transmitting malicious code or software",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "indemnity",
    label: "Indemnity",
    icon: Scale,
    content: (
      <p className="text-sm text-muted-foreground leading-relaxed">
        You agree to indemnify and hold KaleidoNex Learning Labs, its officers, directors,
        employees and agents harmless from any claims, losses, damages, liabilities and expenses
        (including legal fees) arising out of or related to your use of this website or violation of
        these Terms and Conditions.
      </p>
    ),
  },
  {
    id: "liability",
    label: "Liability",
    icon: AlertCircle,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          KaleidoNex makes no warranties, express or implied, regarding the accuracy, reliability or
          completeness of the content on this website. To the maximum extent permitted by applicable
          law:
        </p>
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-muted-foreground">
          KaleidoNex shall not be liable for any indirect, incidental, special, consequential or
          punitive damages arising out of or related to your use of or inability to use this website
          or its content.
        </div>
      </>
    ),
  },
  {
    id: "disclaimer",
    label: "Disclaimer",
    icon: ScrollText,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The information on this website is provided on an "as is" and "as available" basis without
          any representation or endorsement and without warranty of any kind whether express or
          implied.
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          These Terms and Conditions are governed by and construed in accordance with the laws of
          India. Any disputes relating to these terms shall be subject to the exclusive jurisdiction
          of the courts in India.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-card p-5 text-sm">
          <p className="font-semibold">Contact Us</p>
          <p className="mt-2 text-muted-foreground">kaleidonextechnologies@gmail.com</p>
          <p className="text-muted-foreground">+91 9798243828 · Mon–Sat, 9:30am–5:30pm IST</p>
        </div>
      </>
    ),
  },
];

function TermsPage() {
  const [active, setActive] = useState("introduction");
  const activeSection = sections.find((s) => s.id === active)!;
  const ActiveIcon = activeSection.icon;

  return (
    <>
      {/* Hero */}
      <div className="surface-grid border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center md:py-20">
          <Reveal>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-border bg-card shadow-soft">
              <ScrollText className="h-6 w-6 text-primary" />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl font-bold md:text-5xl">Terms &amp; Conditions</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-3 text-lg text-muted-foreground">
              Please read these terms carefully before using our website and services
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-2 text-xs text-muted-foreground">Last updated: September 2026</p>
          </Reveal>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <ScrollText className="h-3.5 w-3.5 text-accent" /> Quick Navigation
              </p>
              <nav className="space-y-1">
                {sections.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActive(s.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        active === s.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {s.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
                <ActiveIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{activeSection.label}</h2>
                <p className="text-xs text-muted-foreground">Last updated: September 2026</p>
              </div>
            </div>
            <div className="mt-6">{activeSection.content}</div>
          </div>
        </div>
      </div>
    </>
  );
}
