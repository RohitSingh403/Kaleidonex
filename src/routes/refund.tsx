import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw, Info, XCircle, RotateCcw, Mail, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — KaleidoNex" },
      {
        name: "description",
        content:
          "Your satisfaction is our priority. Learn about KaleidoNex's refund and cancellation procedures.",
      },
    ],
  }),
  component: RefundPage,
});

const sections = [
  {
    id: "introduction",
    label: "Introduction",
    icon: Info,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Our focus is complete customer satisfaction. In the event that you are displeased with
          the services provided, we will work to resolve the issue, and where applicable, process a
          refund — provided the reasons are genuine and verified after investigation.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-secondary/50 px-5 py-4 text-sm text-muted-foreground">
          <strong>Important Notice:</strong> Please read the fine print of each service agreement
          before making a purchase. All service details, scope and deliverables are clearly
          communicated before onboarding.
        </div>
        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          In case of dissatisfaction with our services, clients have the liberty to cancel their
          programme and request a refund from us. Our policy for cancellation and refund is as
          follows:
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-secondary/40 p-5">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
              <XCircle className="h-4 w-4 text-primary" />
            </div>
            <p className="font-semibold text-sm">Easy Cancellation</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Simple and straightforward cancellation process for all services.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/40 p-5">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-accent/10">
              <RotateCcw className="h-4 w-4 text-accent" />
            </div>
            <p className="font-semibold text-sm">Quick Refunds</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fast refund processing for eligible cases after thorough investigation.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <Info className="h-4 w-4" /> Important Notice
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Refund eligibility is subject to thorough investigation of your case. Please ensure you
            provide all necessary details when submitting a refund request. Multiple demo classes or
            completed services may not be eligible for refunds.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "cancellation",
    label: "Cancellation Policy",
    icon: XCircle,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You may request a cancellation of your school programme at any time by contacting our
          team in writing. The following conditions apply:
        </p>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          {[
            {
              label: "Before programme commencement",
              detail: "Full refund of any advance payment, minus documentation charges.",
            },
            {
              label: "Within 30 days of commencement",
              detail: "Partial refund based on services rendered and lab setup costs incurred.",
            },
            {
              label: "After 30 days of commencement",
              detail:
                "No refund for services already delivered. Equipment returned in original condition may be eligible for partial credit.",
            },
            {
              label: "Kit and equipment purchases",
              detail:
                "Non-refundable once dispatched, unless damaged or defective upon arrival.",
            },
          ].map((item) => (
            <li key={item.label} className="rounded-lg border border-border bg-secondary/40 p-4">
              <p className="font-semibold">{item.label}</p>
              <p className="mt-1 text-xs">{item.detail}</p>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "refund-policy",
    label: "Refund Policy",
    icon: RotateCcw,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          KaleidoNex evaluates each refund request individually. Refunds will be processed to the
          original payment method within 7–14 business days of approval.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {[
            "Refund requests must be submitted in writing via email",
            "All relevant documentation and invoice details must be provided",
            "Approved refunds will be processed within 7–14 business days",
            "Bank charges or payment gateway fees are non-refundable",
            "Partially consumed services will receive pro-rated refunds",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "refund-process",
    label: "Refund Process",
    icon: Mail,
    content: (
      <>
        <p className="text-sm text-muted-foreground leading-relaxed">
          To initiate a refund, please follow these steps:
        </p>
        <ol className="mt-4 space-y-3 text-sm">
          {[
            "Email us at kaleidonextechnologies@gmail.com with subject line: 'Refund Request — [Your School Name]'",
            "Include your invoice number, programme details and reason for the refund request",
            "Our team will acknowledge your request within 2 business days",
            "We will investigate the claim and may contact you for additional information",
            "Once approved, the refund will be processed within 7–14 business days",
          ].map((step, i) => (
            <li key={i} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <span className="font-display shrink-0 text-lg font-bold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-muted-foreground">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-xl border border-border bg-card p-5 text-sm">
          <p className="font-semibold">Need help?</p>
          <p className="mt-2 text-muted-foreground">
            Contact our support team at{" "}
            <a
              href="mailto:kaleidonextechnologies@gmail.com"
              className="text-primary hover:underline"
            >
              kaleidonextechnologies@gmail.com
            </a>{" "}
            or call{" "}
            <a href="tel:+919798243828" className="text-primary hover:underline">
              +91 9798243828
            </a>
            .
          </p>
          <p className="mt-1 text-muted-foreground">Mon–Sat, 9:30am–5:30pm IST</p>
        </div>
      </>
    ),
  },
];

function RefundPage() {
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
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl font-bold md:text-5xl">Refund &amp; Cancellation Policy</h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-3 text-lg text-muted-foreground">
              Your satisfaction is our priority. Learn about our refund and cancellation procedures.
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
                <RefreshCw className="h-3.5 w-3.5 text-accent" /> Policy Sections
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
                <Mail className="h-3.5 w-3.5 text-emerald-500" /> Quick Support
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Need immediate assistance? Contact our support team for help with refunds.
              </p>
              <a
                href="mailto:kaleidonextechnologies@gmail.com"
                className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
              >
                kaleidonextechnologies@gmail.com
              </a>
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
