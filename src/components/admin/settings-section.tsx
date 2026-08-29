import { useEffect, useState } from "react";
import { Bell, Check, Globe, Monitor, Save, Shield } from "lucide-react";

type GeneralSettings = {
  organisation: string;
  supportEmail: string;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  weekStart: string;
  theme: string;
  density: string;
  emailAlerts: boolean;
  leaveAlerts: boolean;
  claimAlerts: boolean;
  weeklyDigest: boolean;
  twoFactor: boolean;
  sessionTimeout: string;
};

const STORAGE_KEY = "kaleidonex.settings.general";

const DEFAULTS: GeneralSettings = {
  organisation: "Kaleidonex",
  supportEmail: "support@kaleidonex.com",
  language: "English",
  timezone: "Asia/Kolkata (IST)",
  dateFormat: "DD/MM/YYYY",
  currency: "INR (₹)",
  weekStart: "Monday",
  theme: "System",
  density: "Comfortable",
  emailAlerts: true,
  leaveAlerts: true,
  claimAlerts: false,
  weeklyDigest: true,
  twoFactor: false,
  sessionTimeout: "30 minutes",
};

function Card({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Globe;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-soft transition-transform ${
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsSection() {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed local settings */
    }
  }, []);

  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
    } catch {
      /* storage unavailable */
    }
  };

  const reset = () => {
    setSettings(DEFAULTS);
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          icon={Globe}
          title="General"
          description="Organisation identity and regional formats."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Organisation name">
              <input
                className={inputClass}
                value={settings.organisation}
                onChange={(e) => set("organisation", e.target.value)}
              />
            </Field>
            <Field label="Support email">
              <input
                type="email"
                className={inputClass}
                value={settings.supportEmail}
                onChange={(e) => set("supportEmail", e.target.value)}
              />
            </Field>
            <Field label="Language">
              <select
                className={inputClass}
                value={settings.language}
                onChange={(e) => set("language", e.target.value)}
              >
                {["English", "Hindi", "Marathi", "Tamil"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Time zone">
              <select
                className={inputClass}
                value={settings.timezone}
                onChange={(e) => set("timezone", e.target.value)}
              >
                {["Asia/Kolkata (IST)", "Asia/Dubai (GST)", "Europe/London (GMT)", "UTC"].map(
                  (o) => (
                    <option key={o}>{o}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Date format">
              <select
                className={inputClass}
                value={settings.dateFormat}
                onChange={(e) => set("dateFormat", e.target.value)}
              >
                {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Currency">
              <select
                className={inputClass}
                value={settings.currency}
                onChange={(e) => set("currency", e.target.value)}
              >
                {["INR (₹)", "USD ($)", "AED (د.إ)", "GBP (£)"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Week starts on">
              <select
                className={inputClass}
                value={settings.weekStart}
                onChange={(e) => set("weekStart", e.target.value)}
              >
                {["Monday", "Sunday", "Saturday"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card
          icon={Monitor}
          title="Appearance"
          description="How the admin workspace looks on this device."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Theme">
              <select
                className={inputClass}
                value={settings.theme}
                onChange={(e) => set("theme", e.target.value)}
              >
                {["System", "Light", "Dark"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Layout density">
              <select
                className={inputClass}
                value={settings.density}
                onChange={(e) => set("density", e.target.value)}
              >
                {["Comfortable", "Compact"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card
          icon={Bell}
          title="Notifications"
          description="Choose which updates reach your inbox."
        >
          <Toggle
            label="Email alerts"
            description="Receive important account and system notices."
            checked={settings.emailAlerts}
            onChange={(v) => set("emailAlerts", v)}
          />
          <Toggle
            label="Leave updates"
            description="Notify me when a leave application changes status."
            checked={settings.leaveAlerts}
            onChange={(v) => set("leaveAlerts", v)}
          />
          <Toggle
            label="Expense claim updates"
            description="Notify me when a claim is approved, paid or rejected."
            checked={settings.claimAlerts}
            onChange={(v) => set("claimAlerts", v)}
          />
          <Toggle
            label="Weekly digest"
            description="A Monday summary of tasks, students and claims."
            checked={settings.weeklyDigest}
            onChange={(v) => set("weeklyDigest", v)}
          />
        </Card>

        <Card
          icon={Shield}
          title="Security & session"
          description="Protect access to the admin workspace."
        >
          <Toggle
            label="Two-factor prompt"
            description="Ask for an emailed code on new devices."
            checked={settings.twoFactor}
            onChange={(v) => set("twoFactor", v)}
          />
          <Field label="Auto sign-out after inactivity">
            <select
              className={inputClass}
              value={settings.sessionTimeout}
              onChange={(e) => set("sessionTimeout", e.target.value)}
            >
              {["15 minutes", "30 minutes", "1 hour", "4 hours", "Never"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-muted-foreground">
            Password changes are handled in the profile menu under Profile → Security.
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-lg border border-border bg-card px-5 py-4">
        {saved && (
          <span className="mr-auto flex items-center gap-1.5 text-xs font-medium text-primary">
            <Check className="h-4 w-4" /> Settings saved
          </span>
        )}
        <button
          type="button"
          onClick={reset}
          className="btn-press rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={save}
          className="btn-shimmer inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Save className="h-4 w-4" /> Save changes
        </button>
      </div>
    </div>
  );
}
