import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck, ClipboardList, MessageSquare, Upload, Users } from "lucide-react";
import {
  Bar,
  DataTable,
  EmptyState,
  Field,
  Kpi,
  KpiSkeleton,
  LoadingBlock,
  Panel,
  PercentBar,
  StatusPill,
  TabBar,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/components/admin/workforce-ui";
import { downloadCsv } from "@/lib/workforce.constants";
import {
  addOnboardingTask,
  bulkUploadAttendance,
  deleteOnboardingTask,
  deleteOneOnOneNote,
  deleteReviewCycle,
  getOnboardingTasks,
  getOneOnOneNotes,
  getPeopleAnalytics,
  getReviewCycles,
  saveOneOnOneNote,
  saveReviewCycle,
  seedOnboardingChecklist,
  toggleOnboardingTask,
} from "@/lib/people.functions";
import { getTeamMembers } from "@/lib/team.functions";

export type PeopleOpsTab = "analytics" | "bulk" | "onboarding" | "reviews";

const TABS: { id: PeopleOpsTab; label: string }[] = [
  { id: "analytics", label: "People Analytics" },
  { id: "bulk", label: "Bulk Attendance" },
  { id: "onboarding", label: "Onboarding" },
  { id: "reviews", label: "Reviews & 1:1" },
];

export function PeopleOpsSection({
  initialTab = "analytics",
  showTabBar = false,
}: {
  initialTab?: PeopleOpsTab;
  showTabBar?: boolean;
}) {
  const [tab, setTab] = useState<PeopleOpsTab>(initialTab);
  const fetchTeam = useServerFn(getTeamMembers);
  const team = useQuery({ queryKey: ["team-members"], queryFn: () => fetchTeam({}) });
  const people = useMemo(
    () => (team.data ?? []).filter((m) => m.full_name || m.email).sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [team.data],
  );

  return (
    <div className="space-y-4">
      {showTabBar && <TabBar tabs={TABS} value={tab} onChange={setTab} />}
      {tab === "analytics" ? <AnalyticsTab /> : null}
      {tab === "bulk" ? <BulkAttendanceTab /> : null}
      {tab === "onboarding" ? <OnboardingTab people={people} /> : null}
      {tab === "reviews" ? <ReviewsTab people={people} /> : null}
    </div>
  );
}

type Person = { user_id: string; full_name: string; email: string; designation: string };

// ─── Analytics ───────────────────────────────────────────

function AnalyticsTab() {
  const fetchAnalytics = useServerFn(getPeopleAnalytics);
  const q = useQuery({ queryKey: ["people-analytics"], queryFn: () => fetchAnalytics({}) });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <KpiSkeleton />
        <LoadingBlock rows={6} />
      </div>
    );
  }
  if (q.error) return <EmptyState title="Could not load analytics" hint={(q.error as Error).message} />;
  const d = q.data!;
  const maxHire = Math.max(1, ...d.hiring.map((h) => Math.max(h.joined, h.exits)));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Headcount" value={d.headcount.total} icon={Users} hint={`${d.headcount.active} active`} />
        <Kpi label="HR managers" value={d.headcount.hr} icon={ClipboardList} />
        <Kpi
          label="Attrition"
          value={`${d.attritionPct}%`}
          tone={d.attritionPct > 15 ? "bad" : "good"}
          hint={`${d.headcount.inactive} exits recorded`}
        />
        <Kpi label="Departments" value={d.byDepartment.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Headcount by department">
          {d.byDepartment.length === 0 ? (
            <EmptyState title="No departments mapped yet" hint="Assign departments on employee profiles." />
          ) : (
            <div className="space-y-3">
              {d.byDepartment.map((row) => (
                <Bar key={row.name} label={row.name} value={row.count} total={d.headcount.total} />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Hiring vs exits" description="Last 6 months">
          <div className="flex h-48 items-end gap-3">
            {d.hiring.map((h) => (
              <div key={h.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div
                    className="w-1/3 rounded-t bg-accent"
                    style={{ height: `${(h.joined / maxHire) * 100}%` }}
                    title={`${h.joined} joined`}
                  />
                  <div
                    className="w-1/3 rounded-t bg-destructive/70"
                    style={{ height: `${(h.exits / maxHire) * 100}%` }}
                    title={`${h.exits} exits`}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{h.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Tenure mix">
          <div className="space-y-3">
            <PercentBar
              label="Under 1 year"
              pctValue={Math.round((d.tenure.under1 / Math.max(1, d.headcount.active)) * 100)}
            />
            <PercentBar
              label="1 – 3 years"
              pctValue={Math.round((d.tenure.oneToThree / Math.max(1, d.headcount.active)) * 100)}
            />
            <PercentBar
              label="Over 3 years"
              pctValue={Math.round((d.tenure.overThree / Math.max(1, d.headcount.active)) * 100)}
            />
          </div>
        </Panel>

        <Panel title="Leave type mix" description="Approved days this year">
          {d.leaveTypeMix.length === 0 ? (
            <EmptyState title="No approved leave yet" />
          ) : (
            <div className="space-y-3">
              {d.leaveTypeMix.map((t) => (
                <Bar
                  key={t.type}
                  label={t.type}
                  value={t.days}
                  total={d.leaveTypeMix.reduce((s, x) => s + x.days, 0)}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Leave balance summary"
        action={
          <button
            className={btnGhost}
            onClick={() =>
              downloadCsv(
                "leave-balances.csv",
                d.leaveBalances.map((b) => ({
                  Employee: b.name,
                  Entitled: b.entitled,
                  Taken: b.taken,
                  Pending: b.pending,
                  Remaining: b.remaining,
                })),
              )
            }
          >
            Download CSV
          </button>
        }
      >
        <DataTable
          headers={["Employee", "Entitled", "Taken", "Pending", "Remaining"]}
          isEmpty={d.leaveBalances.length === 0}
          empty="No employees yet."
        >
          {d.leaveBalances.map((b) => (
            <tr key={b.user_id}>
              <td className="py-2 pr-4 font-medium">{b.name || "—"}</td>
              <td className="py-2 pr-4">{b.entitled}</td>
              <td className="py-2 pr-4">{b.taken}</td>
              <td className="py-2 pr-4">{b.pending}</td>
              <td className="py-2 pr-4">{b.remaining}</td>
            </tr>
          ))}
        </DataTable>
      </Panel>
    </div>
  );
}

// ─── Bulk attendance ─────────────────────────────────────

function BulkAttendanceTab() {
  const [csv, setCsv] = useState("");
  const upload = useServerFn(bulkUploadAttendance);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => upload({ data: { csv } }),
    onSuccess: (res) => {
      toast.success(`${res.applied} attendance rows applied`);
      if (res.skipped.length) toast.warning(`${res.skipped.length} rows skipped`);
      qc.invalidateQueries({ queryKey: ["workforce"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Panel
      title="Bulk attendance upload"
      description="Paste CSV rows: employee code or name, date (YYYY-MM-DD), status, check-in, check-out"
      action={
        <button
          className={btnGhost}
          onClick={() => setCsv("EMP001,2026-01-05,present,09:05,18:10\nEMP002,2026-01-05,leave,,")}
        >
          Insert sample
        </button>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <input
            type="file"
            accept=".csv,text/csv"
            className="text-xs"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setCsv(await file.text());
            }}
          />
        </label>
        <textarea
          rows={10}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="EMP001,2026-01-05,present,09:05,18:10"
          className={`${inputClass} font-mono text-xs`}
        />
        <div className="flex items-center gap-3">
          <button className={btnPrimary} disabled={!csv.trim() || m.isPending} onClick={() => m.mutate()}>
            <Upload className="h-4 w-4" />
            {m.isPending ? "Uploading…" : "Apply rows"}
          </button>
          <span className="text-xs text-muted-foreground">
            Statuses: present, absent, half_day, leave, paid_leave, holiday
          </span>
        </div>

        {m.data && m.data.skipped.length > 0 ? (
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
            <p className="mb-1 font-semibold">Skipped rows</p>
            <ul className="space-y-1 text-muted-foreground">
              {m.data.skipped.map((s, i) => (
                <li key={i}>{s.line ? `Line ${s.line}: ` : ""}{s.reason}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

// ─── Onboarding ──────────────────────────────────────────

function OnboardingTab({ people }: { people: Person[] }) {
  const [who, setWho] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [due, setDue] = useState("");

  const qc = useQueryClient();
  const fetchTasks = useServerFn(getOnboardingTasks);
  const q = useQuery({ queryKey: ["onboarding-tasks"], queryFn: () => fetchTasks({}) });
  const seed = useServerFn(seedOnboardingChecklist);
  const add = useServerFn(addOnboardingTask);
  const toggle = useServerFn(toggleOnboardingTask);
  const remove = useServerFn(deleteOnboardingTask);

  const refresh = () => qc.invalidateQueries({ queryKey: ["onboarding-tasks"] });
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const rows = (q.data ?? []) as {
    id: string;
    user_id: string;
    title: string;
    category: string;
    due_date: string | null;
    is_done: boolean;
  }[];
  const nameOf = (id: string) => people.find((p) => p.user_id === id)?.full_name || "Unknown";
  const filtered = who ? rows.filter((r) => r.user_id === who) : rows;
  const done = filtered.filter((r) => r.is_done).length;

  return (
    <div className="space-y-4">
      <Panel title="Onboarding checklist" description="Track new joiner readiness per employee">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Employee">
            <select className={inputClass} value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">All employees</option>
              {people.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Task">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {["general", "paperwork", "payroll", "it", "orientation", "goals"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={btnPrimary}
            disabled={!who || !title.trim()}
            onClick={() =>
              run(async () => {
                await add({ data: { user_id: who, title, category, due_date: due || null } });
                setTitle("");
                setDue("");
              }, "Task added")
            }
          >
            Add task
          </button>
          <button
            className={btnGhost}
            disabled={!who}
            onClick={() => run(() => seed({ data: { user_id: who } }), "Standard checklist created")}
          >
            Seed standard checklist
          </button>
          {filtered.length > 0 ? (
            <span className="self-center text-xs text-muted-foreground">
              {done}/{filtered.length} complete
            </span>
          ) : null}
        </div>
      </Panel>

      <Panel title="Checklist items">
        {q.isLoading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No onboarding tasks yet"
            hint="Pick an employee and seed the standard checklist to get started."
          />
        ) : (
          <DataTable headers={["Done", "Employee", "Task", "Category", "Due", ""]}>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="py-2 pr-4">
                  <input
                    type="checkbox"
                    checked={r.is_done}
                    onChange={(e) =>
                      run(() => toggle({ data: { id: r.id, is_done: e.target.checked } }), "Checklist updated")
                    }
                  />
                </td>
                <td className="py-2 pr-4 font-medium">{nameOf(r.user_id)}</td>
                <td className="py-2 pr-4">{r.title}</td>
                <td className="py-2 pr-4">
                  <StatusPill value={r.category} />
                </td>
                <td className="py-2 pr-4">{r.due_date ?? "—"}</td>
                <td className="py-2 pr-4">
                  <button className={btnGhost} onClick={() => run(() => remove({ data: { id: r.id } }), "Removed")}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}

// ─── Reviews & 1:1 ───────────────────────────────────────

function ReviewsTab({ people }: { people: Person[] }) {
  const qc = useQueryClient();
  const fetchCycles = useServerFn(getReviewCycles);
  const fetchNotes = useServerFn(getOneOnOneNotes);
  const saveCycle = useServerFn(saveReviewCycle);
  const delCycle = useServerFn(deleteReviewCycle);
  const saveNote = useServerFn(saveOneOnOneNote);
  const delNote = useServerFn(deleteOneOnOneNote);

  const cycles = useQuery({ queryKey: ["review-cycles"], queryFn: () => fetchCycles({}) });
  const notes = useQuery({ queryKey: ["one-on-one"], queryFn: () => fetchNotes({}) });

  const [cycle, setCycle] = useState({ name: "", period_start: "", period_end: "", status: "planned" });
  const [note, setNote] = useState({
    employee_id: "",
    meeting_date: new Date().toISOString().slice(0, 10),
    agenda: "",
    notes: "",
    action_items: "",
  });

  const run = async (fn: () => Promise<unknown>, ok: string, key: string) => {
    try {
      await fn();
      toast.success(ok);
      qc.invalidateQueries({ queryKey: [key] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const cycleRows = (cycles.data ?? []) as {
    id: string;
    name: string;
    period_start: string;
    period_end: string;
    status: string;
  }[];
  const noteRows = (notes.data ?? []) as {
    id: string;
    employee_id: string;
    meeting_date: string;
    agenda: string;
    notes: string;
    action_items: string;
  }[];
  const nameOf = (id: string) => people.find((p) => p.user_id === id)?.full_name || "Unknown";

  return (
    <div className="space-y-4">
      <Panel title="Review cycles" description="Define the appraisal windows for the organisation">
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Cycle name">
            <input
              className={inputClass}
              value={cycle.name}
              placeholder="H1 2026 Appraisal"
              onChange={(e) => setCycle({ ...cycle, name: e.target.value })}
            />
          </Field>
          <Field label="Starts">
            <input
              type="date"
              className={inputClass}
              value={cycle.period_start}
              onChange={(e) => setCycle({ ...cycle, period_start: e.target.value })}
            />
          </Field>
          <Field label="Ends">
            <input
              type="date"
              className={inputClass}
              value={cycle.period_end}
              onChange={(e) => setCycle({ ...cycle, period_end: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={cycle.status}
              onChange={(e) => setCycle({ ...cycle, status: e.target.value })}
            >
              {["planned", "active", "closed"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <button
          className={`${btnPrimary} mt-3`}
          onClick={() =>
            run(
              async () => {
                await saveCycle({ data: cycle });
                setCycle({ name: "", period_start: "", period_end: "", status: "planned" });
              },
              "Cycle saved",
              "review-cycles",
            )
          }
        >
          <CalendarCheck className="h-4 w-4" /> Save cycle
        </button>

        <div className="mt-4">
          {cycles.isLoading ? (
            <LoadingBlock rows={3} />
          ) : cycleRows.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No review cycles yet" hint="Create your first appraisal window." />
          ) : (
            <DataTable headers={["Cycle", "Window", "Status", ""]}>
              {cycleRows.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4">
                    {c.period_start} → {c.period_end}
                  </td>
                  <td className="py-2 pr-4">
                    <StatusPill value={c.status} />
                  </td>
                  <td className="py-2 pr-4">
                    <button
                      className={btnGhost}
                      onClick={() => run(() => delCycle({ data: { id: c.id } }), "Cycle removed", "review-cycles")}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Panel>

      <Panel title="1:1 notes" description="Private manager notes shared with the employee as a notification">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Employee">
            <select
              className={inputClass}
              value={note.employee_id}
              onChange={(e) => setNote({ ...note, employee_id: e.target.value })}
            >
              <option value="">Select employee</option>
              {people.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Meeting date">
            <input
              type="date"
              className={inputClass}
              value={note.meeting_date}
              onChange={(e) => setNote({ ...note, meeting_date: e.target.value })}
            />
          </Field>
          <Field label="Agenda">
            <input className={inputClass} value={note.agenda} onChange={(e) => setNote({ ...note, agenda: e.target.value })} />
          </Field>
          <Field label="Action items">
            <input
              className={inputClass}
              value={note.action_items}
              onChange={(e) => setNote({ ...note, action_items: e.target.value })}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea
                rows={4}
                className={inputClass}
                value={note.notes}
                onChange={(e) => setNote({ ...note, notes: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <button
          className={`${btnPrimary} mt-3`}
          disabled={!note.employee_id}
          onClick={() =>
            run(
              async () => {
                await saveNote({ data: note });
                setNote({ ...note, agenda: "", notes: "", action_items: "" });
              },
              "1:1 note saved",
              "one-on-one",
            )
          }
        >
          <MessageSquare className="h-4 w-4" /> Save note
        </button>

        <div className="mt-4">
          {notes.isLoading ? (
            <LoadingBlock rows={3} />
          ) : noteRows.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No 1:1 notes recorded" hint="Log your first check-in above." />
          ) : (
            <DataTable headers={["Date", "Employee", "Agenda", "Action items", ""]}>
              {noteRows.map((n) => (
                <tr key={n.id}>
                  <td className="py-2 pr-4">{n.meeting_date}</td>
                  <td className="py-2 pr-4 font-medium">{nameOf(n.employee_id)}</td>
                  <td className="py-2 pr-4">{n.agenda || "—"}</td>
                  <td className="py-2 pr-4">{n.action_items || "—"}</td>
                  <td className="py-2 pr-4">
                    <button
                      className={btnGhost}
                      onClick={() => run(() => delNote({ data: { id: n.id } }), "Note removed", "one-on-one")}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
      </Panel>
    </div>
  );
}
