import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  UserCheck,
  UserPlus,
  XCircle,
  LayoutGrid,
  CalendarDays,
  TrendingUp,
  BookOpen,
  Activity,
  Award,
  FileText,
  RefreshCw,
  Upload,
  Link2,
  List,
} from "lucide-react";
import {
  getSections,
  createSection,
  deleteSection,
  getStudents,
  upsertStudent,
  bulkCreateStudents,
  deleteStudent,
  getExams,
  upsertExam,
  deleteExam,
} from "@/lib/students.functions";

type SubTab = "dashboard" | "list" | "exams" | "sections" | "add";

const subTabs: { id: SubTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "list", label: "Student List" },
  { id: "exams", label: "Exam Management" },
  { id: "sections", label: "Create Section" },
  { id: "add", label: "Add Student" },
];

export type Section = { id: string; grade: string; name: string };
export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  grade: string;
  section_id: string | null;
  roll_no: string;
  status: "verified" | "pending" | "rejected";
  created_at: string;
  sections?: { grade: string; name: string } | null;
};
export type Exam = {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: "draft" | "published";
  starts_at: string | null;
  ends_at: string | null;
  total_marks: number;
  average_score: number;
  created_at: string;
};

export function StudentsSection() {
  const [sub, setSub] = useState<SubTab>("dashboard");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              sub === t.id
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "dashboard" && <StudentDashboard />}
      {sub === "list" && <StudentList />}
      {sub === "exams" && <ExamManagement />}
      {sub === "sections" && <SectionManagement />}
      {sub === "add" && <AddStudent onDone={() => setSub("list")} />}
    </div>
  );
}

// ─── shared shells ───────────────────────────────────────

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h2>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint?: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight">{value}</p>
        {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</th>;
}
function Td({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>;
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "verified" || status === "published"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "rejected"
        ? "bg-destructive/10 text-destructive"
        : "bg-accent/15 text-accent";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${tone}`}>{status}</span>;
}

function Bars({ items }: { items: { label: string; value: number; className: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted-foreground">{i.label}</span>
            <span className="font-medium">{i.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className={`h-full rounded-full ${i.className}`} style={{ width: `${(i.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────

function StudentDashboard() {
  const fetchStudents = useServerFn(getStudents);
  const fetchSections = useServerFn(getSections);
  const fetchExams = useServerFn(getExams);
  const queryClient = useQueryClient();

  const students = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents() });
  const sections = useQuery({ queryKey: ["sections"], queryFn: () => fetchSections() });
  const exams = useQuery({ queryKey: ["exams"], queryFn: () => fetchExams() });

  const s = (students.data ?? []) as Student[];
  const sec = (sections.data ?? []) as Section[];
  const ex = (exams.data ?? []) as Exam[];

  const now = Date.now();
  const since = (days: number) => s.filter((x) => now - new Date(x.created_at).getTime() < days * 864e5).length;

  const verified = s.filter((x) => x.status === "verified").length;
  const pending = s.filter((x) => x.status === "pending").length;
  const ongoing = ex.filter(
    (e) => e.starts_at && e.ends_at && new Date(e.starts_at).getTime() <= now && new Date(e.ends_at).getTime() >= now,
  ).length;
  const expired = ex.filter((e) => e.ends_at && new Date(e.ends_at).getTime() < now).length;
  const avgScore = ex.length ? Math.round(ex.reduce((a, e) => a + Number(e.average_score), 0) / ex.length) : 0;

  const byGrade = useMemo(() => {
    const map = new Map<string, number>();
    for (const st of s) map.set(st.grade || "—", (map.get(st.grade || "—") ?? 0) + 1);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [s]);

  return (
    <div className="space-y-5">
      <Card
        title="Dashboard"
        action={
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["students"] });
              queryClient.invalidateQueries({ queryKey: ["sections"] });
              queryClient.invalidateQueries({ queryKey: ["exams"] });
            }}
            className="flex items-center gap-2 rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat icon={Users} label="Total Students" value={s.length} hint="Across all grades" tone="bg-primary/10 text-primary" />
          <Stat
            icon={UserCheck}
            label="Verified Students"
            value={verified}
            hint={`${s.length ? Math.round((verified / s.length) * 100) : 0}% of total`}
            tone="bg-emerald-500/10 text-emerald-600"
          />
          <Stat icon={XCircle} label="Pending Verification" value={pending} hint="Awaiting approval" tone="bg-destructive/10 text-destructive" />
          <Stat icon={LayoutGrid} label="Total Sections" value={sec.length} hint="Active sections" tone="bg-accent/15 text-accent" />
          <Stat icon={UserPlus} label="Today's Registration" value={since(1)} tone="bg-primary/10 text-primary" />
          <Stat icon={CalendarDays} label="This Week" value={since(7)} tone="bg-accent/15 text-accent" />
          <Stat icon={TrendingUp} label="This Month" value={since(30)} tone="bg-emerald-500/10 text-emerald-600" />
          <Stat icon={BookOpen} label="Total Exams" value={ex.length} tone="bg-primary/10 text-primary" />
          <Stat icon={CalendarDays} label="Expired Exams" value={expired} tone="bg-accent/15 text-accent" />
          <Stat icon={Activity} label="Ongoing Exams" value={ongoing} tone="bg-emerald-500/10 text-emerald-600" />
          <Stat icon={Award} label="Average Score" value={`${avgScore}%`} tone="bg-destructive/10 text-destructive" />
          <Stat icon={FileText} label="Published Exams" value={ex.filter((e) => e.status === "published").length} tone="bg-primary/10 text-primary" />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Student verification status">
          <Bars
            items={[
              { label: "Verified students", value: verified, className: "bg-emerald-500" },
              { label: "Pending verification", value: pending, className: "bg-accent" },
              { label: "Rejected", value: s.filter((x) => x.status === "rejected").length, className: "bg-destructive" },
            ]}
          />
        </Card>
        <Card title="Exam status distribution">
          <Bars
            items={[
              { label: "Upcoming", value: ex.filter((e) => e.starts_at && new Date(e.starts_at).getTime() > now).length, className: "bg-accent" },
              { label: "Ongoing", value: ongoing, className: "bg-primary" },
              { label: "Completed", value: expired, className: "bg-destructive" },
            ]}
          />
        </Card>
      </div>

      <Card title="Students by grade">
        {byGrade.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No grade data available</p>
        ) : (
          <Bars items={byGrade.map(([g, v]) => ({ label: `Grade ${g}`, value: v, className: "bg-primary" }))} />
        )}
      </Card>
    </div>
  );
}

// ─── Student list ────────────────────────────────────────

function StudentList() {
  const fetchStudents = useServerFn(getStudents);
  const fetchSections = useServerFn(getSections);
  const removeFn = useServerFn(deleteStudent);
  const upsertFn = useServerFn(upsertStudent);
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents() });
  const { data: sectionData } = useQuery({ queryKey: ["sections"], queryFn: () => fetchSections() });

  const students = (data ?? []) as Student[];
  const sections = (sectionData ?? []) as Section[];
  const grades = [...new Set(students.map((s) => s.grade).filter(Boolean))].sort();

  const rows = students.filter(
    (s) =>
      (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase())) &&
      (!grade || s.grade === grade) &&
      (!section || s.section_id === section) &&
      (!status || s.status === status),
  );

  async function setStatusOf(s: Student, next: Student["status"]) {
    await upsertFn({
      data: {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        grade: s.grade,
        section_id: s.section_id,
        roll_no: s.roll_no,
        status: next,
      },
    });
    queryClient.invalidateQueries({ queryKey: ["students"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this student?")) return;
    await removeFn({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["students"] });
  }

  return (
    <Card
      title="Student management"
      action={
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["students"] })}
          className="flex items-center gap-2 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-ink-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      <div className="rounded-lg border border-border p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">Filter</p>
        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className={inputClass}
          />
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputClass}>
            <option value="">All Grades</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
          <select value={section} onChange={(e) => setSection(e.target.value)} className={inputClass}>
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.grade} - {s.name}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => {
              setQ("");
              setGrade("");
              setSection("");
              setStatus("");
            }}
            className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        <div className="bg-ink px-3 py-2 text-sm font-semibold text-ink-foreground">
          Students List ({rows.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left">
              <tr>
                <Th>Student name</Th>
                <Th>Email</Th>
                <Th>Grade</Th>
                <Th>Section</Th>
                <Th>Roll no</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No students found
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <Td>
                      <span className="font-medium">{s.name}</span>
                      {s.phone ? <span className="block text-xs text-muted-foreground">{s.phone}</span> : null}
                    </Td>
                    <Td>
                      <span className="text-xs">{s.email || "—"}</span>
                    </Td>
                    <Td>{s.grade || "—"}</Td>
                    <Td>{s.sections ? s.sections.name : "—"}</Td>
                    <Td>{s.roll_no || "—"}</Td>
                    <Td>
                      <StatusPill status={s.status} />
                    </Td>
                    <Td>
                      <div className="flex gap-2 text-xs">
                        {s.status !== "verified" && (
                          <button onClick={() => setStatusOf(s, "verified")} className="text-primary hover:underline">
                            Verify
                          </button>
                        )}
                        {s.status !== "rejected" && (
                          <button onClick={() => setStatusOf(s, "rejected")} className="text-muted-foreground hover:underline">
                            Reject
                          </button>
                        )}
                        <button onClick={() => remove(s.id)} className="text-destructive hover:underline">
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

// ─── Exam management ─────────────────────────────────────

function ExamManagement() {
  const fetchExams = useServerFn(getExams);
  const upsertFn = useServerFn(upsertExam);
  const removeFn = useServerFn(deleteExam);
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<null | { id?: string; title: string; subject: string; grade: string; status: "draft" | "published"; starts_at: string; ends_at: string; total_marks: number }>(null);

  const { data, isLoading } = useQuery({ queryKey: ["exams"], queryFn: () => fetchExams() });
  const exams = (data ?? []) as Exam[];
  const rows = exams.filter(
    (e) => (filter === "all" || e.status === filter) && (!q || e.title.toLowerCase().includes(q.toLowerCase())),
  );

  const [saveError, setSaveError] = useState("");

  async function save() {
    if (!form || !form.title.trim()) return;
    setSaveError("");
    try {
      await upsertFn({
        data: {
          ...(form.id ? { id: form.id } : {}),
          title: form.title.trim(),
          subject: form.subject.trim(),
          grade: form.grade.trim(),
          status: form.status,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
          total_marks: Number(form.total_marks) || 100,
        },
      });
      setForm(null);
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save exam.");
    }
  }


  async function remove(id: string) {
    if (!confirm("Delete this exam?")) return;
    await removeFn({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["exams"] });
  }

  return (
    <Card
      title="Exam management"
      action={
        <div className="flex gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["exams"] })}
            className="rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Refresh
          </button>
          <button
            onClick={() =>
              setForm({ title: "", subject: "", grade: "", status: "draft", starts_at: "", ends_at: "", total_marks: 100 })
            }
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"
          >
            + Create New Exam
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "draft", "published"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "border-ink bg-ink text-ink-foreground" : "border-accent text-accent hover:bg-accent/10"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exams…"
          className="w-56 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {form ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-border p-4 md:grid-cols-3">
          <Field label="Title" required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Subject">
            <input className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </Field>
          <Field label="Grade">
            <input className={inputClass} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          </Field>
          <Field label="Starts">
            <input type="datetime-local" className={inputClass} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </Field>
          <Field label="Ends">
            <input type="datetime-local" className={inputClass} value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </Field>
          <Field label="Total marks">
            <input type="number" className={inputClass} value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) })} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "published" })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Save exam
            </button>
            <button onClick={() => setForm(null)} className="rounded-md border border-border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
          {saveError ? <p className="text-sm text-destructive md:col-span-3">{saveError}</p> : null}
        </div>
      ) : null}


      <div className="mt-4 rounded-lg border border-dashed border-accent/60 p-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-accent" />
            <p className="mt-3 font-semibold">No Exams Found</p>
            <p className="text-xs text-muted-foreground">Click "Create New Exam" to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left">
                <tr>
                  <Th>Title</Th>
                  <Th>Subject</Th>
                  <Th>Grade</Th>
                  <Th>Window</Th>
                  <Th>Marks</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <Td>
                      <span className="font-medium">{e.title}</span>
                    </Td>
                    <Td>{e.subject || "—"}</Td>
                    <Td>{e.grade || "—"}</Td>
                    <Td>
                      <span className="text-xs text-muted-foreground">
                        {e.starts_at ? new Date(e.starts_at).toLocaleDateString() : "—"} →{" "}
                        {e.ends_at ? new Date(e.ends_at).toLocaleDateString() : "—"}
                      </span>
                    </Td>
                    <Td>{e.total_marks}</Td>
                    <Td>
                      <StatusPill status={e.status} />
                    </Td>
                    <Td>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() =>
                            setForm({
                              id: e.id,
                              title: e.title,
                              subject: e.subject,
                              grade: e.grade,
                              status: e.status,
                              starts_at: e.starts_at ? e.starts_at.slice(0, 16) : "",
                              ends_at: e.ends_at ? e.ends_at.slice(0, 16) : "",
                              total_marks: e.total_marks,
                            })
                          }
                          className="text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button onClick={() => remove(e.id)} className="text-destructive hover:underline">
                          Delete
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Create section ──────────────────────────────────────

function SectionManagement() {
  const fetchSections = useServerFn(getSections);
  const createFn = useServerFn(createSection);
  const removeFn = useServerFn(deleteSection);
  const queryClient = useQueryClient();

  const [grade, setGrade] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { data } = useQuery({ queryKey: ["sections"], queryFn: () => fetchSections() });
  const sections = (data ?? []) as Section[];

  async function submit() {
    setError("");
    if (!grade.trim() || !name.trim()) {
      setError("Grade and section are both required.");
      return;
    }
    try {
      await createFn({ data: { grade, name } });
      setGrade("");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create section");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this section?")) return;
    await removeFn({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["sections"] });
  }

  return (
    <Card title="Section management">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Grade" required>
          <input className={inputClass} placeholder="Enter Grade (e.g. 10, Nursery, LKG)" value={grade} onChange={(e) => setGrade(e.target.value)} />
        </Field>
        <Field label="Section" required>
          <input className={inputClass} placeholder="A / B / C" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <div className="mt-4 flex justify-end">
        <button onClick={submit} className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground">
          Create Section
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <List className="h-4 w-4 text-accent" />
        <span className="font-semibold">Existing Sections</span>
        <span className="rounded bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
          {sections.length} Total
        </span>
      </div>

      {sections.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-accent/60 py-12 text-center">
          <p className="text-sm text-muted-foreground">No sections found</p>
          <p className="text-xs text-accent">Create your first section using the form above</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {sections.map((s) => (
            <span key={s.id} className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-sm">
              Grade {s.grade} · {s.name}
              <button onClick={() => remove(s.id)} className="text-xs text-destructive hover:underline">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Add student ─────────────────────────────────────────

function AddStudent({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"choose" | "single" | "bulk" | "link">("choose");
  const fetchSections = useServerFn(getSections);
  const upsertFn = useServerFn(upsertStudent);
  const bulkFn = useServerFn(bulkCreateStudents);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["sections"], queryFn: () => fetchSections() });
  const sections = (data ?? []) as Section[];

  const [form, setForm] = useState({ name: "", email: "", phone: "", grade: "", section_id: "", roll_no: "" });
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");

  async function saveSingle() {
    setMessage("");
    if (!form.name.trim()) {
      setMessage("Student name is required.");
      return;
    }
    try {
      await upsertFn({
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          grade: form.grade.trim(),
          section_id: form.section_id || null,
          roll_no: form.roll_no.trim(),
          status: "pending",
        },
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setForm({ name: "", email: "", phone: "", grade: "", section_id: "", roll_no: "" });
      onDone();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not register student.");
    }
  }


  async function saveBulk() {
    setMessage("");
    const rows = csv
      .split("\n")
      .map((l) => l.split(",").map((c) => c.trim()))
      .filter((c) => c[0])
      .map((c) => ({ name: c[0] ?? "", email: c[1] ?? "", grade: c[2] ?? "", roll_no: c[3] ?? "" }));
    if (rows.length === 0) {
      setMessage("Paste at least one row: name, email, grade, roll no");
      return;
    }
    try {
      const res = await bulkFn({ data: { rows } });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setCsv("");
      setMessage(`Imported ${res.count} students.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not import students.");
    }
  }


  const options = [
    { id: "single" as const, icon: UserPlus, title: "Single Registration", desc: "Register one student at a time" },
    { id: "bulk" as const, icon: Upload, title: "Bulk Registration", desc: "Paste CSV rows" },
    { id: "link" as const, icon: Link2, title: "Link Registration", desc: "Copy shareable link" },
  ];

  return (
    <Card title="Student registration">
      <div className="grid gap-4 md:grid-cols-3">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => setMode(o.id)}
            className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
              mode === o.id ? "border-accent bg-accent/5" : "border-accent/50 hover:bg-secondary/40"
            }`}
          >
            <o.icon className="mt-0.5 h-5 w-5 text-accent" />
            <span>
              <span className="block font-semibold">{o.title}</span>
              <span className="block text-xs text-muted-foreground">{o.desc}</span>
            </span>
          </button>
        ))}
      </div>

      {mode === "single" && (
        <div className="mt-5 grid gap-3 rounded-lg border border-border p-4 md:grid-cols-3">
          <Field label="Full name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Grade">
            <input className={inputClass} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          </Field>
          <Field label="Section">
            <select className={inputClass} value={form.section_id} onChange={(e) => setForm({ ...form, section_id: e.target.value })}>
              <option value="">Unassigned</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.grade} - {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Roll no">
            <input className={inputClass} value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} />
          </Field>
          <div className="flex items-end md:col-span-3">
            <button onClick={saveSingle} className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground">
              Register student
            </button>
          </div>
        </div>
      )}

      {mode === "bulk" && (
        <div className="mt-5 rounded-lg border border-border p-4">
          <Field label="CSV rows — name, email, grade, roll no">
            <textarea
              rows={6}
              className={inputClass}
              placeholder={"Asha Rao, asha@school.in, 8, 12\nRahul Jain, rahul@school.in, 8, 13"}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
            />
          </Field>
          <button onClick={saveBulk} className="mt-3 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground">
            Import students
          </button>
        </div>
      )}

      {mode === "link" && (
        <div className="mt-5 rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Share this link with a school to collect registrations.</p>
          <code className="mt-2 block truncate rounded bg-secondary px-3 py-2 text-xs">
            {typeof window !== "undefined" ? `${window.location.origin}/contact?ref=student-registration` : "/contact"}
          </code>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(`${window.location.origin}/contact?ref=student-registration`);
                setMessage("Link copied.");
              }
            }}
            className="mt-3 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary"
          >
            Copy link
          </button>
        </div>
      )}

      {message ? <p className="mt-3 text-sm text-primary">{message}</p> : null}
    </Card>
  );
}
