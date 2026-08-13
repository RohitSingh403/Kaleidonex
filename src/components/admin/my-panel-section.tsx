import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, CheckCircle2, XCircle, Download, Eye, RefreshCw, Mail, Lock, CalendarRange } from "lucide-react";
import {
  getAttendance,
  markAttendance,
  getLeaves,
  applyLeave,
  getSalaryRecords,
  getEmployeeRequests,
  createEmployeeRequest,
  type AttendanceStatus,
} from "@/lib/employee.functions";

type SubTab = "dashboard" | "mark" | "monthly" | "leave" | "salary" | "requests" | "attendance";

const subTabs: { id: SubTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "mark", label: "Mark Attendance" },
  { id: "monthly", label: "Monthly Attendance" },
  { id: "leave", label: "Leave" },
  { id: "salary", label: "Salary" },
  { id: "requests", label: "Requests List" },
];

export type AttendanceRow = {
  id: string;
  work_date: string;
  status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  daily_update: string;
};

export type LeaveRow = {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
};

export type SalaryRow = {
  id: string;
  period_month: number;
  period_year: number;
  days: number;
  basic_salary: number;
  earnings: number;
  deductions: number;
  net_pay: number;
  status: "pending" | "paid";
  paid_on: string | null;
};

export type RequestRow = {
  id: string;
  request_type: string;
  details: string;
  note: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
  leave: "Leave",
  paid_leave: "Paid Leave",
  holiday: "Holiday",
};
const statusDot: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500",
  absent: "bg-destructive",
  half_day: "bg-amber-500",
  leave: "bg-sky-500",
  paid_leave: "bg-teal-500",
  holiday: "bg-violet-500",
};

export function MyPanelSection({ only }: { only?: SubTab } = {}) {
  const [sub, setSub] = useState<SubTab>(only ?? "dashboard");
  const activeSub = only ?? sub;

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-center gap-1 border-b border-border ${only ? "hidden" : ""}`}>
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${sub === t.id
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeSub === "dashboard" && <EmployeeDashboard go={setSub} />}
      {activeSub === "mark" && <MarkAttendance onDone={() => setSub("monthly")} />}
      {activeSub === "monthly" && <MonthlyAttendance />}
      {activeSub === "attendance" && <AttendanceWorkspace />}
      {activeSub === "leave" && <LeaveTab />}
      {activeSub === "salary" && <SalaryTab />}
      {activeSub === "requests" && <RequestsTab />}
    </div>
  );
}

// ─── Attendance workspace (Mark + Monthly) ───────────────

function AttendanceWorkspace() {
  const [view, setView] = useState<"mark" | "monthly">("mark");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-1">
        <div>
          <h1 className="text-lg font-semibold">Attendance</h1>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <span className="text-accent">KaleidoNex</span> / Attendance
          </p>
        </div>
        <div className="flex items-center gap-4">
          {([
            { id: "mark", label: "Mark Attendance" },
            { id: "monthly", label: "Monthly Attendance" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`-mb-px border-b-2 px-1 py-2 text-sm transition-colors ${view === t.id
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {view === "mark" ? (
        <MarkAttendance onDone={() => setView("monthly")} onViewMonthly={() => setView("monthly")} />
      ) : (
        <MonthlyAttendance />
      )}

      <section className="rounded-xl border border-dashed border-border bg-card px-5 py-8 text-center shadow-soft">
        <h3 className="text-base font-semibold">Need Help with Attendance?</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Our HR team is here to assist you with any attendance-related queries
        </p>
        <a
          href="mailto:hr@KaleidoNex.com"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          <Mail className="h-4 w-4" /> Contact HR : hr@KaleidoNex.com
        </a>
      </section>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
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

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</th>;
}
function Td({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2 align-middle">{children}</td>;
}

function StatCard({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <span className={`h-10 w-10 shrink-0 rounded-full ${tone}`} />
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function Pill({ status }: { status: "pending" | "approved" | "rejected" | "paid" }) {
  const tone =
    status === "approved" || status === "paid"
      ? "bg-emerald-500/15 text-emerald-700"
      : status === "rejected"
        ? "bg-destructive/10 text-destructive"
        : "bg-accent/15 text-accent";
  return <span className={`rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>{status}</span>;
}

// ─── Dashboard ───────────────────────────────────────────

function EmployeeDashboard({ go }: { go: (t: SubTab) => void }) {
  const queryClient = useQueryClient();
  const fetchAttendance = useServerFn(getAttendance);
  const fetchLeaves = useServerFn(getLeaves);
  const fetchSalary = useServerFn(getSalaryRecords);
  const fetchRequests = useServerFn(getEmployeeRequests);

  const attendance = (useQuery({ queryKey: ["emp-attendance"], queryFn: () => fetchAttendance() }).data ?? []) as AttendanceRow[];
  const leaves = (useQuery({ queryKey: ["emp-leaves"], queryFn: () => fetchLeaves() }).data ?? []) as LeaveRow[];
  const salary = (useQuery({ queryKey: ["emp-salary"], queryFn: () => fetchSalary() }).data ?? []) as SalaryRow[];
  const requests = (useQuery({ queryKey: ["emp-requests"], queryFn: () => fetchRequests() }).data ?? []) as RequestRow[];

  const now = new Date();
  const monthRows = attendance.filter((a) => {
    const d = new Date(a.work_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const present = monthRows.filter((a) => a.status === "present").length;
  const pct = daysInMonth ? Math.round((present / daysInMonth) * 100) : 0;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const netSalary = salary[0]?.net_pay ?? 0;
  const requestsLeft = Math.max(0, 5 - requests.length);

  const counts: Record<AttendanceStatus, number> = {
    present,
    absent: monthRows.filter((a) => a.status === "absent").length,
    leave: monthRows.filter((a) => a.status === "leave").length,
    half_day: monthRows.filter((a) => a.status === "half_day").length,
    paid_leave: monthRows.filter((a) => a.status === "paid_leave").length,
    holiday: monthRows.filter((a) => a.status === "holiday").length,
  };

  return (
    <div className="space-y-5">
      <Card
        title="Employee dashboard"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Today {now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <button onClick={() => go("mark")} className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground">
              Mark Attendance
            </button>
            <button onClick={() => go("leave")} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
              Apply Leave
            </button>
            <button onClick={() => go("salary")} className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white">
              View Salary
            </button>
            <button onClick={() => go("requests")} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
              View Request
            </button>
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs"
            >
              <RefreshCw className="h-3 w-3" /> refresh
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Attendance" value={`${present}/${daysInMonth}`} sub={`${pct}%`} tone="bg-sky-500" />
          <StatCard label="Pending Leaves" value={pendingLeaves} sub="Approval Pending" tone="bg-amber-400" />
          <StatCard label="Net Salary" value={inr(netSalary)} sub="This Month" tone="bg-emerald-500" />
          <StatCard label="Requests Left" value={requestsLeft} sub="Out of 5" tone="bg-teal-500" />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Attendance distribution">
          {monthRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No attendance marked this month yet.</p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(counts) as AttendanceStatus[]).map((k) => {
                const total = monthRows.length || 1;
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{statusLabels[k]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className={`h-full ${statusDot[k]}`} style={{ width: `${(counts[k] / total) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold">{counts[k]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Monthly attendance trend">
          <MonthlyTrend rows={attendance} />
        </Card>
      </div>

      <Card title="Pending leave requests">
        {pendingLeaves === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <p className="text-sm text-muted-foreground">No pending leave requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left">
                <tr>
                  <Th>Type</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Days</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {leaves
                  .filter((l) => l.status === "pending")
                  .map((l) => (
                    <tr key={l.id} className="border-b border-border/60">
                      <Td>{l.leave_type}</Td>
                      <Td>{l.start_date}</Td>
                      <Td>{l.end_date}</Td>
                      <Td>{l.days}</Td>
                      <Td>
                        <Pill status={l.status} />
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Need help?">
        <p className="text-center text-sm text-muted-foreground">Contact HR for any assistance</p>
        <p className="mt-1 text-center text-sm">
          <a href="mailto:hr@KaleidoNex.com" className="text-primary hover:underline">
            hr@KaleidoNex.com
          </a>
        </p>
      </Card>
    </div>
  );
}

function MonthlyTrend({ rows }: { rows: AttendanceRow[] }) {
  const buckets = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; leave: number }>();
    for (const r of rows) {
      const d = new Date(r.work_date);
      const key = `${months[d.getMonth()]!.slice(0, 3)} ${d.getFullYear()}`;
      const b = map.get(key) ?? { present: 0, absent: 0, leave: 0 };
      if (r.status === "present") b.present += 1;
      else if (r.status === "absent") b.absent += 1;
      else if (r.status === "leave" || r.status === "paid_leave") b.leave += 1;
      map.set(key, b);
    }
    return [...map.entries()].slice(-6);
  }, [rows]);

  if (buckets.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">No records yet.</p>;
  const max = Math.max(...buckets.map(([, b]) => Math.max(b.present, b.absent, b.leave)), 1);

  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-emerald-500" /> Present</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-destructive" /> Absent</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-sky-500" /> Leave</span>
      </div>
      <div className="flex h-40 items-end gap-4">
        {buckets.map(([key, b]) => (
          <div key={key} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div className="w-3 rounded-t bg-emerald-500" style={{ height: `${(b.present / max) * 100}%` }} />
              <div className="w-3 rounded-t bg-destructive" style={{ height: `${(b.absent / max) * 100}%` }} />
              <div className="w-3 rounded-t bg-sky-500" style={{ height: `${(b.leave / max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mark Attendance ─────────────────────────────────────

function MarkAttendance({ onDone, onViewMonthly }: { onDone: () => void; onViewMonthly?: () => void }) {
  const queryClient = useQueryClient();
  const fetchAttendance = useServerFn(getAttendance);
  const save = useServerFn(markAttendance);
  const { data } = useQuery({ queryKey: ["emp-attendance"], queryFn: () => fetchAttendance() });
  const rows = (data ?? []) as AttendanceRow[];

  const today = new Date();
  const iso = today.toISOString().slice(0, 10);
  const existing = rows.find((r) => r.work_date === iso);

  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [update, setUpdate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const hours = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const [ih, im] = checkIn.split(":").map(Number);
    const [oh, om] = checkOut.split(":").map(Number);
    const mins = (oh! * 60 + om!) - (ih! * 60 + im!);
    return mins > 0 ? Math.round((mins / 60) * 10) / 10 : 0;
  }, [checkIn, checkOut]);

  async function submit() {
    if (!update.trim()) {
      setError("Daily update is mandatory.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await save({
        data: {
          work_date: iso,
          status,
          check_in: checkIn || null,
          check_out: checkOut || null,
          daily_update: update.trim(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["emp-attendance"] });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <Card
        title="Mark attendance"
        action={
          onViewMonthly ? (
            <button
              onClick={onViewMonthly}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary"
            >
              <CalendarRange className="h-4 w-4" /> View Monthly Report
            </button>
          ) : undefined
        }
      >
        <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          {today.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>

        <p className="mb-2 text-sm font-medium">Select Status</p>
        <div className="mb-5 inline-flex flex-wrap overflow-hidden rounded-md border border-border">
          {(["present", "half_day", "paid_leave"] as AttendanceStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 text-xs font-semibold ${status === s ? "bg-emerald-600 text-white" : "bg-card text-amber-600 hover:bg-secondary"
                }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <label className="text-xs font-medium text-muted-foreground">Check In Time</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={() => setCheckIn(new Date().toTimeString().slice(0, 5))}
                className="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
              >
                Check In
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <label className="text-xs font-medium text-muted-foreground">Check Out Time</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={() => setCheckOut(new Date().toTimeString().slice(0, 5))}
                className="shrink-0 rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground"
              >
                Check Out
              </button>
            </div>
          </div>
        </div>


        <div className="mt-4">
          <label className="text-sm font-medium">Daily Update (Mandatory)</label>
          <textarea
            rows={4}
            value={update}
            onChange={(e) => setUpdate(e.target.value)}
            placeholder="What did you work on today? Any important updates or tasks completed..."
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">Add notes about your work, meetings, or tasks completed today</p>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => {
              setCheckIn("");
              setCheckOut("");
              setUpdate("");
              setStatus("present");
              setError("");
            }}
            className="rounded-md border border-input px-4 py-2 text-sm"
          >
            Reset Form
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Mark Attendance"}
          </button>
        </div>
      </Card>

      <Card title="Today's summary">
        <div className="flex items-center justify-between border-b border-border py-2 text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-semibold text-emerald-600">{statusLabels[existing?.status ?? status]}</span>
        </div>
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-muted-foreground">Total Hours</span>
          <span className="font-semibold text-primary">{hours.toFixed(1)} hrs</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {existing ? "Attendance already marked for today — saving will update it." : "Please mark your attendance for today."}
        </p>
      </Card>
    </div>
  );
}

function workHours(r: AttendanceRow) {
  if (!r.check_in || !r.check_out) return "-";
  const [ih, im] = r.check_in.split(":").map(Number);
  const [oh, om] = r.check_out.split(":").map(Number);
  const mins = (oh! * 60 + om!) - (ih! * 60 + im!);
  return mins > 0 ? `${(mins / 60).toFixed(1)} hrs` : "-";
}

// ─── Monthly Attendance ──────────────────────────────────

function MonthlyAttendance() {
  const fetchAttendance = useServerFn(getAttendance);
  const { data } = useQuery({ queryKey: ["emp-attendance"], queryFn: () => fetchAttendance() });
  const rows = (data ?? []) as AttendanceRow[];

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const monthRows = rows.filter((r) => {
    const d = new Date(r.work_date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const byDay = new Map(monthRows.map((r) => [new Date(r.work_date).getDate(), r]));
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = first.getDay();
  const count = (s: AttendanceStatus) => monthRows.filter((r) => r.status === s).length;

  function shift(delta: number) {
    const d = new Date(year, month + delta, 1);
    setMonth(d.getMonth());
    setYear(d.getFullYear());
  }

  return (
    <div className="space-y-5">
      <Card
        title="Monthly attendance"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => shift(-1)} className="rounded-md border border-input px-2 py-1 text-sm">‹</button>
            <span className="text-sm font-semibold">
              {months[month]} {year}
            </span>
            <button onClick={() => shift(1)} className="rounded-md border border-input px-2 py-1 text-sm">›</button>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {months.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setMonth(now.getMonth());
                setYear(now.getFullYear());
              }}
              className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground"
            >
              Current Month
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Present" value={count("present")} tone="bg-emerald-500" />
          <StatCard label="Absent" value={count("absent")} tone="bg-destructive" />
          <StatCard label="Leave" value={count("leave")} tone="bg-sky-500" />
          <StatCard label="Half Day" value={count("half_day")} tone="bg-amber-500" />
          <StatCard label="Holiday" value={count("holiday")} tone="bg-violet-500" />
        </div>
      </Card>

      <Card title="Calendar view">
        <p className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium">
            {months[month]} {year}
          </span>
          <span className="text-emerald-600">P: {count("present")}</span>
          <span className="text-destructive">A: {count("absent")}</span>
          <span className="text-amber-600">½: {count("half_day")}</span>
          <span className="text-sky-600">PL: {count("paid_leave")}</span>
        </p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-[11px] font-semibold uppercase text-muted-foreground">
              {d}
            </div>
          ))}
          {Array.from({ length: lead }).map((_, i) => (
            <div key={`lead-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const row = byDay.get(day);
            return (
              <div key={day} className="rounded-lg border border-border/60 p-2">
                <p className="text-xs text-muted-foreground">{day}</p>
                <div className="mt-1 flex justify-center">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white ${row ? statusDot[row.status] : "bg-muted"
                      }`}
                  >
                    {row ? statusLabels[row.status].slice(0, 1) : ""}
                  </span>
                </div>
                {row?.check_in && (
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {row.check_in.slice(0, 5)}
                    {row.check_out ? ` → ${row.check_out.slice(0, 5)}` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {(Object.keys(statusLabels) as AttendanceStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDot[s]}`} /> {statusLabels[s]}
            </span>
          ))}
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm font-medium">Monthly Summary</p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
            {(Object.keys(statusLabels) as AttendanceStatus[]).map((s) => (
              <div key={s}>
                <p className="text-lg font-semibold">{count(s)}</p>
                <p className="text-xs text-muted-foreground">{statusLabels[s]}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Daily attendance details">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left">
              <tr>
                <Th>Date</Th>
                <Th>Day</Th>
                <Th>Status</Th>
                <Th>Check In</Th>
                <Th>Check Out</Th>
                <Th>Work Hours</Th>
                <Th>Updates</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {monthRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No attendance records for this month.
                  </td>
                </tr>
              )}
              {monthRows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <Td>{new Date(r.work_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</Td>
                  <Td>{new Date(r.work_date).toLocaleDateString("en-IN", { weekday: "long" })}</Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${statusDot[r.status]}`} />
                      {statusLabels[r.status]}
                    </span>
                  </Td>
                  <Td>{r.check_in?.slice(0, 5) ?? "-"}</Td>
                  <Td>{r.check_out?.slice(0, 5) ?? "-"}</Td>
                  <Td>{workHours(r)}</Td>
                  <Td>
                    <span className="line-clamp-1 max-w-[16rem] text-muted-foreground">{r.daily_update || "-"}</span>
                  </Td>
                  <Td>
                    {r.status === "absent" ? (
                      <span className="inline-flex rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
                        Regularize
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md border border-input px-2.5 py-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" /> {r.status === "holiday" ? "Holiday" : "Locked"}
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

// ─── Leave ───────────────────────────────────────────────

function LeaveTab() {
  const queryClient = useQueryClient();
  const fetchLeaves = useServerFn(getLeaves);
  const submitLeave = useServerFn(applyLeave);
  const { data } = useQuery({ queryKey: ["emp-leaves"], queryFn: () => fetchLeaves() });
  const leaves = (data ?? []) as LeaveRow[];

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | LeaveRow["status"]>("all");
  const [month, setMonth] = useState<"all" | number>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [form, setForm] = useState({ leave_type: "Casual", start_date: "", end_date: "", reason: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const shown = leaves.filter((l) => {
    const d = new Date(l.start_date);
    if (filter !== "all" && l.status !== filter) return false;
    if (month !== "all" && d.getMonth() + 1 !== month) return false;
    return d.getFullYear() === year;
  });
  const totalDays = leaves.filter((l) => l.status === "approved").reduce((a, l) => a + l.days, 0);

  async function submit() {
    if (!form.start_date || !form.end_date || !form.reason.trim()) {
      setError("Please fill start date, end date and reason.");
      return;
    }
    const days = Math.max(
      1,
      Math.round((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000) + 1,
    );
    setError("");
    setSaving(true);
    try {
      await submitLeave({ data: { ...form, reason: form.reason.trim(), days } });
      await queryClient.invalidateQueries({ queryKey: ["emp-leaves"] });
      setForm({ leave_type: "Casual", start_date: "", end_date: "", reason: "" });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply for leave.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card
        title="My leaves"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-md bg-ink px-4 py-1.5 text-xs font-semibold text-ink-foreground"
            >
              {open ? "Close" : "Apply for Leave"}
            </button>
            <button
              onClick={() =>
                downloadCsv(
                  "leave-report.csv",
                  ["Type", "From", "To", "Days", "Reason", "Status"],
                  shown.map((l) => [l.leave_type, l.start_date, l.end_date, l.days, l.reason, l.status]),
                )
              }
              className="rounded-md border border-primary px-4 py-1.5 text-xs font-semibold text-primary"
            >
              Download Report
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Days" value={totalDays} tone="bg-sky-500" />
          <StatCard label="Pending" value={leaves.filter((l) => l.status === "pending").length} tone="bg-amber-400" />
          <StatCard label="Approved" value={leaves.filter((l) => l.status === "approved").length} tone="bg-emerald-500" />
          <StatCard label="Rejected" value={leaves.filter((l) => l.status === "rejected").length} tone="bg-destructive" />
        </div>
      </Card>

      {open && (
        <Card title="Apply for leave">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Leave Type</label>
              <select
                value={form.leave_type}
                onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {["Casual", "Sick", "Earned", "Unpaid"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Reason</label>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex justify-end">
            <button
              onClick={submit}
              disabled={saving}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit Leave"}
            </button>
          </div>
        </Card>
      )}

      <Card title="Filters">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Months</option>
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => {
              setMonth("all");
              setYear(new Date().getFullYear());
              setFilter("all");
            }}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </Card>

      <Card
        title="Leave applications"
        action={
          <span className="text-[11px] font-semibold text-primary">
            Showing {shown.length} of {leaves.length} Applications
          </span>
        }
      >
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No leaves found</p>
            <p className="text-xs text-muted-foreground">Try changing your filters or apply for a new leave.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left">
                <tr>
                  <Th>Type</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Days</Th>
                  <Th>Reason</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.id} className="border-b border-border/60">
                    <Td>{l.leave_type}</Td>
                    <Td>{l.start_date}</Td>
                    <Td>{l.end_date}</Td>
                    <Td>{l.days}</Td>
                    <Td>
                      <span className="line-clamp-1 max-w-[16rem] text-muted-foreground">{l.reason}</span>
                    </Td>
                    <Td>
                      <Pill status={l.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Salary ──────────────────────────────────────────────

function SalaryTab() {
  const fetchSalary = useServerFn(getSalaryRecords);
  const { data } = useQuery({ queryKey: ["emp-salary"], queryFn: () => fetchSalary() });
  const rows = (data ?? []) as SalaryRow[];

  const [month, setMonth] = useState<"all" | number>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const shown = rows.filter((r) => (month === "all" || r.period_month === month) && r.period_year === year);
  const totalEarned = rows.reduce((a, r) => a + Number(r.net_pay), 0);
  const avg = rows.length ? totalEarned / rows.length : 0;
  const deductions = rows.reduce((a, r) => a + Number(r.deductions), 0);
  const pending = rows.filter((r) => r.status === "pending").reduce((a, r) => a + Number(r.net_pay), 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((a, r) => a + Number(r.net_pay), 0);

  return (
    <div className="space-y-5">
      <Card
        title="My salary"
        action={
          <button
            onClick={() =>
              downloadCsv(
                "salary-report.csv",
                ["Period", "Days", "Basic", "Earnings", "Deductions", "Net Pay", "Status", "Paid On"],
                shown.map((r) => [
                  `${months[r.period_month - 1]} ${r.period_year}`,
                  r.days,
                  r.basic_salary,
                  r.earnings,
                  r.deductions,
                  r.net_pay,
                  r.status,
                  r.paid_on ?? "",
                ]),
              )
            }
            className="rounded-md border border-primary px-4 py-1.5 text-xs font-semibold text-primary"
          >
            Download Report
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Earned" value={inr(totalEarned)} tone="bg-sky-500" />
          <StatCard label="Average Salary" value={inr(avg)} tone="bg-emerald-500" />
          <StatCard label="Total Deductions" value={inr(deductions)} tone="bg-destructive" />
          <StatCard label="Pending Payments" value={inr(pending)} tone="bg-amber-400" />
          <StatCard label="Paid Payments" value={inr(paid)} tone="bg-teal-500" />
        </div>
      </Card>

      <Card
        title="Filter salary records"
        action={
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="all">All Months</option>
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setMonth("all");
                setYear(new Date().getFullYear());
              }}
              className="rounded-md border border-input px-3 py-1 text-sm"
            >
              Clear Filters
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left">
              <tr>
                <Th>Period</Th>
                <Th>Basic Salary</Th>
                <Th>Earnings</Th>
                <Th>Deductions</Th>
                <Th>Net Pay</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No salary records yet.
                  </td>
                </tr>
              )}
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <Td>
                    <p className="font-medium">
                      {months[r.period_month - 1]} {r.period_year}
                    </p>
                    <p className="text-xs text-muted-foreground">Days: {r.days}</p>
                  </Td>
                  <Td>{inr(r.basic_salary)}</Td>
                  <Td><span className="text-emerald-600">{inr(r.earnings)}</span></Td>
                  <Td>{inr(r.deductions)}</Td>
                  <Td>{inr(r.net_pay)}</Td>
                  <Td>
                    <Pill status={r.status} />
                    {r.paid_on && <p className="mt-0.5 text-[11px] text-muted-foreground">Paid: {r.paid_on}</p>}
                  </Td>
                  <Td>
                    <div className="flex gap-1 text-primary">
                      <span className="rounded border border-input p-1"><Download className="h-3.5 w-3.5" /></span>
                      <span className="rounded border border-input p-1"><Eye className="h-3.5 w-3.5" /></span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Requests ────────────────────────────────────────────

function RequestsTab() {
  const queryClient = useQueryClient();
  const fetchRequests = useServerFn(getEmployeeRequests);
  const create = useServerFn(createEmployeeRequest);
  const { data } = useQuery({ queryKey: ["emp-requests"], queryFn: () => fetchRequests() });
  const rows = (data ?? []) as RequestRow[];

  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ request_type: "Salary Query", details: "", note: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const shown = rows.filter(
    (r) => (type === "all" || r.request_type === type) && (status === "all" || r.status === status),
  );

  async function submit() {
    if (!form.details.trim()) {
      setError("Please add request details.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await create({ data: { ...form, details: form.details.trim() } });
      await queryClient.invalidateQueries({ queryKey: ["emp-requests"] });
      setForm({ request_type: "Salary Query", details: "", note: "" });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card
        title="My requests"
        action={
          <div className="flex items-center gap-2">
            <span className="rounded bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              Remaining: {Math.max(0, 5 - rows.length)}
            </span>
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground"
            >
              {open ? "Close" : "New Request"}
            </button>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["emp-requests"] })}
              className="rounded-md border border-input px-3 py-1.5 text-xs"
            >
              Refresh
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Request Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Types</option>
              {["Salary Query", "Attendance", "Document", "Other"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button
            onClick={() => {
              setType("all");
              setStatus("all");
            }}
            className="rounded-md border border-input px-4 py-2 text-sm"
          >
            Reset
          </button>
        </div>
      </Card>

      {open && (
        <Card title="New request">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={form.request_type}
                onChange={(e) => setForm({ ...form, request_type: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {["Salary Query", "Attendance", "Document", "Other"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Details</label>
              <input
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Note</label>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex justify-end">
            <button
              onClick={submit}
              disabled={saving}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-60"
            >
              {saving ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </Card>
      )}

      <Card title="Requests list">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left">
              <tr>
                <Th>Type</Th>
                <Th>Details</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No requests found.
                  </td>
                </tr>
              )}
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <Td>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {r.request_type}
                    </span>
                  </Td>
                  <Td>
                    <p className="font-medium">{r.details}</p>
                    {r.note && <p className="line-clamp-1 max-w-[18rem] text-xs text-muted-foreground">{r.note}</p>}
                  </Td>
                  <Td>
                    <Pill status={r.status} />
                  </Td>
                  <Td>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Showing {shown.length} request(s)</span>
          <div className="flex gap-2">
            <span className="rounded bg-accent/15 px-2 py-0.5 font-semibold text-accent">
              Pending: {rows.filter((r) => r.status === "pending").length}
            </span>
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700">
              Approved: {rows.filter((r) => r.status === "approved").length}
            </span>
            <span className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
              <XCircle className="h-3 w-3" /> Rejected: {rows.filter((r) => r.status === "rejected").length}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
