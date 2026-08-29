import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Mail,
  Save,
  Shield,
  Sparkles,
  Upload,
  User as UserIcon,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { getSupabase, BACKEND_UNAVAILABLE } from "@/lib/supabase-optional";

export type ProfileTab = "calendar" | "sop" | "profile" | "security" | "business";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "sop", label: "TrainerSop" },
  { id: "profile", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "business", label: "Business Info" },
];

const BUSINESS_KEY = "kaleidonex.businessInfo";
const PROFILE_KEY = "kaleidonex.profileInfo";

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>{children}</div>
  );
}

function PanelHeader({ icon: Icon, title }: { icon: typeof UserIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="text-xs font-semibold uppercase tracking-wide">{title}</h2>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary";

export function MyProfileSection({
  initialTab = "profile",
  userEmail,
  userName,
}: {
  initialTab?: ProfileTab;
  userEmail?: string | undefined;
  userName?: string | undefined;
}) {
  const [tab, setTab] = useState<ProfileTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 border-b border-border sm:gap-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm transition-colors ${
              tab === t.id
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "calendar" && <CalendarTab />}
      {tab === "sop" && <SopTab />}
      {tab === "profile" && <ProfileTab userEmail={userEmail} userName={userName} />}
      {tab === "security" && <SecurityTab />}
      {tab === "business" && <BusinessTab />}
    </div>
  );
}

/* ------------------------------- Calendar ------------------------------- */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type CalView = "month" | "week" | "day";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function CalendarTab() {
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState<CalView>("month");
  const today = startOfDay(new Date());

  const cells = useMemo(() => {
    if (view === "day") return [new Date(cursor)];
    if (view === "week") {
      const start = new Date(cursor);
      start.setDate(start.getDate() - start.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor, view]);

  function shift(dir: -1 | 1) {
    const next = new Date(cursor);
    if (view === "month") next.setMonth(next.getMonth() + dir);
    else if (view === "week") next.setDate(next.getDate() + dir * 7);
    else next.setDate(next.getDate() + dir);
    setCursor(startOfDay(next));
  }

  const title =
    view === "day"
      ? cursor.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
      : cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <Panel className="p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            aria-label="Previous"
            className="rounded-md border border-border p-1.5 transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => shift(1)}
            aria-label="Next"
            className="rounded-md border border-border p-1.5 transition-colors hover:bg-secondary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(today)}
            className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground transition-opacity hover:opacity-90"
          >
            today
          </button>
        </div>
        <h2 className="order-last w-full text-center text-lg font-semibold sm:order-none sm:w-auto">
          {title}
        </h2>
        <div className="flex overflow-hidden rounded-md border border-border">
          {(["month", "week", "day"] as CalView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                view === v ? "bg-ink text-ink-foreground" : "bg-card hover:bg-secondary"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[640px]">
          {view !== "day" && (
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-xs font-semibold">
                  {d}
                </div>
              ))}
            </div>
          )}
          <div className={view === "day" ? "grid grid-cols-1" : "grid grid-cols-7"}>
            {cells.map((d) => {
              const outside = view === "month" && d.getMonth() !== cursor.getMonth();
              const isToday = d.getTime() === today.getTime();
              return (
                <div
                  key={d.toISOString()}
                  className={`min-h-[86px] border-b border-r border-border p-2 text-right text-xs ${
                    isToday ? "bg-accent/10" : ""
                  } ${outside ? "text-muted-foreground/50" : "text-foreground"}`}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------- TrainerSop ------------------------------- */

function SopTab() {
  return (
    <Panel>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold uppercase tracking-wide">Trainer SOP</h2>
      </div>
      <div className="bg-muted/40 p-6">
        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="relative bg-ink px-8 py-16 text-center text-ink-foreground">
            <h3 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
              TRAINER SOP MANUAL
            </h3>
            <div className="mx-auto mt-4 h-1 w-14 rounded bg-accent" />
            <p className="mt-8 text-sm text-ink-foreground/80">Prepared By :</p>
            <p className="mt-2 font-display text-2xl font-bold">
              <span className="text-accent">K</span>aleido<span className="text-accent">n</span>ex
            </p>
            <ul className="mt-8 space-y-1 text-xs text-ink-foreground/70">
              <li>hr@kaleidonex.com</li>
              <li>www.kaleidonex.com</li>
            </ul>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
            <span>Standard operating procedures for trainers</span>
            <button
              onClick={() => toast.info("The SOP manual document has not been uploaded yet.")}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 transition-colors hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* -------------------------------- Profile -------------------------------- */

type ProfileData = { fullName: string; email: string; organization: string };

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ProfileTab({
  userEmail,
  userName,
}: {
  userEmail?: string | undefined;
  userName?: string | undefined;
}) {
  const [data, setData] = useState<ProfileData>({
    fullName: userName ?? "",
    email: userEmail ?? "",
    organization: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProfileData>;
        setData((d) => ({ ...d, ...parsed }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data.fullName.trim() || !data.email.trim()) {
      toast.error("Full name and email address are required.");
      return;
    }
    setSaving(true);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
      const client = getSupabase();
      if (client) {
        const { error } = await client.auth.updateUser({
          data: { full_name: data.fullName, organization: data.organization },
        });
        if (error) throw error;
      }
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader icon={UserIcon} title="Edit Profile" />
        <form onSubmit={save} className="space-y-4 p-4 sm:p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-name">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              id="pf-name"
              className={inputClass}
              value={data.fullName}
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-email">
              Email Address <span className="text-destructive">*</span>
            </label>
            <input
              id="pf-email"
              type="email"
              className={inputClass}
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="pf-org">
              Organization
            </label>
            <input
              id="pf-org"
              className={inputClass}
              value={data.organization}
              onChange={(e) => setData({ ...data, organization: e.target.value })}
            />
          </div>
          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Update Profile
            </button>
          </div>
        </form>
      </Panel>

      <Panel>
        <PanelHeader icon={Shield} title="Account Information" />
        <div className="space-y-6 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard icon={UserIcon} label="Full Name" value={data.fullName || "—"} />
            <InfoCard icon={Mail} label="Email" value={data.email || "—"} />
            <InfoCard icon={Shield} label="Role" value="Admin" />
            <InfoCard icon={Building2} label="Organization" value={data.organization || "—"} />
            <InfoCard
              icon={CalendarIcon}
              label="Last Login"
              value={new Date().toLocaleString()}
            />
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-muted-foreground" /> Key Permissions
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard icon={FileText} label="Template Access" value="All templates" />
              <InfoCard icon={Download} label="Export Options" value="1 format" />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Quick Stats</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: FileText, label: "Templates", value: "2" },
                { icon: Sparkles, label: "AI Credits", value: "0" },
                { icon: Download, label: "Export Formats", value: "1" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-border bg-card p-4 text-center"
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-ink text-ink-foreground">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* -------------------------------- Security -------------------------------- */

function PasswordField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:items-center">
      <label htmlFor={id} className="text-sm font-medium">
        {label} <span className="text-destructive">*</span>
      </label>
      <div>
        <div className="flex">
          <input
            id={id}
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} rounded-r-none`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="rounded-r-md border border-l-0 border-input px-3 transition-colors hover:bg-secondary"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !next || !confirm) {
      toast.error("All password fields are required.");
      return;
    }
    if (next.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (next !== confirm) {
      toast.error("New password and confirmation do not match.");
      return;
    }
    const client = getSupabase();
    if (!client) {
      toast.error(BACKEND_UNAVAILABLE);
      return;
    }
    setSaving(true);
    try {
      const { error } = await client.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <PanelHeader icon={KeyRound} title="Change Password" />
      <form onSubmit={submit} className="space-y-4 p-4 sm:p-5">
        <PasswordField id="cur-pass" label="Current Password" value={current} onChange={setCurrent} />
        <PasswordField
          id="new-pass"
          label="New Password"
          value={next}
          onChange={setNext}
          hint="Password must be at least 6 characters long"
        />
        <PasswordField
          id="conf-pass"
          label="Confirm New Password"
          value={confirm}
          onChange={setConfirm}
        />
        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Change Password
          </button>
        </div>
      </form>
    </Panel>
  );
}

/* ------------------------------ Business Info ------------------------------ */

type BusinessData = {
  name: string;
  phone: string;
  email: string;
  tagline: string;
  website: string;
  instagram: string;
  logoPosition: "Left" | "Center" | "Right";
  logoDataUrl: string;
};

const emptyBusiness: BusinessData = {
  name: "",
  phone: "",
  email: "",
  tagline: "",
  website: "",
  instagram: "",
  logoPosition: "Center",
  logoDataUrl: "",
};

function BusinessTab() {
  const [data, setData] = useState<BusinessData>(emptyBusiness);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BUSINESS_KEY);
      if (raw) setData({ ...emptyBusiness, ...(JSON.parse(raw) as Partial<BusinessData>) });
    } catch {
      /* ignore */
    }
  }, []);

  function onLogo(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      toast.error("Please upload a PNG or JPG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setData((d) => ({ ...d, logoDataUrl: String(reader.result) }));
    reader.onerror = () => toast.error("Could not read the selected file.");
    reader.readAsDataURL(file);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data.name.trim()) {
      toast.error("Business name is required.");
      return;
    }
    try {
      localStorage.setItem(BUSINESS_KEY, JSON.stringify(data));
      toast.success("Business information saved.");
    } catch {
      toast.error("Could not save business information on this device.");
    }
  }

  return (
    <Panel>
      <PanelHeader icon={Building2} title="Business Information" />
      <form onSubmit={save} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-name">
              Business Name <span className="text-destructive">*</span>
            </label>
            <input
              id="bi-name"
              className={inputClass}
              placeholder="Enter your business name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-phone">
                Phone Number
              </label>
              <input
                id="bi-phone"
                className={inputClass}
                placeholder="+91 98765 43210"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-email">
                Business Email
              </label>
              <input
                id="bi-email"
                type="email"
                className={inputClass}
                placeholder="business@example.com"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-tagline">
              Tagline
            </label>
            <input
              id="bi-tagline"
              maxLength={100}
              className={inputClass}
              placeholder="Your business tagline or slogan"
              value={data.tagline}
              onChange={(e) => setData({ ...data, tagline: e.target.value })}
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>Brief description that represents your business</span>
              <span>{data.tagline.length}/100</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-web">
                Website
              </label>
              <input
                id="bi-web"
                className={inputClass}
                placeholder="https://example.com"
                value={data.website}
                onChange={(e) => setData({ ...data, website: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="bi-ig">
                Instagram
              </label>
              <input
                id="bi-ig"
                className={inputClass}
                placeholder="@username"
                value={data.instagram}
                onChange={(e) => setData({ ...data, instagram: e.target.value })}
              />
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium">Logo Position</p>
            <div className="flex flex-wrap gap-2">
              {(["Left", "Center", "Right"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setData({ ...data, logoPosition: p })}
                  className={`rounded-md border px-5 py-1.5 text-sm transition-colors ${
                    data.logoPosition === p
                      ? "border-ink bg-ink text-ink-foreground"
                      : "border-primary text-primary hover:bg-secondary"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose where your logo will appear on documents and receipts
            </p>
          </div>
          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90"
            >
              <Save className="h-4 w-4" /> Save Business Info
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-sm font-semibold text-primary">BUSINESS LOGO</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your company logo for branding
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mx-auto mt-6 grid h-44 w-44 place-items-center rounded-full border-2 border-dashed border-border transition-colors hover:border-primary"
          >
            {data.logoDataUrl ? (
              <img
                src={data.logoDataUrl}
                alt="Business logo preview"
                className="h-40 w-40 rounded-full object-contain"
              />
            ) : (
              <span className="space-y-2">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">
                  <Upload className="h-5 w-5" />
                </span>
                <span className="block text-xs text-muted-foreground">Click or Drop Logo</span>
                <span className="block text-xs text-muted-foreground">PNG / JPG (Max 5MB)</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => onLogo(e.target.files?.[0])}
          />
          {data.logoDataUrl ? (
            <button
              type="button"
              onClick={() => setData({ ...data, logoDataUrl: "" })}
              className="mt-3 text-xs text-muted-foreground underline"
            >
              Remove logo
            </button>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}
