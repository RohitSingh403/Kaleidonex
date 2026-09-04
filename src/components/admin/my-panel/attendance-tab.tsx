import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Mail, CalendarRange } from "lucide-react";
import {
  getAttendance,
  markAttendance,
  type AttendanceStatus,
} from "@/lib/employee.functions";
import {
  type AttendanceRow,
  months,
  statusLabels,
  statusDotColors,
} from "./types";
import { CustomSelect } from "@/components/ui/custom-select";

export function AttendanceWorkspace() {
  const [view, setView] = useState<"mark" | "monthly">("mark");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {([
          { id: "mark", label: "Mark Attendance" },
          { id: "monthly", label: "Monthly Attendance Report" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              view === t.id
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
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
          href="mailto:hr@kaleidonex.com"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          <Mail className="h-4 w-4" /> Contact HR : hr@kaleidonex.com
        </a>
      </section>
    </div>
  );
}

export function MarkAttendance({ onDone, onViewMonthly }: { onDone: () => void; onViewMonthly?: () => void }) {
  const queryClient = useQueryClient();
  const fetchAttendance = useServerFn(getAttendance);
  const save = useServerFn(markAttendance);
  const { data } = useQuery({ queryKey: ["attendance"], queryFn: () => fetchAttendance() });
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

  useEffect(() => {
    if (existing) {
      if (existing.status) setStatus(existing.status);
      if (existing.check_in) setCheckIn(existing.check_in.slice(0, 5));
      if (existing.check_out) setCheckOut(existing.check_out.slice(0, 5));
      if (existing.daily_update) setUpdate(existing.daily_update);
    }
  }, [existing]);

  const hours = useMemo(() => {
    const cin = checkIn || (existing?.check_in ? existing.check_in.slice(0, 5) : "");
    const cout = checkOut || (existing?.check_out ? existing.check_out.slice(0, 5) : "");
    if (!cin || !cout) return 0;
    const [ih, im] = cin.split(":").map(Number);
    const [oh, om] = cout.split(":").map(Number);
    const mins = (oh! * 60 + om!) - (ih! * 60 + im!);
    return mins > 0 ? Math.round((mins / 60) * 10) / 10 : 0;
  }, [checkIn, checkOut, existing]);

  async function submit() {
    setError("");
    setSaving(true);
    const nowTime = new Date().toTimeString().slice(0, 8);
    const finalCheckIn = checkIn ? (checkIn.length === 5 ? `${checkIn}:00` : checkIn) : (existing?.check_in ?? nowTime);
    const finalCheckOut = checkOut ? (checkOut.length === 5 ? `${checkOut}:00` : checkOut) : (existing?.check_out ?? null);

    try {
      await save({
        data: {
          work_date: iso,
          status,
          check_in: finalCheckIn,
          check_out: finalCheckOut,
          daily_update: update.trim(),
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["attendance"] });
      await queryClient.invalidateQueries({ queryKey: ["workforce-snapshot"] });
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
              className={`px-4 py-2 text-xs font-semibold ${
                status === s ? "bg-emerald-600 text-white" : "bg-card text-amber-600 hover:bg-secondary"
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
                type="button"
                onClick={() => setCheckIn(new Date().toTimeString().slice(0, 5))}
                className="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
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
                type="button"
                onClick={() => setCheckOut(new Date().toTimeString().slice(0, 5))}
                className="shrink-0 rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
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
            type="button"
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
            type="button"
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
          <span className="text-muted-foreground">Check-in</span>
          <span className="font-semibold text-foreground">{existing?.check_in ? existing.check_in.slice(0, 5) : (checkIn || "—")}</span>
        </div>
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="text-muted-foreground">Check-out</span>
          <span className="font-semibold text-foreground">{existing?.check_out ? existing.check_out.slice(0, 5) : (checkOut || "—")}</span>
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

export function MonthlyAttendance() {
  const fetchAttendance = useServerFn(getAttendance);
  const { data } = useQuery({ queryKey: ["attendance"], queryFn: () => fetchAttendance() });
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
            <CustomSelect
              value={month}
              onValueChange={(val) => setMonth(Number(val))}
              options={months.map((m, i) => ({ value: i, label: m }))}
            />
            <CustomSelect
              value={year}
              onValueChange={(val) => setYear(Number(val))}
              options={[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => ({
                value: y,
                label: String(y),
              }))}
            />
            <button
              onClick={() => {
                setMonth(now.getMonth());
                setYear(now.getFullYear());
              }}
              className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-ink-foreground hover:opacity-90 cursor-pointer"
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
            <div key={`empty-${i}`} className="min-h-16 rounded-md border border-dashed border-border/40 p-1 opacity-30" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const r = byDay.get(day);
            return (
              <div
                key={day}
                className={`min-h-16 rounded-md border p-1 text-left text-xs ${
                  r ? "border-border bg-card" : "border-border/60 bg-muted/20"
                }`}
              >
                <span className="font-semibold text-muted-foreground">{day}</span>
                {r ? (
                  <div className="mt-1 space-y-0.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${statusDotColors[r.status]}`} />
                    <p className="truncate text-[10px]">{r.check_in?.slice(0, 5) ?? "-"}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
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

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <span className={`h-10 w-10 shrink-0 rounded-full ${tone}`} />
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}
