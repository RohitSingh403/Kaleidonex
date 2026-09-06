import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, User, Cookie, Link2, Share2, Lock, MessageSquare } from "lucide-react";
import { Eyebrow } from "@/components/ui-kit";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — KaleidoNex" },
      {
        name: "description",
        content:
          "Read KaleidoNex's privacy policy. Your privacy and data security are our top priorities.",
      },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    id: "introduction",
    label: "Introduction",
    icon: Shield,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The terms <strong>"We" / "Us" / "Our" / "Company"</strong> individually and collectively
          refer to KaleidoNex Learning Labs and the terms{" "}
          <strong>"You" / "Your" / "Yourself"</strong> refer to the users.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-secondary/50 px-5 py-4 text-sm text-muted-foreground leading-relaxed">
          This Privacy Policy is an electronic record formed under the Information Technology Act,
          2000 and the rules made thereunder. This Privacy Policy does not require any physical,
          electronic or digital signature.
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          This Privacy Policy is a legally binding document between you and KaleidoNex. The terms
          of this Privacy Policy will be effective upon your acceptance — directly or indirectly —
          by clicking on the "I accept" button or by use of the website by other means, and will
          govern the relationship between KaleidoNex and you for your use of this website.
        </p>
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-sm font-semibold text-primary">Legal Compliance</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            This document is published in accordance with the provisions of the Information
            Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or
            Information) Rules, 2011 under the Information Technology Act, 2000.
          </p>
        </div>
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-5 py-4">
          <p className="text-sm font-semibold text-destructive">Important Notice</p>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Please read this Privacy Policy carefully. By using the website, you indicate that you
            understand, agree and consent to this Privacy Policy. If you do not agree with the
            terms, please do not use this website.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "user-information",
    label: "User Information",
    icon: User,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When you use our website, we may collect personally identifiable information such as your
          name, email address, phone number, school name and other contact details that you
          voluntarily provide via contact forms, demo requests or account registration.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {[
            "Name, email address and phone number",
            "School or institution name and city",
            "Enquiry type and message content",
            "Device information and browser type",
            "Pages visited and time spent on site",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          We use this information solely to respond to your enquiries, improve our programmes and
          send relevant updates. We do not sell or rent your personal data to third parties.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    label: "Cookies",
    icon: Cookie,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Our website uses cookies to enhance user experience and collect analytical data. Cookies
          are small files stored on your device that help us understand how visitors interact with
          our site.
        </p>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          You can choose to accept or decline cookies through your browser settings. Declining
          cookies may prevent some features of this website from functioning correctly.
        </p>
      </>
    ),
  },
  {
    id: "external-links",
    label: "External Links",
    icon: Link2,
    content: (
      <p className="text-sm text-muted-foreground leading-relaxed">
        Our website may contain links to third-party websites. These links are provided for your
        convenience. KaleidoNex does not endorse or take responsibility for the content, privacy
        practices or availability of external websites. We encourage you to review the privacy
        policies of any site you visit.
      </p>
    ),
  },
  {
    id: "information-sharing",
    label: "Information Sharing",
    icon: Share2,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          KaleidoNex does not sell, trade or rent your personal information to third parties. We
          may share your information only in the following circumstances:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {[
            "With trusted service providers who assist in operating our website",
            "When required by law or in response to legal process",
            "To protect the rights, property or safety of KaleidoNex or others",
            "With your explicit written consent",
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
    id: "information-security",
    label: "Information Security",
    icon: Lock,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We implement industry-standard security measures to protect your personal information
          against unauthorised access, alteration, disclosure or destruction. Our systems are
          regularly reviewed for vulnerabilities.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-secondary/50 px-5 py-4">
          <p className="text-sm font-semibold">Your Data is Protected</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We follow industry best practices to secure your personal information, including
            encrypted data transmission and restricted internal access.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "grievance-redressal",
    label: "Grievance Redressal",
    icon: MessageSquare,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you have any concerns or grievances regarding the collection, use or disclosure of your
          personal information, please contact our grievance officer:
        </p>
        <div className="mt-4 rounded-lg border border-border bg-card p-5 text-sm">
          <p className="font-semibold">KaleidoNex Learning Labs</p>
          <p className="mt-2 text-muted-foreground">Email: kaleidonextechnologies@gmail.com</p>
          <p className="text-muted-foreground">Phone: +91 9798243828</p>
          <p className="text-muted-foreground">Hours: Mon–Sat, 9:30am–5:30pm IST</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          We will address your grievance within 30 days of receipt.
        </p>
      </>
    ),
  },
];

function PrivacyPage() {
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
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl font-bold md:text-5xl">Privacy Policy</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-3 text-lg text-muted-foreground">
              Your privacy and data security are our top priorities
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
                <Shield className="h-3.5 w-3.5 text-accent" /> Policy Sections
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
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-emerald-500" /> Your Data is Protected
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                We follow industry best practices to secure your personal information.
              </p>
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
